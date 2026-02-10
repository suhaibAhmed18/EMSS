import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'
import { telnyxService } from '@/lib/telnyx/service'

// Rate limiting (simple in-memory implementation)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 * 1000 // 15 minutes

function checkRateLimit(email: string): { allowed: boolean; remainingAttempts?: number } {
  const now = Date.now()
  const attempts = loginAttempts.get(email)

  if (!attempts || now > attempts.resetAt) {
    loginAttempts.set(email, { count: 1, resetAt: now + LOCKOUT_DURATION })
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 }
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return { allowed: false }
  }

  attempts.count++
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - attempts.count }
}

function resetRateLimit(email: string) {
  loginAttempts.delete(email)
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check rate limit
    const rateLimit = checkRateLimit(email.toLowerCase())
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again in 15 minutes.',
          rateLimited: true
        },
        { status: 429 }
      )
    }

    // Attempt sign in
    const user = await authServer.signIn(email, password, request)

    if (!user) {
      return NextResponse.json(
        { 
          error: 'Invalid credentials',
          remainingAttempts: rateLimit.remainingAttempts
        },
        { status: 401 }
      )
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          error: 'Email verification required. Please check your email and verify your account before logging in.',
          needsVerification: true,
          email: user.email
        },
        { status: 403 }
      )
    }

    // Check if user has an active subscription (payment completed)
    const supabase = getSupabaseAdmin()
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, subscription_plan, telnyx_phone_number')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user data:', userError)
      return NextResponse.json(
        { error: 'An error occurred. Please try again.' },
        { status: 500 }
      )
    }

    if (!userData?.subscription_status || userData.subscription_status !== 'active') {
      return NextResponse.json(
        { 
          error: 'Payment required. Please complete your payment to access your account.',
          needsPayment: true,
          email: user.email,
          userId: user.id,
          plan: userData?.subscription_plan || 'starter'
        },
        { status: 403 }
      )
    }

    // Reset rate limit on successful login
    resetRateLimit(email.toLowerCase())

    // Assign Telnyx phone number if not already assigned
    let phoneNumber = userData.telnyx_phone_number

    if (!phoneNumber && userData.subscription_status === 'active') {
      try {
        phoneNumber = await telnyxService.assignPhoneNumber(user.id)
        
        // Update user record with phone number
        await supabase
          .from('users')
          .update({ telnyx_phone_number: phoneNumber })
          .eq('id', user.id)

        console.log(`✅ Telnyx number ${phoneNumber} assigned to user ${user.id} on login`)
      } catch (error) {
        console.error('Failed to assign Telnyx number on login:', error)
        // Don't fail login if phone number assignment fails
      }
    }

    // Update last login timestamp
    await supabase
      .from('users')
      .update({ 
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // Create response with user data
    const response = NextResponse.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      phoneNumber,
      subscription: {
        status: userData.subscription_status,
        plan: userData.subscription_plan
      },
      needsVerification: false
    })

    // Set session cookie with secure options
    const sessionToken = `session-${user.id}`
    response.cookies.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    console.log('✅ Login successful, session cookie set for:', user.email)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 500 }
    )
  }
}
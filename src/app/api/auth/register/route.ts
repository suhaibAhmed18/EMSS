import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, plan } = await request.json()

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'First name, last name, email and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    const result = await authServer.signUp(email, password, undefined, plan, firstName, lastName)

    return NextResponse.json({ 
      user: result.user,
      needsVerification: result.needsVerification,
      message: result.needsVerification 
        ? 'Registration successful! Please complete payment to activate your account.'
        : 'Registration successful. You can now start using your account.'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration failed' },
      { status: 400 }
    )
  }
}
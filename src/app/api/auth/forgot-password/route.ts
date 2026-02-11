import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit-middleware'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitError = await withRateLimit(request, RATE_LIMITS.auth)
  if (rateLimitError) return rateLimitError

  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    await authServer.requestPasswordReset(email)

    return NextResponse.json({ 
      message: 'If an account with that email exists, we have sent a password reset link.'
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Failed to send password reset email' },
      { status: 500 }
    )
  }
}
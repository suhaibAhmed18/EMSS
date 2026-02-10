import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/login?error=missing_token&message=Verification link is invalid or expired.', request.url)
      )
    }

    const success = await authServer.verifyEmail(token)

    if (success) {
      return NextResponse.redirect(
        new URL('/auth/login?verified=true&message=Email verified successfully! You can now sign in to your account.', request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token&message=Verification link is invalid or has expired. Please request a new verification email.', request.url)
      )
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=verification_failed&message=Email verification failed. Please try again or contact support.', request.url)
    )
  }
}
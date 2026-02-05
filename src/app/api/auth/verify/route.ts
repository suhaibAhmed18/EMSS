import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/error?error=missing_token', request.url)
      )
    }

    const success = await authServer.verifyEmail(token)

    if (success) {
      return NextResponse.redirect(
        new URL('/auth/login?message=Email verified successfully! You can now sign in.', request.url)
      )
    } else {
      return NextResponse.redirect(
        new URL('/auth/error?error=invalid_token', request.url)
      )
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/error?error=verification_failed', request.url)
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'
import { tokenService } from '@/lib/auth/tokens'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Generate new verification token
    const verificationToken = tokenService.createVerificationToken(email)
    
    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken)

    return NextResponse.json({ 
      message: 'Verification email sent successfully'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
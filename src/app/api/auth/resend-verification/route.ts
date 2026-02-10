import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/database/client'
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

    const supabase = getSupabaseAdmin()

    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, email_verified')
      .eq('email', email)
      .single()

    if (error || !user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json({
        message: 'If an account exists with this email, a verification email has been sent.'
      })
    }

    // Check if already verified
    if (user.email_verified) {
      return NextResponse.json({
        message: 'Email is already verified. You can now login.'
      })
    }

    // Generate new verification token
    const verificationToken = tokenService.createVerificationToken(email)

    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, verificationToken)
      console.log(`✅ Verification email resent to: ${email}`)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      
      // In development, don't fail the request
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Email would be sent in production')
        return NextResponse.json({
          message: 'Verification email sent (development mode - check console)'
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again later.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Verification email has been sent. Please check your inbox.'
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

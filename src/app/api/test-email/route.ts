import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email/service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    console.log('🧪 Testing email send to:', email)
    console.log('🔑 Resend API Key configured:', !!process.env.RESEND_API_KEY)
    console.log('📧 From email:', process.env.EMAIL_FROM_ADDRESS || 'noreply@marketingpro.com')

    // Test sending a simple email
    const result = await emailService.sendEmail({
      to: email,
      subject: 'Test Email from MarketingPro',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from MarketingPro to verify Resend is working.</p>
        <p>If you received this, your email configuration is working!</p>
      `
    })

    console.log('✅ Email sent successfully:', result)

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      result 
    })
  } catch (error) {
    console.error('❌ Email test failed:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to send test email',
      details: error
    }, { status: 500 })
  }
}
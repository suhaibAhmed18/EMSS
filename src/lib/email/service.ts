import { Resend } from 'resend'
import { DevEmailLogger } from './dev-logger'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.includes('your_resend_api_key')
  ? new Resend(process.env.RESEND_API_KEY)
  : null

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export class EmailService {
  private fromEmail = process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev'
  private fromName = process.env.EMAIL_FROM_NAME || 'MarketingPro'

  async sendEmail({ to, subject, html }: EmailOptions) {
    // Check if Resend is properly configured
    if (!resend) {
      console.log('📧 EMAIL WOULD BE SENT (Resend not configured):')
      console.log(`To: ${to}`)
      console.log(`Subject: ${subject}`)
      console.log(`From: ${this.fromName} <${this.fromEmail}>`)
      console.log('---')
      
      // In development, we'll just log the email instead of sending
      return { id: 'test-email-' + Date.now() }
    }

    console.log('📧 Sending real email via Resend:')
    console.log(`To: ${to}`)
    console.log(`From: ${this.fromName} <${this.fromEmail}>`)
    console.log(`Subject: ${subject}`)

    try {
      const { data, error } = await resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [to],
        subject,
        html,
      })

      if (error) {
        console.error('❌ Resend error:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      console.log('✅ Email sent successfully:', data)
      return data
    } catch (error) {
      console.error('❌ Email service error:', error)
      throw error
    }
  }

  async sendVerificationEmail(email: string, verificationToken: string) {
    // Check if we're in development mode without real Resend API
    if (!resend) {
      DevEmailLogger.logEmail(email, 'Verify Your Email Address - MarketingPro', 'verification')
      return { id: 'dev-verification-' + Date.now() }
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">MarketingPro</h1>
              <p style="color: #888888; margin: 8px 0 0 0;">Premium Email & SMS Marketing for Shopify</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; padding: 40px; border: 1px solid #333333;">
              <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">Verify Your Email Address</h2>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                Welcome to MarketingPro! To complete your registration and secure your account, please verify your email address by clicking the button below.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verify Email Address
                </a>
              </div>
              
              <p style="color: #888888; font-size: 14px; line-height: 1.5; margin: 30px 0 0 0;">
                If you didn't create an account with us, you can safely ignore this email. The verification link will expire in 24 hours.
              </p>
              
              <div style="border-top: 1px solid #333333; margin-top: 30px; padding-top: 20px;">
                <p style="color: #666666; font-size: 12px; margin: 0;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="color: #3b82f6; word-break: break-all;">${verificationUrl}</span>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                © 2024 Marketing Platform Pro. All rights reserved.<br>
                ${process.env.COMPANY_ADDRESS || '123 Business St, Suite 100, City, State 12345'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address - MarketingPro',
      html
    })
  }

  async sendLoginNotification(email: string, loginDetails: { ip?: string, userAgent?: string, timestamp: Date }) {
    // Check if we're in development mode without real Resend API
    if (!resend) {
      DevEmailLogger.logEmail(email, 'New Login to Your Account - MarketingPro', 'login')
      return { id: 'dev-login-' + Date.now() }
    }
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Login to Your Account</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Marketing Platform Pro</h1>
              <p style="color: #888888; margin: 8px 0 0 0;">Security Notification</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; padding: 40px; border: 1px solid #333333;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; padding: 16px; margin-bottom: 20px;">
                  <div style="width: 24px; height: 24px; background: #ffffff; border-radius: 50%;"></div>
                </div>
                <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">New Login Detected</h2>
              </div>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0; text-align: center;">
                We detected a new login to your Marketing Platform Pro account. If this was you, no action is needed.
              </p>
              
              <div style="background: #111111; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #333333;">
                <h3 style="color: #ffffff; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Login Details:</h3>
                <div style="color: #cccccc; font-size: 14px; line-height: 1.6;">
                  <p style="margin: 5px 0;"><strong>Time:</strong> ${loginDetails.timestamp.toLocaleString()}</p>
                  ${loginDetails.ip ? `<p style="margin: 5px 0;"><strong>IP Address:</strong> ${loginDetails.ip}</p>` : ''}
                  ${loginDetails.userAgent ? `<p style="margin: 5px 0;"><strong>Device:</strong> ${loginDetails.userAgent}</p>` : ''}
                </div>
              </div>
              
              <div style="background: #1a1a1a; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #f59e0b; font-weight: 600; margin: 0 0 10px 0;">Security Notice</p>
                <p style="color: #cccccc; font-size: 14px; line-height: 1.5; margin: 0;">
                  If you didn't sign in to your account, please secure your account immediately by changing your password and reviewing your account activity.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-right: 10px;">
                  Review Account
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/forgot-password" style="display: inline-block; background: transparent; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; border: 1px solid #333333;">
                  Change Password
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                © 2024 Marketing Platform Pro. All rights reserved.<br>
                ${process.env.COMPANY_ADDRESS || '123 Business St, Suite 100, City, State 12345'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: 'New Login to Your Account - Marketing Platform Pro',
      html
    })
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    // Check if we're in development mode without real Resend API
    if (!resend) {
      DevEmailLogger.logEmail(email, 'Reset Your Password - MarketingPro', 'password_reset')
      return { id: 'dev-reset-' + Date.now() }
    }

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #000000; color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: 700; margin: 0;">Marketing Platform Pro</h1>
              <p style="color: #888888; margin: 8px 0 0 0;">Password Reset Request</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; padding: 40px; border: 1px solid #333333;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; padding: 16px; margin-bottom: 20px;">
                  <div style="width: 24px; height: 24px; background: #ffffff; border-radius: 50%;"></div>
                </div>
                <h2 style="color: #ffffff; font-size: 24px; font-weight: 600; margin: 0;">Reset Your Password</h2>
              </div>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                We received a request to reset your password for your Marketing Platform Pro account. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Reset Password
                </a>
              </div>
              
              <div style="background: #1a1a1a; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #ef4444; font-weight: 600; margin: 0 0 10px 0;">Important Security Information</p>
                <p style="color: #cccccc; font-size: 14px; line-height: 1.5; margin: 0;">
                  This password reset link will expire in 1 hour for security reasons. If you didn't request this reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>
              
              <div style="border-top: 1px solid #333333; margin-top: 30px; padding-top: 20px;">
                <p style="color: #666666; font-size: 12px; margin: 0;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="color: #3b82f6; word-break: break-all;">${resetUrl}</span>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #666666; font-size: 12px; margin: 0;">
                © 2024 Marketing Platform Pro. All rights reserved.<br>
                ${process.env.COMPANY_ADDRESS || '123 Business St, Suite 100, City, State 12345'}
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password - Marketing Platform Pro',
      html
    })
  }
}

export const emailService = new EmailService()
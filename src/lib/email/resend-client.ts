import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export class ResendEmailService {
  /**
   * Verify a domain with Resend
   * This initiates domain verification which can take up to 2 days
   */
  async verifyDomain(domain: string): Promise<{ success: boolean; domainId?: string; error?: string }> {
    try {
      // Add domain to Resend
      const result = await resend.domains.create({ name: domain })
      
      if (result.error) {
        console.error('Resend domain creation error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { 
        success: true, 
        domainId: result.data?.id 
      }
    } catch (error) {
      console.error('Failed to verify domain with Resend:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Check domain verification status
   */
  async checkDomainStatus(domainId: string): Promise<{ verified: boolean; status: string }> {
    try {
      const result = await resend.domains.get(domainId)
      
      if (result.error) {
        console.error('Resend domain status error:', result.error)
        return { verified: false, status: 'error' }
      }

      return {
        verified: result.data?.status === 'verified',
        status: result.data?.status || 'pending'
      }
    } catch (error) {
      console.error('Failed to check domain status:', error)
      return { verified: false, status: 'error' }
    }
  }

  /**
   * Verify an email address with Resend
   * This initiates email verification which can take up to 2 days
   */
  async verifyEmail(email: string): Promise<{ success: boolean; emailId?: string; error?: string }> {
    try {
      // Add email to Resend
      const result = await resend.emails.create({
        from: email,
        to: email,
        subject: 'Verify your email address',
        html: '<p>Please verify this email address to use it as a sender.</p>'
      })
      
      if (result.error) {
        console.error('Resend email verification error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { 
        success: true, 
        emailId: result.data?.id 
      }
    } catch (error) {
      console.error('Failed to verify email with Resend:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email: string, verificationUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await resend.emails.send({
        from: 'noreply@yourdomain.com', // Replace with your verified domain
        to: email,
        subject: 'Verify your email address',
        html: `
          <h2>Verify your email address</h2>
          <p>Click the link below to verify your email address:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
          <p>This link will expire in 24 hours.</p>
          <p>Note: Email verification can take up to 2 days to complete.</p>
        `
      })
      
      if (result.error) {
        console.error('Resend send email error:', result.error)
        return { success: false, error: result.error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Failed to send verification email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

export const resendEmailService = new ResendEmailService()

// Professional email templates for Supabase Auth
import { getSupabaseAdmin } from '@/lib/database/client'

export interface EmailTemplate {
  id: string
  templateType: 'auth_verification' | 'password_reset' | 'welcome' | 'invitation' | 'notification'
  subject: string
  htmlContent: string
  textContent?: string
  variables: string[]
  isSystem: boolean
}

export class AuthEmailTemplates {
  private readonly companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Marketing Platform'
  private readonly companyUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.com'
  private readonly supportEmail = process.env.SUPPORT_EMAIL || 'support@yourapp.com'

  /**
   * Get email template by type
   */
  async getTemplate(templateType: string): Promise<EmailTemplate | null> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('template_type', templateType)
        .eq('is_system', true)
        .single()

      if (error || !data) {
        return null
      }

      return {
        id: (data as any).id,
        templateType: (data as any).template_type as any,
        subject: (data as any).subject,
        htmlContent: (data as any).html_content,
        textContent: (data as any).text_content,
        variables: (data as any).variables as string[],
        isSystem: (data as any).is_system
      }
    } catch (error) {
      console.error('Error getting email template:', error)
      return null
    }
  }

  /**
   * Render email template with variables
   */
  renderTemplate(
    template: EmailTemplate,
    variables: Record<string, string>
  ): { subject: string; htmlContent: string; textContent?: string } {
    const defaultVariables = {
      company_name: this.companyName,
      company_url: this.companyUrl,
      support_email: this.supportEmail,
      current_year: new Date().getFullYear().toString()
    }

    const allVariables = { ...defaultVariables, ...variables }

    let subject = template.subject
    let htmlContent = template.htmlContent
    let textContent = template.textContent

    // Replace variables in all content
    Object.entries(allVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      subject = subject.replace(regex, value)
      htmlContent = htmlContent.replace(regex, value)
      if (textContent) {
        textContent = textContent.replace(regex, value)
      }
    })

    return {
      subject,
      htmlContent,
      textContent
    }
  }

  /**
   * Get verification email content
   */
  async getVerificationEmail(verificationUrl: string, userEmail: string): Promise<{
    subject: string
    htmlContent: string
    textContent: string
  }> {
    const template = await this.getTemplate('auth_verification')
    
    if (!template) {
      // Fallback template
      return {
        subject: `Verify Your Email Address - ${this.companyName}`,
        htmlContent: this.getDefaultVerificationHTML(verificationUrl),
        textContent: this.getDefaultVerificationText(verificationUrl)
      }
    }

    const rendered = this.renderTemplate(template, {
      verification_url: verificationUrl,
      user_email: userEmail
    })

    return {
      subject: rendered.subject,
      htmlContent: rendered.htmlContent,
      textContent: rendered.textContent || this.getDefaultVerificationText(verificationUrl)
    }
  }

  /**
   * Get password reset email content
   */
  async getPasswordResetEmail(resetUrl: string, userEmail: string): Promise<{
    subject: string
    htmlContent: string
    textContent: string
  }> {
    const template = await this.getTemplate('password_reset')
    
    if (!template) {
      // Fallback template
      return {
        subject: `Reset Your Password - ${this.companyName}`,
        htmlContent: this.getDefaultPasswordResetHTML(resetUrl),
        textContent: this.getDefaultPasswordResetText(resetUrl)
      }
    }

    const rendered = this.renderTemplate(template, {
      reset_url: resetUrl,
      user_email: userEmail
    })

    return {
      subject: rendered.subject,
      htmlContent: rendered.htmlContent,
      textContent: rendered.textContent || this.getDefaultPasswordResetText(resetUrl)
    }
  }

  /**
   * Default verification HTML template
   */
  private getDefaultVerificationHTML(verificationUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa; 
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
            text-align: center; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); 
            color: white; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .content h2 { 
            color: #1a1a1a; 
            font-size: 24px; 
            margin-bottom: 20px; 
        }
        .content p { 
            margin-bottom: 20px; 
            color: #555; 
        }
        .button { 
            display: inline-block; 
            padding: 16px 32px; 
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            transition: transform 0.2s;
        }
        .button:hover { 
            transform: translateY(-2px); 
        }
        .button-container { 
            text-align: center; 
            margin: 30px 0; 
        }
        .footer { 
            text-align: center; 
            padding: 30px; 
            background: #f8f9fa; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef; 
        }
        .security-note { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 6px; 
            padding: 15px; 
            margin: 20px 0; 
            color: #856404; 
        }
        .url-fallback { 
            word-break: break-all; 
            color: #1a1a1a; 
            background: #f8f9fa; 
            padding: 10px; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to ${this.companyName}</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up! To complete your account setup and start using our platform, please verify your email address by clicking the button below.</p>
            
            <div class="button-container">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="url-fallback">${verificationUrl}</div>
            
            <div class="security-note">
                <strong>Security Notice:</strong> This verification link will expire in 24 hours for security reasons. If you didn't create an account, you can safely ignore this email.
            </div>
        </div>
        <div class="footer">
            <p>Need help? Contact our support team at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
  }

  /**
   * Default verification text template
   */
  private getDefaultVerificationText(verificationUrl: string): string {
    return `Welcome to ${this.companyName}

Thank you for signing up! Please verify your email address to complete your account setup.

Verify your email by clicking this link:
${verificationUrl}

This link will expire in 24 hours for security reasons.

If you didn't create an account, you can safely ignore this email.

Need help? Contact us at ${this.supportEmail}

© ${new Date().getFullYear()} ${this.companyName}. All rights reserved.`
  }

  /**
   * Default password reset HTML template
   */
  private getDefaultPasswordResetHTML(resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            margin: 0; 
            padding: 0; 
            background-color: #f8f9fa; 
        }
        .container { 
            max-width: 600px; 
            margin: 40px auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); 
        }
        .header { 
            text-align: center; 
            padding: 40px 20px; 
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); 
            color: white; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 28px; 
            font-weight: 700; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .content h2 { 
            color: #1a1a1a; 
            font-size: 24px; 
            margin-bottom: 20px; 
        }
        .content p { 
            margin-bottom: 20px; 
            color: #555; 
        }
        .button { 
            display: inline-block; 
            padding: 16px 32px; 
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); 
            color: white; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 16px;
            transition: transform 0.2s;
        }
        .button:hover { 
            transform: translateY(-2px); 
        }
        .button-container { 
            text-align: center; 
            margin: 30px 0; 
        }
        .footer { 
            text-align: center; 
            padding: 30px; 
            background: #f8f9fa; 
            color: #666; 
            font-size: 14px; 
            border-top: 1px solid #e9ecef; 
        }
        .security-notice { 
            background: #fff3cd; 
            border: 1px solid #ffeaa7; 
            border-radius: 6px; 
            padding: 20px; 
            margin: 20px 0; 
            color: #856404; 
        }
        .security-notice ul { 
            margin: 10px 0; 
            padding-left: 20px; 
        }
        .security-notice li { 
            margin-bottom: 5px; 
        }
        .url-fallback { 
            word-break: break-all; 
            color: #1a1a1a; 
            background: #f8f9fa; 
            padding: 10px; 
            border-radius: 4px; 
            font-family: monospace; 
            font-size: 14px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your ${this.companyName} account. Click the button below to create a new password.</p>
            
            <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <div class="url-fallback">${resetUrl}</div>
            
            <div class="security-notice">
                <strong>Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                    <li>For additional security questions, contact our support team</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>Need help? Contact our support team at <a href="mailto:${this.supportEmail}">${this.supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${this.companyName}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`
  }

  /**
   * Default password reset text template
   */
  private getDefaultPasswordResetText(resetUrl: string): string {
    return `Password Reset Request - ${this.companyName}

We received a request to reset your password for your account.

Reset your password by clicking this link:
${resetUrl}

SECURITY NOTICE:
- This link will expire in 1 hour for security reasons
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged until you create a new one

Need help? Contact us at ${this.supportEmail}

© ${new Date().getFullYear()} ${this.companyName}. All rights reserved.`
  }
}

export const authEmailTemplates = new AuthEmailTemplates()
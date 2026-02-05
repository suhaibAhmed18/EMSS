// Resend API client for email delivery
import { Resend } from 'resend'
import { config } from '../config'
import { EmailCampaign, Contact, CampaignSend } from '../database/types'

export interface SendResult {
  id: string
  success: boolean
  messageId?: string
  error?: string
}

export interface DeliveryStatus {
  messageId: string
  status: 'pending' | 'delivered' | 'bounced' | 'failed'
  deliveredAt?: Date
  bouncedAt?: Date
  error?: string
}

export interface DomainSetupResult {
  domain: string
  verified: boolean
  dnsRecords: Array<{
    type: string
    name: string
    value: string
  }>
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string
  variables: Array<{
    name: string
    type: string
    defaultValue?: string
  }>
}

export class ResendEmailService {
  private resend: Resend

  constructor() {
    this.resend = new Resend(config.resend.apiKey)
  }

  /**
   * Send a single email campaign to multiple recipients
   */
  async sendCampaign(
    campaign: EmailCampaign,
    recipients: Contact[]
  ): Promise<SendResult[]> {
    const results: SendResult[] = []

    for (const recipient of recipients) {
      try {
        // Skip recipients without email consent
        if (!recipient.email_consent) {
          results.push({
            id: recipient.id,
            success: false,
            error: 'No email consent'
          })
          continue
        }

        const result = await this.resend.emails.send({
          from: `${campaign.from_name} <${campaign.from_email}>`,
          to: [recipient.email],
          subject: this.personalizeContent(campaign.subject, recipient),
          html: this.personalizeContent(campaign.html_content, recipient),
          text: campaign.text_content 
            ? this.personalizeContent(campaign.text_content, recipient)
            : undefined,
          headers: {
            'X-Campaign-ID': campaign.id,
            'X-Contact-ID': recipient.id,
          },
          tags: [
            { name: 'campaign_id', value: campaign.id },
            { name: 'store_id', value: campaign.store_id },
            { name: 'campaign_type', value: 'bulk' }
          ]
        })

        results.push({
          id: recipient.id,
          success: true,
          messageId: result.data?.id
        })
      } catch (error) {
        results.push({
          id: recipient.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Send a transactional email using a template
   */
  async sendTransactional(
    template: EmailTemplate,
    recipient: Contact,
    data: Record<string, unknown> = {}
  ): Promise<SendResult> {
    try {
      // Skip recipients without email consent
      if (!recipient.email_consent) {
        return {
          id: recipient.id,
          success: false,
          error: 'No email consent'
        }
      }

      const personalizedData = { ...data, ...this.getPersonalizationData(recipient) }
      
      const result = await this.resend.emails.send({
        from: template.htmlContent.includes('{{from_email}}') 
          ? this.personalizeContent('{{from_email}}', recipient, personalizedData)
          : `noreply@${this.extractDomainFromEmail(recipient.email)}`,
        to: [recipient.email],
        subject: this.personalizeContent(template.subject, recipient, personalizedData),
        html: this.personalizeContent(template.htmlContent, recipient, personalizedData),
        text: template.textContent 
          ? this.personalizeContent(template.textContent, recipient, personalizedData)
          : undefined,
        headers: {
          'X-Template-ID': template.id,
          'X-Contact-ID': recipient.id,
        },
        tags: [
          { name: 'template_id', value: template.id },
          { name: 'campaign_type', value: 'transactional' }
        ]
      })

      return {
        id: recipient.id,
        success: true,
        messageId: result.data?.id
      }
    } catch (error) {
      return {
        id: recipient.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Set up custom domain for email sending
   */
  async setupCustomDomain(domain: string, storeId: string): Promise<DomainSetupResult> {
    try {
      const result = await this.resend.domains.create({
        name: domain,
        region: 'us-east-1' // Default region
      })

      // Handle the response properly
      if (result.error) {
        throw new Error(`Failed to setup domain: ${result.error.message}`)
      }

      const domainData = result.data
      if (!domainData) {
        throw new Error('No domain data returned from Resend')
      }

      return {
        domain: (domainData as any).name || domain,
        verified: (domainData as any).status === 'verified',
        dnsRecords: (domainData as any).records?.map((record: any) => ({
          type: record.type,
          name: record.name,
          value: record.value
        })) || []
      }
    } catch (error) {
      throw new Error(`Failed to setup domain: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Track delivery status of a sent email
   */
  async trackDelivery(messageId: string): Promise<DeliveryStatus> {
    try {
      const result = await this.resend.emails.get(messageId)
      
      // Handle the response properly
      if (result.error) {
        return {
          messageId,
          status: 'failed',
          error: result.error.message
        }
      }

      const emailData = result.data
      if (!emailData) {
        return {
          messageId,
          status: 'failed',
          error: 'No email data returned'
        }
      }

      const lastEvent = (emailData as any).last_event
      
      return {
        messageId,
        status: this.mapResendStatusToDeliveryStatus(lastEvent),
        deliveredAt: lastEvent === 'delivered' ? new Date() : undefined,
        bouncedAt: lastEvent === 'bounced' ? new Date() : undefined,
        error: lastEvent === 'delivery_delayed' || lastEvent === 'bounced' 
          ? 'Delivery failed' 
          : undefined
      }
    } catch (error) {
      return {
        messageId,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify domain setup status
   */
  async verifyDomain(domain: string): Promise<boolean> {
    try {
      const result = await this.resend.domains.verify(domain)
      
      // Handle the response properly
      if (result.error) {
        return false
      }

      const domainData = result.data
      return (domainData as any)?.status === 'verified'
    } catch (error) {
      return false
    }
  }

  /**
   * Get list of configured domains
   */
  async getDomains(): Promise<Array<{ name: string; status: string; verified: boolean }>> {
    try {
      const result = await this.resend.domains.list()
      
      // Handle the response properly
      if (result.error || !result.data) {
        return []
      }

      return Array.isArray(result.data) ? result.data.map((domain: any) => ({
        name: domain.name,
        status: domain.status,
        verified: domain.status === 'verified'
      })) : []
    } catch (error) {
      return []
    }
  }

  /**
   * Personalize email content with contact data
   */
  private personalizeContent(
    content: string, 
    contact: Contact, 
    additionalData: Record<string, unknown> = {}
  ): string {
    const data = { ...this.getPersonalizationData(contact), ...additionalData }
    
    let personalizedContent = content
    
    // Replace template variables
    Object.entries(data).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      personalizedContent = personalizedContent.replace(regex, String(value || ''))
    })
    
    return personalizedContent
  }

  /**
   * Get personalization data from contact
   */
  private getPersonalizationData(contact: Contact): Record<string, unknown> {
    return {
      first_name: contact.first_name || '',
      last_name: contact.last_name || '',
      email: contact.email,
      phone: contact.phone || '',
      total_spent: contact.total_spent || 0,
      order_count: contact.order_count || 0,
      full_name: [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Customer'
    }
  }

  /**
   * Extract domain from email address
   */
  private extractDomainFromEmail(email: string): string {
    return email.split('@')[1] || 'example.com'
  }

  /**
   * Map Resend status to our delivery status
   */
  private mapResendStatusToDeliveryStatus(status: string): 'pending' | 'delivered' | 'bounced' | 'failed' {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'delivered'
      case 'bounced':
      case 'complained':
        return 'bounced'
      case 'delivery_delayed':
        return 'failed'
      default:
        return 'pending'
    }
  }
}

// Export singleton instance
export const resendEmailService = new ResendEmailService()
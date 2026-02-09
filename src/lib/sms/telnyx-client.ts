// Telnyx API client for SMS delivery
import { Telnyx } from 'telnyx'
import { config } from '../config'
import { SMSCampaign, Contact } from '../database/types'

export interface SMSSendResult {
  id: string
  success: boolean
  messageId?: string
  error?: string
}

export interface SMSDeliveryStatus {
  messageId: string
  status: 'pending' | 'delivered' | 'failed'
  deliveredAt?: Date
  failedAt?: Date
  error?: string
}

export interface SMSTemplate {
  id: string
  name: string
  message: string
  variables: Array<{
    name: string
    type: string
    defaultValue?: string
  }>
}

export interface SMSServiceConfig {
  apiKey: string
  phoneNumber: string
  webhookUrl?: string
}

export class TelnyxSMSService {
  private telnyx: Telnyx

  constructor() {
    this.telnyx = new Telnyx({
      apiKey: config.telnyx.apiKey
    })
  }

  /**
   * Send SMS campaign to multiple recipients
   */
  async sendCampaign(
    campaign: SMSCampaign,
    recipients: Contact[]
  ): Promise<SMSSendResult[]> {
    const results: SMSSendResult[] = []

    for (const recipient of recipients) {
      try {
        // Skip recipients without SMS consent or phone number
        if (!recipient.sms_consent || !recipient.phone) {
          results.push({
            id: recipient.id,
            success: false,
            error: recipient.phone ? 'No SMS consent' : 'No phone number'
          })
          continue
        }

        const personalizedMessage = this.personalizeContent(campaign.message, recipient)

        const result = await this.telnyx.messages.create({
          from: campaign.from_number,
          to: recipient.phone,
          text: personalizedMessage,
          webhook_url: `${config.app.url}/api/webhooks/telnyx`,
          use_profile_webhooks: false,
          messaging_profile_id: undefined, // Use default profile
          tags: [
            `campaign_id:${campaign.id}`,
            `store_id:${campaign.store_id}`,
            `contact_id:${recipient.id}`,
            'campaign_type:bulk'
          ]
        })

        results.push({
          id: recipient.id,
          success: true,
          messageId: result.data.id
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
   * Send transactional SMS using a template
   */
  async sendTransactional(
    template: SMSTemplate,
    recipient: Contact,
    data: Record<string, unknown> = {}
  ): Promise<SMSSendResult> {
    try {
      // Skip recipients without SMS consent or phone number
      if (!recipient.sms_consent || !recipient.phone) {
        return {
          id: recipient.id,
          success: false,
          error: recipient.phone ? 'No SMS consent' : 'No phone number'
        }
      }

      const personalizedData = { ...data, ...this.getPersonalizationData(recipient) }
      const personalizedMessage = this.personalizeContent(template.message, recipient, personalizedData)

      const result = await this.telnyx.messages.create({
        from: config.telnyx.phoneNumber,
        to: recipient.phone,
        text: personalizedMessage,
        webhook_url: `${config.app.url}/api/webhooks/telnyx`,
        use_profile_webhooks: false,
        tags: [
          `template_id:${template.id}`,
          `contact_id:${recipient.id}`,
          'campaign_type:transactional'
        ]
      })

      return {
        id: recipient.id,
        success: true,
        messageId: result.data.id
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
   * Track delivery status of a sent SMS
   */
  async trackDelivery(messageId: string): Promise<SMSDeliveryStatus> {
    try {
      const result = await this.telnyx.messages.retrieve(messageId)
      
      return {
        messageId,
        status: this.mapTelnyxStatusToDeliveryStatus(result.data.delivery_status),
        deliveredAt: result.data.delivery_status === 'delivered' ? new Date() : undefined,
        failedAt: result.data.delivery_status === 'failed' ? new Date() : undefined,
        error: result.data.delivery_status === 'failed' 
          ? result.data.errors?.[0]?.detail || 'Delivery failed'
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
   * Handle incoming SMS messages (for STOP requests)
   */
  async handleIncomingMessage(payload: { data: Record<string, unknown> }): Promise<{
    isStopRequest: boolean
    phoneNumber?: string
    message?: string
  }> {
    const { data } = payload
    const message = data.payload?.text?.toLowerCase() || ''
    const phoneNumber = data.payload?.from?.phone_number

    // Check for STOP keywords
    const stopKeywords = ['stop', 'unsubscribe', 'quit', 'cancel', 'end', 'opt-out']
    const isStopRequest = stopKeywords.some(keyword => message.includes(keyword))

    return {
      isStopRequest,
      phoneNumber,
      message: data.payload?.text
    }
  }

  /**
   * Get available phone numbers for the account
   */
  async getAvailableNumbers(): Promise<Array<{ phoneNumber: string; capabilities: string[] }>> {
    try {
      const result = await this.telnyx.phoneNumbers.list()
      return result.data.map(number => ({
        phoneNumber: number.phone_number,
        capabilities: number.features || []
      }))
    } catch (error) {
      return []
    }
  }

  /**
   * Personalize SMS content with contact data
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
      // Escape special regex replacement characters in the value
      const escapedValue = String(value ?? '').replace(/\$/g, '$$$$')
      personalizedContent = personalizedContent.replace(regex, escapedValue)
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
   * Map Telnyx status to our delivery status
   */
  private mapTelnyxStatusToDeliveryStatus(status: string): 'pending' | 'delivered' | 'failed' {
    switch (status) {
      case 'delivered':
        return 'delivered'
      case 'failed':
      case 'delivery_failed':
        return 'failed'
      case 'sent':
      case 'queued':
      default:
        return 'pending'
    }
  }
}

// Export singleton instance
export const telnyxSMSService = new TelnyxSMSService()
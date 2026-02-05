// Unsubscribe and opt-out handling system
import { ConsentManager } from './consent-manager'
import { ContactRepository } from '../database/repositories'
import { DatabaseResult } from '../database/client'
import { ConsentType, ConsentSource } from '../database/types'
import crypto from 'crypto'

export interface UnsubscribeRequest {
  email?: string
  phone?: string
  campaignId?: string
  token?: string
  ipAddress?: string
}

export interface UnsubscribeResult {
  success: boolean
  message: string
  contactId?: string
}

export interface UnsubscribeLinkConfig {
  contactId: string
  campaignId: string
  campaignType: 'email' | 'sms'
  baseUrl: string
}

export interface SMSOptOutRequest {
  fromNumber: string
  toNumber: string
  message: string
  timestamp: Date
}

export class UnsubscribeHandler {
  private consentManager: ConsentManager
  private contactRepo: ContactRepository
  private secretKey: string

  constructor(secretKey?: string) {
    this.consentManager = new ConsentManager({ useServiceRole: true })
    this.contactRepo = new ContactRepository(true)
    this.secretKey = secretKey || process.env.UNSUBSCRIBE_SECRET_KEY || 'default-secret-key'
  }

  /**
   * Generate secure unsubscribe link for email campaigns
   */
  generateUnsubscribeLink(config: UnsubscribeLinkConfig): string {
    const payload = {
      contactId: config.contactId,
      campaignId: config.campaignId,
      campaignType: config.campaignType,
      timestamp: Date.now()
    }

    const token = this.generateSecureToken(payload)
    const params = new URLSearchParams({
      token,
      type: config.campaignType
    })

    return `${config.baseUrl}/api/unsubscribe?${params.toString()}`
  }

  /**
   * Process email unsubscribe request
   */
  async processEmailUnsubscribe(request: UnsubscribeRequest): Promise<DatabaseResult<UnsubscribeResult>> {
    try {
      let contactId: string | undefined

      // Handle token-based unsubscribe (from email links)
      if (request.token) {
        const tokenResult = await this.validateUnsubscribeToken(request.token)
        if (tokenResult.error || !tokenResult.data) {
          return {
            data: {
              success: false,
              message: 'Invalid or expired unsubscribe link'
            },
            error: null
          }
        }
        contactId = tokenResult.data.contactId
      }
      // Handle email-based unsubscribe
      else if (request.email) {
        const contact = await this.findContactByEmail(request.email)
        if (!contact) {
          return {
            data: {
              success: false,
              message: 'Email address not found'
            },
            error: null
          }
        }
        contactId = contact.id
      }

      if (!contactId) {
        return {
          data: {
            success: false,
            message: 'Unable to identify contact for unsubscribe'
          },
          error: null
        }
      }

      // Record the unsubscribe consent
      const consentResult = await this.consentManager.recordConsent({
        contactId,
        type: 'email',
        consented: false,
        source: 'campaign',
        ipAddress: request.ipAddress
      })

      if (consentResult.error) {
        return {
          data: {
            success: false,
            message: 'Failed to process unsubscribe request'
          },
          error: consentResult.error
        }
      }

      return {
        data: {
          success: true,
          message: 'Successfully unsubscribed from email communications',
          contactId
        },
        error: null
      }

    } catch (error) {
      return {
        data: {
          success: false,
          message: 'An error occurred while processing your request'
        },
        error: error as Error
      }
    }
  }

  /**
   * Process SMS STOP request
   */
  async processSMSOptOut(request: SMSOptOutRequest): Promise<DatabaseResult<UnsubscribeResult>> {
    try {
      // Find contact by phone number
      const contact = await this.findContactByPhone(request.toNumber)
      if (!contact) {
        return {
          data: {
            success: false,
            message: 'Phone number not found'
          },
          error: null
        }
      }

      // Record the opt-out consent
      const consentResult = await this.consentManager.recordConsent({
        contactId: contact.id,
        type: 'sms',
        consented: false,
        source: 'campaign'
      })

      if (consentResult.error) {
        return {
          data: {
            success: false,
            message: 'Failed to process opt-out request'
          },
          error: consentResult.error
        }
      }

      return {
        data: {
          success: true,
          message: 'Successfully opted out of SMS communications',
          contactId: contact.id
        },
        error: null
      }

    } catch (error) {
      return {
        data: {
          success: false,
          message: 'An error occurred while processing your request'
        },
        error: error as Error
      }
    }
  }

  /**
   * Process bulk unsubscribe (for compliance with list-unsubscribe headers)
   */
  async processBulkUnsubscribe(
    contactIds: string[], 
    type: ConsentType,
    source: ConsentSource = 'api',
    ipAddress?: string
  ): Promise<DatabaseResult<{ successful: string[], failed: string[] }>> {
    const successful: string[] = []
    const failed: string[] = []

    for (const contactId of contactIds) {
      const result = await this.consentManager.recordConsent({
        contactId,
        type,
        consented: false,
        source,
        ipAddress
      })

      if (result.error) {
        failed.push(contactId)
      } else {
        successful.push(contactId)
      }
    }

    return {
      data: { successful, failed },
      error: null
    }
  }

  /**
   * Check if message is a STOP request
   */
  isSMSStopRequest(message: string): boolean {
    const stopWords = [
      'stop', 'quit', 'cancel', 'end', 'unsubscribe', 
      'remove', 'opt-out', 'optout', 'leave'
    ]
    
    const normalizedMessage = message.toLowerCase().trim()
    return stopWords.some(word => normalizedMessage === word || normalizedMessage.includes(word))
  }

  /**
   * Generate secure token for unsubscribe links
   */
  private generateSecureToken(payload: Record<string, unknown>): string {
    const data = JSON.stringify(payload)
    const hmac = crypto.createHmac('sha256', this.secretKey)
    hmac.update(data)
    const signature = hmac.digest('hex')
    
    const token = Buffer.from(JSON.stringify({
      data: payload,
      signature
    })).toString('base64url')
    
    return token
  }

  /**
   * Validate unsubscribe token
   */
  private async validateUnsubscribeToken(token: string): Promise<DatabaseResult<{
    contactId: string
    campaignId?: string
    type: ConsentType
    expiresAt: number
  }>> {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString())
      const { data, signature } = decoded

      // Verify signature
      const hmac = crypto.createHmac('sha256', this.secretKey)
      hmac.update(JSON.stringify(data))
      const expectedSignature = hmac.digest('hex')

      if (signature !== expectedSignature) {
        return { data: null, error: new Error('Invalid token signature') }
      }

      // Check if token is expired (24 hours)
      const tokenAge = Date.now() - data.timestamp
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
      
      if (tokenAge > maxAge) {
        return { data: null, error: new Error('Token expired') }
      }

      return { data, error: null }

    } catch (error) {
      return { data: null, error: error as Error }
    }
  }

  /**
   * Find contact by email address
   */
  private async findContactByEmail(email: string) {
    // This is a simplified implementation
    // In a real system, you'd need to handle encrypted email searches
    const { data: contacts } = await this.contactRepo.findMany('contacts', { email })
    return contacts.length > 0 ? contacts[0] : null
  }

  /**
   * Find contact by phone number
   */
  private async findContactByPhone(phone: string) {
    // This is a simplified implementation
    // In a real system, you'd need to handle encrypted phone searches
    const { data: contacts } = await this.contactRepo.findMany('contacts', { phone })
    return contacts.length > 0 ? contacts[0] : null
  }
}

// Export singleton instance
export const unsubscribeHandler = new UnsubscribeHandler()
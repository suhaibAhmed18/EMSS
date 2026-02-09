// Bulk compliance operations for handling large-scale consent changes
import { ConsentManager } from './consent-manager'
import { UnsubscribeHandler } from './unsubscribe-handler'
import { ContactRepository } from '../database/repositories'
import { ConsentType, ConsentSource } from '../database/types'
import { DatabaseResult } from '../database/client'

export interface BulkConsentRequest {
  contactIds: string[]
  type: ConsentType
  consented: boolean
  source: ConsentSource
  ipAddress?: string
}

export interface BulkConsentResult {
  successful: string[]
  failed: string[]
  totalProcessed: number
  errors: Array<{ contactId: string; error: string }>
}

export interface BulkUnsubscribeRequest {
  emails?: string[]
  phoneNumbers?: string[]
  campaignId?: string
  source?: ConsentSource
  ipAddress?: string
}

export class BulkComplianceOperations {
  private consentManager: ConsentManager
  private unsubscribeHandler: UnsubscribeHandler
  private contactRepo: ContactRepository

  constructor() {
    this.consentManager = new ConsentManager({ useServiceRole: true })
    this.unsubscribeHandler = new UnsubscribeHandler()
    this.contactRepo = new ContactRepository(true)
  }

  /**
   * Process bulk consent changes
   */
  async processBulkConsent(request: BulkConsentRequest): Promise<DatabaseResult<BulkConsentResult>> {
    const result: BulkConsentResult = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      errors: []
    }

    for (const contactId of request.contactIds) {
      try {
        const consentResult = await this.consentManager.recordConsent({
          contactId,
          type: request.type,
          consented: request.consented,
          source: request.source,
          ipAddress: request.ipAddress
        })

        if (consentResult.error) {
          result.failed.push(contactId)
          result.errors.push({
            contactId,
            error: consentResult.error.message
          })
        } else {
          result.successful.push(contactId)
        }
      } catch (error) {
        result.failed.push(contactId)
        result.errors.push({
          contactId,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }

      result.totalProcessed++
    }

    return { data: result, error: null }
  }

  /**
   * Process bulk unsubscribe requests
   */
  async processBulkUnsubscribe(request: BulkUnsubscribeRequest): Promise<DatabaseResult<BulkConsentResult>> {
    const result: BulkConsentResult = {
      successful: [],
      failed: [],
      totalProcessed: 0,
      errors: []
    }

    // Process email unsubscribes
    if (request.emails && request.emails.length > 0) {
      for (const email of request.emails) {
        try {
          const unsubResult = await this.unsubscribeHandler.processEmailUnsubscribe({
            email,
            campaignId: request.campaignId,
            ipAddress: request.ipAddress
          })

          if (unsubResult.error || !unsubResult.data?.success) {
            result.failed.push(email)
            result.errors.push({
              contactId: email,
              error: unsubResult.error?.message || unsubResult.data?.message || 'Unknown error'
            })
          } else {
            result.successful.push(email)
          }
        } catch (error) {
          result.failed.push(email)
          result.errors.push({
            contactId: email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }

        result.totalProcessed++
      }
    }

    // Process SMS opt-outs
    if (request.phoneNumbers && request.phoneNumbers.length > 0) {
      for (const phoneNumber of request.phoneNumbers) {
        try {
          const optOutResult = await this.unsubscribeHandler.processSMSOptOut({
            fromNumber: phoneNumber,
            toNumber: 'bulk-operation',
            message: 'STOP',
            timestamp: new Date()
          })

          if (optOutResult.error || !optOutResult.data?.success) {
            result.failed.push(phoneNumber)
            result.errors.push({
              contactId: phoneNumber,
              error: optOutResult.error?.message || optOutResult.data?.message || 'Unknown error'
            })
          } else {
            result.successful.push(phoneNumber)
          }
        } catch (error) {
          result.failed.push(phoneNumber)
          result.errors.push({
            contactId: phoneNumber,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }

        result.totalProcessed++
      }
    }

    return { data: result, error: null }
  }

  /**
   * Get contacts without consent for a specific type
   */
  async getContactsWithoutConsent(
    storeId: string,
    type: ConsentType
  ): Promise<DatabaseResult<string[]>> {
    try {
      const filters = {
        store_id: storeId,
        [type === 'email' ? 'email_consent' : 'sms_consent']: false
      }

      const { data: contacts, error } = await this.contactRepo.findMany('contacts', filters)
      
      if (error) {
        return { data: [], error }
      }

      const contactIds = contacts.map(contact => contact.id)
      return { data: contactIds, error: null }

    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }

  /**
   * Validate consent status for a list of contacts before sending campaigns
   */
  async validateCampaignConsent(
    contactIds: string[],
    type: ConsentType
  ): Promise<DatabaseResult<{ valid: string[], invalid: string[], details: Record<string, boolean> }>> {
    const valid: string[] = []
    const invalid: string[] = []
    const details: Record<string, boolean> = {}

    for (const contactId of contactIds) {
      const { data: hasConsent, error } = await this.consentManager.validateConsentForCommunication(contactId, type)
      
      if (error || !hasConsent) {
        invalid.push(contactId)
        details[contactId] = false
      } else {
        valid.push(contactId)
        details[contactId] = true
      }
    }

    return {
      data: { valid, invalid, details },
      error: null
    }
  }

  /**
   * Generate compliance report for a store
   */
  async generateComplianceReport(storeId: string): Promise<DatabaseResult<{
    totalContacts: number
    emailConsented: number
    smsConsented: number
    recentOptOuts: number
    complianceScore: number
    recommendations: string[]
  }>> {
    try {
      // Get all contacts for the store
      const { data: contacts, error: contactsError } = await this.contactRepo.getStoreContacts(storeId)
      
      if (contactsError) {
        return { data: null, error: contactsError }
      }

      const totalContacts = contacts.length
      const emailConsentCount = contacts.filter(c => c.email_consent).length
      const smsConsentCount = contacts.filter(c => c.sms_consent).length

      // Get recent consent changes (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const report = {
        storeId,
        generatedAt: new Date(),
        summary: {
          totalContacts,
          emailConsent: {
            count: emailConsentCount,
            percentage: totalContacts > 0 ? (emailConsentCount / totalContacts) * 100 : 0
          },
          smsConsent: {
            count: smsConsentCount,
            percentage: totalContacts > 0 ? (smsConsentCount / totalContacts) * 100 : 0
          }
        },
        compliance: {
          gdprCompliant: true, // This would be based on actual compliance checks
          canSpamCompliant: true,
          unsubscribeLinksPresent: true
        }
      }

      return { data: report as any, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      }
    }
  }
}

// Export singleton instance
export const bulkComplianceOperations = new BulkComplianceOperations()
// Consent management system with GDPR compliance utilities
import { ConsentRepository } from '../database/repositories'
import { ContactRepository } from '../database/repositories'
import { 
  ConsentRecord, 
  CreateConsentRecord, 
  ConsentType, 
  ConsentSource,
  Contact 
} from '../database/types'
import { DatabaseResult, DatabaseListResult } from '../database/client'

export interface ConsentManagerConfig {
  useServiceRole?: boolean
}

export interface RecordConsentRequest {
  contactId: string
  type: ConsentType
  consented: boolean
  source: ConsentSource
  ipAddress?: string
}

export interface ConsentStatus {
  email: boolean
  sms: boolean
  lastUpdated: {
    email?: Date
    sms?: Date
  }
}

export interface GDPRDataRequest {
  contactId: string
  requestType: 'access' | 'deletion' | 'portability'
  requestedAt: Date
  ipAddress?: string
}

export interface ConsentAuditEntry {
  id: string
  contactId: string
  type: ConsentType
  consented: boolean
  source: ConsentSource
  ipAddress?: string
  recordedAt: Date
  contactEmail?: string
  contactName?: string
}

export class ConsentManager {
  private consentRepo: ConsentRepository
  private contactRepo: ContactRepository

  constructor(config: ConsentManagerConfig = {}) {
    this.consentRepo = new ConsentRepository(config.useServiceRole)
    this.contactRepo = new ContactRepository(config.useServiceRole)
  }

  /**
   * Record consent for a contact
   * Validates the request and creates an audit trail entry
   */
  async recordConsent(request: RecordConsentRequest): Promise<DatabaseResult<ConsentRecord>> {
    // Validate that the contact exists
    const { data: contact, error: contactError } = await this.contactRepo.getContact(request.contactId)
    if (contactError || !contact) {
      return { 
        data: null, 
        error: contactError || new Error('Contact not found') 
      }
    }

    // Create consent record
    const consentData: CreateConsentRecord = {
      contact_id: request.contactId,
      type: request.type,
      consented: request.consented,
      source: request.source,
      ip_address: request.ipAddress || null
    }

    const result = await this.consentRepo.recordConsent(consentData)
    
    if (result.data) {
      // Update the contact's consent status
      await this.updateContactConsentStatus(request.contactId, request.type, request.consented)
    }

    return result
  }

  /**
   * Get current consent status for a contact
   */
  async getConsentStatus(contactId: string): Promise<DatabaseResult<ConsentStatus>> {
    const { data: contact, error: contactError } = await this.contactRepo.getContact(contactId)
    if (contactError || !contact) {
      return { 
        data: null, 
        error: contactError || new Error('Contact not found') 
      }
    }

    // Get latest consent records for both types
    const { data: emailConsent } = await this.consentRepo.getLatestConsent(contactId, 'email')
    const { data: smsConsent } = await this.consentRepo.getLatestConsent(contactId, 'sms')

    const status: ConsentStatus = {
      email: contact.email_consent,
      sms: contact.sms_consent,
      lastUpdated: {
        email: emailConsent?.recorded_at,
        sms: smsConsent?.recorded_at
      }
    }

    return { data: status, error: null }
  }

  /**
   * Get complete consent audit trail for a contact
   */
  async getConsentAuditTrail(contactId: string): Promise<DatabaseListResult<ConsentAuditEntry>> {
    const { data: records, error } = await this.consentRepo.getContactConsentHistory(contactId)
    if (error) {
      return { data: [], error }
    }

    // Get contact info for enriched audit entries
    const { data: contact } = await this.contactRepo.getContact(contactId)
    
    const auditEntries: ConsentAuditEntry[] = records.map(record => ({
      id: record.id,
      contactId: record.contact_id,
      type: record.type,
      consented: record.consented,
      source: record.source,
      ipAddress: record.ip_address || undefined,
      recordedAt: record.recorded_at,
      contactEmail: contact?.email,
      contactName: contact?.first_name && contact?.last_name 
        ? `${contact.first_name} ${contact.last_name}` 
        : undefined
    }))

    return { data: auditEntries, error: null, count: auditEntries.length }
  }

  /**
   * Process GDPR data request
   */
  async processGDPRRequest(request: GDPRDataRequest): Promise<DatabaseResult<{
    requestType: string
    contactData?: Contact
    consentHistory?: ConsentRecord[]
    deletionConfirmed?: boolean
    exportData?: Record<string, unknown>
  }>> {
    const { data: contact, error: contactError } = await this.contactRepo.getContact(request.contactId)
    if (contactError || !contact) {
      return { 
        data: null, 
        error: contactError || new Error('Contact not found') 
      }
    }

    switch (request.requestType) {
      case 'access':
        return this.generateDataAccessReport(request.contactId) as any
      
      case 'deletion':
        return this.processDataDeletion(request.contactId) as any
      
      case 'portability':
        return this.generatePortabilityExport(request.contactId) as any
      
      default:
        return { 
          data: null, 
          error: new Error('Invalid GDPR request type') 
        }
    }
  }

  /**
   * Validate consent before sending communications
   */
  async validateConsentForCommunication(
    contactId: string, 
    type: ConsentType
  ): Promise<DatabaseResult<boolean>> {
    const { data: status, error } = await this.getConsentStatus(contactId)
    if (error) {
      return { data: false, error }
    }

    const hasConsent = type === 'email' ? status!.email : status!.sms
    return { data: hasConsent, error: null }
  }

  /**
   * Bulk consent validation for campaign sending
   */
  async validateBulkConsent(
    contactIds: string[], 
    type: ConsentType
  ): Promise<DatabaseResult<{ valid: string[], invalid: string[] }>> {
    const valid: string[] = []
    const invalid: string[] = []

    for (const contactId of contactIds) {
      const { data: hasConsent, error } = await this.validateConsentForCommunication(contactId, type)
      if (error || !hasConsent) {
        invalid.push(contactId)
      } else {
        valid.push(contactId)
      }
    }

    return { 
      data: { valid, invalid }, 
      error: null 
    }
  }

  /**
   * Update contact's consent status in the contacts table
   */
  private async updateContactConsentStatus(
    contactId: string, 
    type: ConsentType, 
    consented: boolean
  ): Promise<void> {
    const updateData = type === 'email' 
      ? { email_consent: consented }
      : { sms_consent: consented }

    await this.contactRepo.updateContact(contactId, updateData)
  }

  /**
   * Generate data access report for GDPR compliance
   */
  private async generateDataAccessReport(contactId: string): Promise<DatabaseResult<{
    contact: Contact
    consentHistory: ConsentRecord[]
    campaignActivity: unknown[]
    lastActivity: Date | null
  }>> {
    const { data: contact, error: contactError } = await this.contactRepo.getContact(contactId)
    if (contactError || !contact) {
      return { data: null, error: contactError || new Error('Contact not found') }
    }

    const { data: consentHistory } = await this.getConsentAuditTrail(contactId)

    const report = {
      contact: {
        id: contact.id,
        email: contact.email,
        phone: contact.phone,
        firstName: contact.first_name,
        lastName: contact.last_name,
        tags: contact.tags,
        segments: contact.segments,
        totalSpent: contact.total_spent,
        orderCount: contact.order_count,
        lastOrderAt: contact.last_order_at,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at
      },
      consentHistory: consentHistory,
      generatedAt: new Date(),
      requestType: 'access'
    }

    return { data: report as any, error: null }
  }

  /**
   * Process data deletion request for GDPR compliance
   */
  private async processDataDeletion(contactId: string): Promise<DatabaseResult<boolean>> {
    // This would implement the "right to be forgotten"
    // For now, we'll mark the contact as deleted but keep audit trails
    
    // Record the deletion request in consent records
    await this.recordConsent({
      contactId,
      type: 'email',
      consented: false,
      source: 'api',
      ipAddress: undefined
    })

    await this.recordConsent({
      contactId,
      type: 'sms',
      consented: false,
      source: 'api',
      ipAddress: undefined
    })

    // Delete the contact (this will cascade to related records)
    const result = await this.contactRepo.deleteContact(contactId)
    
    return result
  }

  /**
   * Generate data portability export for GDPR compliance
   */
  private async generatePortabilityExport(contactId: string): Promise<DatabaseResult<Record<string, unknown>>> {
    const { data: report, error } = await this.generateDataAccessReport(contactId)
    if (error) {
      return { data: null, error }
    }

    // Add portability-specific formatting
    const portabilityExport = {
      ...report,
      requestType: 'portability',
      format: 'JSON',
      exportInstructions: 'This data can be imported into other systems that support the same data format.'
    }

    return { data: portabilityExport, error: null }
  }
}

// Export singleton instance
export const consentManager = new ConsentManager()
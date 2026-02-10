// Repository pattern for database operations with business logic
import { z } from 'zod'
import { 
  TypedDatabaseClient, 
  ContactManager, 
  createTypedSupabaseClient,
  createServiceSupabaseClient,
  DatabaseResult,
  DatabaseListResult 
} from './client'
import {
  Store,
  CreateStore,
  UpdateStore,
  UpdateStoreSchema,
  Contact,
  UpdateContact,
  UpdateContactSchema,
  EmailCampaign,
  CreateEmailCampaign,
  UpdateEmailCampaign,
  CreateEmailCampaignSchema,
  UpdateEmailCampaignSchema,
  SMSCampaign,
  CreateSMSCampaign,
  UpdateSMSCampaign,
  CreateSMSCampaignSchema,
  UpdateSMSCampaignSchema,
  CampaignTemplate,
  CreateCampaignTemplate,
  UpdateCampaignTemplate,
  CreateCampaignTemplateSchema,
  UpdateCampaignTemplateSchema,
  AutomationWorkflow,
  CreateAutomationWorkflow,
  UpdateAutomationWorkflow,
  CreateAutomationWorkflowSchema,
  UpdateAutomationWorkflowSchema,
  ConsentRecord,
  CreateConsentRecord,
  CreateConsentRecordSchema,
  CampaignSend,
  CreateCampaignSend,
  UpdateCampaignSend,
  CreateCampaignSendSchema,
  UpdateCampaignSendSchema
} from './types'

// Store Repository
export class StoreRepository extends TypedDatabaseClient {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async createStore(data: CreateStore): Promise<DatabaseResult<Store>> {
    return this.create('stores', data as any, z.any()) as any
  }

  async updateStore(id: string, data: UpdateStore): Promise<DatabaseResult<Store>> {
    return this.update('stores', id, data as any, z.any()) as any
  }

  async getStore(id: string): Promise<DatabaseResult<Store>> {
    return this.findById('stores', id) as any
  }

  async getStoreByDomain(domain: string): Promise<DatabaseResult<Store>> {
    const { data, error } = await this.findMany('stores', { shop_domain: domain })
    if (error) return { data: null, error }
    if (data.length === 0) return { data: null, error: new Error('Store not found') }
    return { data: data[0] as any, error: null }
  }

  async getUserStores(userId: string): Promise<DatabaseListResult<Store>> {
    return this.findMany('stores', { user_id: userId }) as any
  }

  async deleteStore(id: string): Promise<DatabaseResult<boolean>> {
    return this.delete('stores', id) as any
  }
}

// Contact Repository with encryption support
export class ContactRepository extends ContactManager {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async updateContact(id: string, data: UpdateContact): Promise<DatabaseResult<Contact>> {
    return this.update('contacts', id, data, UpdateContactSchema) as any
  }

  async getContact(id: string): Promise<DatabaseResult<Contact>> {
    const result = await this.findById('contacts', id)
    if (result.data) {
      try {
        result.data = await this.decryptContact(result.data as any) as any
      } catch (error) {
        return { data: null, error: error as Error }
      }
    }
    return result as any
  }

  async getStoreContacts(
    storeId: string,
    options?: {
      limit?: number
      offset?: number
      emailConsent?: boolean
      smsConsent?: boolean
    }
  ): Promise<DatabaseListResult<Contact>> {
    const filters: Record<string, unknown> = { store_id: storeId }
    
    if (options?.emailConsent !== undefined) {
      filters.email_consent = options.emailConsent
    }
    if (options?.smsConsent !== undefined) {
      filters.sms_consent = options.smsConsent
    }

    const result = await this.findMany('contacts', filters, {
      limit: options?.limit,
      offset: options?.offset,
      orderBy: 'created_at',
      ascending: false
    })

    // Decrypt all contacts - skip contacts that fail to decrypt instead of failing entire export
    if (result.data.length > 0) {
      const decryptedContacts: Contact[] = []
      let failedCount = 0
      
      for (const contact of result.data) {
        try {
          const decrypted = await this.decryptContact(contact as any)
          decryptedContacts.push(decrypted)
        } catch (error) {
          failedCount++
          console.error(`Failed to decrypt contact ${(contact as any).id}:`, error)
          // Skip this contact and continue with others
        }
      }
      
      if (failedCount > 0) {
        console.warn(`Skipped ${failedCount} contacts due to decryption errors`)
      }
      
      result.data = decryptedContacts as any
    }

    return result as any
  }

  async deleteContact(id: string): Promise<DatabaseResult<boolean>> {
    return this.delete('contacts', id) as any
  }

  async segmentContacts(
    storeId: string,
    criteria: {
      minTotalSpent?: number
      maxTotalSpent?: number
      minOrderCount?: number
      maxOrderCount?: number
      tags?: string[]
      hasEmailConsent?: boolean
      hasSMSConsent?: boolean
    }
  ): Promise<DatabaseListResult<Contact>> {
    // This would be implemented with more complex SQL queries
    // For now, we'll get all contacts and filter in memory (not efficient for large datasets)
    const { data: allContacts, error } = await this.getStoreContacts(storeId)
    
    if (error) return { data: [], error }

    const filteredContacts = allContacts.filter(contact => {
      if (criteria.minTotalSpent !== undefined && contact.total_spent < criteria.minTotalSpent) {
        return false
      }
      if (criteria.maxTotalSpent !== undefined && contact.total_spent > criteria.maxTotalSpent) {
        return false
      }
      if (criteria.minOrderCount !== undefined && contact.order_count < criteria.minOrderCount) {
        return false
      }
      if (criteria.maxOrderCount !== undefined && contact.order_count > criteria.maxOrderCount) {
        return false
      }
      if (criteria.tags && !criteria.tags.some(tag => contact.tags.includes(tag))) {
        return false
      }
      if (criteria.hasEmailConsent !== undefined && contact.email_consent !== criteria.hasEmailConsent) {
        return false
      }
      if (criteria.hasSMSConsent !== undefined && contact.sms_consent !== criteria.hasSMSConsent) {
        return false
      }
      return true
    })

    return { data: filteredContacts, error: null, count: filteredContacts.length }
  }
}

// Email Campaign Repository
export class EmailCampaignRepository extends TypedDatabaseClient {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async createCampaign(data: CreateEmailCampaign): Promise<DatabaseResult<EmailCampaign>> {
    return this.create('email_campaigns', data as any, CreateEmailCampaignSchema as any) as any
  }

  async updateCampaign(id: string, data: UpdateEmailCampaign): Promise<DatabaseResult<EmailCampaign>> {
    return this.update('email_campaigns', id, data as any, UpdateEmailCampaignSchema as any) as any
  }

  async getCampaign(id: string): Promise<DatabaseResult<EmailCampaign>> {
    return this.findById('email_campaigns', id) as any
  }

  async getStoreCampaigns(storeId: string): Promise<DatabaseListResult<EmailCampaign>> {
    return this.findMany('email_campaigns', { store_id: storeId }, {
      orderBy: 'created_at',
      ascending: false
    }) as any
  }

  async deleteCampaign(id: string): Promise<DatabaseResult<boolean>> {
    return this.delete('email_campaigns', id) as any
  }
}

// SMS Campaign Repository
export class SMSCampaignRepository extends TypedDatabaseClient {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async createCampaign(data: CreateSMSCampaign): Promise<DatabaseResult<SMSCampaign>> {
    return this.create('sms_campaigns', data as any, CreateSMSCampaignSchema as any) as any
  }

  async updateCampaign(id: string, data: UpdateSMSCampaign): Promise<DatabaseResult<SMSCampaign>> {
    return this.update('sms_campaigns', id, data as any, UpdateSMSCampaignSchema as any) as any
  }

  async getCampaign(id: string): Promise<DatabaseResult<SMSCampaign>> {
    return this.findById('sms_campaigns', id) as any
  }

  async getStoreCampaigns(storeId: string): Promise<DatabaseListResult<SMSCampaign>> {
    return this.findMany('sms_campaigns', { store_id: storeId }, {
      orderBy: 'created_at',
      ascending: false
    }) as any
  }

  async deleteCampaign(id: string): Promise<DatabaseResult<boolean>> {
    return this.delete('sms_campaigns', id) as any
  }
}

// Campaign Template Repository
export class CampaignTemplateRepository extends TypedDatabaseClient {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async createTemplate(data: CreateCampaignTemplate): Promise<DatabaseResult<CampaignTemplate>> {
    return this.create('campaign_templates', data as any, CreateCampaignTemplateSchema as any) as any
  }

  async updateTemplate(id: string, data: UpdateCampaignTemplate): Promise<DatabaseResult<CampaignTemplate>> {
    return this.update('campaign_templates', id, data as any, UpdateCampaignTemplateSchema as any) as any
  }

  async getTemplate(id: string): Promise<DatabaseResult<CampaignTemplate>> {
    return this.findById('campaign_templates', id) as any
  }

  async getStoreTemplates(
    storeId: string, 
    type?: 'email' | 'sms'
  ): Promise<DatabaseListResult<CampaignTemplate>> {
    const filters: Record<string, unknown> = { store_id: storeId }
    if (type) filters.type = type

    return this.findMany('campaign_templates', filters, {
      orderBy: 'created_at',
      ascending: false
    }) as any
  }

  async deleteTemplate(id: string): Promise<DatabaseResult<boolean>> {
    return this.delete('campaign_templates', id) as any
  }
}

// Automation Workflow Repository
export class AutomationWorkflowRepository extends TypedDatabaseClient {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async createWorkflow(data: CreateAutomationWorkflow): Promise<DatabaseResult<AutomationWorkflow>> {
    return this.create('automation_workflows', data as any, CreateAutomationWorkflowSchema as any) as any
  }

  async updateWorkflow(id: string, data: UpdateAutomationWorkflow): Promise<DatabaseResult<AutomationWorkflow>> {
    return this.update('automation_workflows', id, data as any, UpdateAutomationWorkflowSchema as any) as any
  }

  async getWorkflow(id: string): Promise<DatabaseResult<AutomationWorkflow>> {
    return this.findById('automation_workflows', id) as any
  }

  async getStoreWorkflows(storeId: string): Promise<DatabaseListResult<AutomationWorkflow>> {
    return this.findMany('automation_workflows', { store_id: storeId }, {
      orderBy: 'created_at',
      ascending: false
    }) as any
  }

  async getActiveWorkflows(storeId: string): Promise<DatabaseListResult<AutomationWorkflow>> {
    return this.findMany('automation_workflows', { 
      store_id: storeId, 
      is_active: true 
    }) as any
  }

  async deleteWorkflow(id: string): Promise<DatabaseResult<boolean>> {
    return this.delete('automation_workflows', id) as any
  }
}

// Consent Record Repository
export class ConsentRepository extends TypedDatabaseClient {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async recordConsent(data: CreateConsentRecord): Promise<DatabaseResult<ConsentRecord>> {
    return this.create('consent_records', data as any, CreateConsentRecordSchema as any) as any
  }

  async getContactConsentHistory(contactId: string): Promise<DatabaseListResult<ConsentRecord>> {
    return this.findMany('consent_records', { contact_id: contactId }, {
      orderBy: 'recorded_at',
      ascending: false
    }) as any
  }

  async getLatestConsent(
    contactId: string, 
    type: 'email' | 'sms'
  ): Promise<DatabaseResult<ConsentRecord>> {
    const { data, error } = await this.findMany('consent_records', {
      contact_id: contactId,
      type
    }, {
      orderBy: 'recorded_at',
      ascending: false,
      limit: 1
    })

    if (error) return { data: null, error }
    if (data.length === 0) return { data: null, error: new Error('No consent record found') }
    
    return { data: data[0] as any, error: null }
  }
}

// Campaign Send Repository
export class CampaignSendRepository extends TypedDatabaseClient {
  constructor(useServiceRole = false) {
    const client = useServiceRole ? createServiceSupabaseClient() : createTypedSupabaseClient()
    super(client)
  }

  async createSend(data: CreateCampaignSend): Promise<DatabaseResult<CampaignSend>> {
    return this.create('campaign_sends', data as any, CreateCampaignSendSchema as any) as any
  }

  async updateSend(id: string, data: UpdateCampaignSend): Promise<DatabaseResult<CampaignSend>> {
    return this.update('campaign_sends', id, data as any, UpdateCampaignSendSchema as any) as any
  }

  async getCampaignSends(campaignId: string): Promise<DatabaseListResult<CampaignSend>> {
    return this.findMany('campaign_sends', { campaign_id: campaignId }) as any
  }

  async getContactSends(contactId: string): Promise<DatabaseListResult<CampaignSend>> {
    return this.findMany('campaign_sends', { contact_id: contactId }, {
      orderBy: 'created_at',
      ascending: false
    }) as any
  }

  async updateSendStatus(
    externalMessageId: string,
    status: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed',
    errorMessage?: string
  ): Promise<DatabaseResult<CampaignSend>> {
    // Find the send by external message ID
    const { data: sends, error: findError } = await this.findMany('campaign_sends', {
      external_message_id: externalMessageId
    })

    if (findError) return { data: null, error: findError }
    if (sends.length === 0) return { data: null, error: new Error('Send not found') }

    const send = sends[0]
    const updateData: UpdateCampaignSend = {
      status,
      error_message: errorMessage || null
    }

    // Set timestamp based on status
    const now = new Date()
    switch (status) {
      case 'delivered':
        updateData.delivered_at = now
        break
      case 'opened':
        updateData.opened_at = now
        break
      case 'clicked':
        updateData.clicked_at = now
        break
      case 'bounced':
        updateData.bounced_at = now
        break
    }

    return this.update('campaign_sends', send.id, updateData as any, UpdateCampaignSendSchema as any) as any
  }
}
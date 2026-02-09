// Data Export System - Export utilities for all data types with CSV/JSON formats
import { 
  StoreRepository,
  ContactRepository,
  EmailCampaignRepository,
  SMSCampaignRepository,
  CampaignSendRepository,
  AutomationWorkflowRepository,
  ConsentRepository
} from '../database/repositories'
import { createServiceSupabaseClient } from '../database/client'
import { campaignAnalyticsService, type CampaignMetrics } from './campaign-analytics'
import { DatabaseResult } from '../database/client'

export interface ExportOptions {
  format: 'csv' | 'json'
  dateRange?: {
    start: Date
    end: Date
  }
  includePersonalData?: boolean // For GDPR compliance
}

export interface ExportResult {
  filename: string
  data: string
  mimeType: string
  size: number
  recordCount: number
}

export interface ScheduledExport {
  id: string
  storeId: string
  exportType: ExportType
  schedule: 'daily' | 'weekly' | 'monthly'
  format: 'csv' | 'json'
  lastRun: Date | null
  nextRun: Date
  isActive: boolean
  deliveryEmail: string
}

export type ExportType = 
  | 'contacts'
  | 'email_campaigns'
  | 'sms_campaigns'
  | 'campaign_analytics'
  | 'automation_workflows'
  | 'consent_records'
  | 'revenue_attribution'
  | 'store_summary'
  | 'all_data'

export class DataExportService {
  private storeRepo: StoreRepository
  private contactRepo: ContactRepository
  private emailCampaignRepo: EmailCampaignRepository
  private smsCampaignRepo: SMSCampaignRepository
  private campaignSendRepo: CampaignSendRepository
  private automationRepo: AutomationWorkflowRepository
  private consentRepo: ConsentRepository
  private supabase: ReturnType<typeof createServiceSupabaseClient>

  constructor() {
    this.storeRepo = new StoreRepository(true)
    this.contactRepo = new ContactRepository(true)
    this.emailCampaignRepo = new EmailCampaignRepository(true)
    this.smsCampaignRepo = new SMSCampaignRepository(true)
    this.campaignSendRepo = new CampaignSendRepository(true)
    this.automationRepo = new AutomationWorkflowRepository(true)
    this.consentRepo = new ConsentRepository(true)
    this.supabase = createServiceSupabaseClient()
  }

  // Export contacts data
  async exportContacts(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const { data: contacts, error } = await this.contactRepo.getStoreContacts(storeId)
      if (error) return { data: null, error }

      // Filter by date range if specified
      let filteredContacts = contacts
      if (options.dateRange) {
        filteredContacts = contacts.filter(contact => 
          contact.created_at >= options.dateRange!.start && 
          contact.created_at <= options.dateRange!.end
        )
      }

      // Remove personal data if not included (for GDPR compliance)
      const exportData = filteredContacts.map(contact => {
        if (!options.includePersonalData) {
          return {
            id: contact.id,
            email_consent: contact.email_consent,
            sms_consent: contact.sms_consent,
            total_spent: contact.total_spent,
            order_count: contact.order_count,
            tags: contact.tags,
            segments: contact.segments,
            last_order_at: contact.last_order_at,
            created_at: contact.created_at,
            updated_at: contact.updated_at
          }
        }
        return contact
      })

      const result = this.formatExportData(exportData, options.format, 'contacts')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export contacts') 
      }
    }
  }

  // Export email campaigns data
  async exportEmailCampaigns(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const { data: campaigns, error } = await this.emailCampaignRepo.getStoreCampaigns(storeId)
      if (error) return { data: null, error }

      // Filter by date range if specified
      let filteredCampaigns = campaigns
      if (options.dateRange) {
        filteredCampaigns = campaigns.filter(campaign => 
          campaign.created_at >= options.dateRange!.start && 
          campaign.created_at <= options.dateRange!.end
        )
      }

      const result = this.formatExportData(filteredCampaigns as unknown as Record<string, unknown>[], options.format, 'email_campaigns')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export email campaigns') 
      }
    }
  }

  // Export SMS campaigns data
  async exportSMSCampaigns(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const { data: campaigns, error } = await this.smsCampaignRepo.getStoreCampaigns(storeId)
      if (error) return { data: null, error }

      // Filter by date range if specified
      let filteredCampaigns = campaigns
      if (options.dateRange) {
        filteredCampaigns = campaigns.filter(campaign => 
          campaign.created_at >= options.dateRange!.start && 
          campaign.created_at <= options.dateRange!.end
        )
      }

      const result = this.formatExportData(filteredCampaigns as unknown as Record<string, unknown>[], options.format, 'sms_campaigns')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export SMS campaigns') 
      }
    }
  }

  // Export campaign analytics
  async exportCampaignAnalytics(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const analytics: CampaignMetrics[] = []

      // Get email campaign analytics
      const { data: emailCampaigns } = await this.emailCampaignRepo.getStoreCampaigns(storeId)
      for (const campaign of emailCampaigns) {
        const { data: metrics } = await campaignAnalyticsService.getEmailCampaignMetrics(campaign.id)
        if (metrics) analytics.push(metrics)
      }

      // Get SMS campaign analytics
      const { data: smsCampaigns } = await this.smsCampaignRepo.getStoreCampaigns(storeId)
      for (const campaign of smsCampaigns) {
        const { data: metrics } = await campaignAnalyticsService.getSMSCampaignMetrics(campaign.id)
        if (metrics) analytics.push(metrics)
      }

      // Filter by date range if specified
      let filteredAnalytics = analytics
      if (options.dateRange) {
        filteredAnalytics = analytics.filter(metric => 
          metric.createdAt >= options.dateRange!.start && 
          metric.createdAt <= options.dateRange!.end
        )
      }

      const result = this.formatExportData(filteredAnalytics as unknown as Record<string, unknown>[], options.format, 'campaign_analytics')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export campaign analytics') 
      }
    }
  }

  // Export automation workflows
  async exportAutomationWorkflows(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const { data: workflows, error } = await this.automationRepo.getStoreWorkflows(storeId)
      if (error) return { data: null, error }

      // Filter by date range if specified
      let filteredWorkflows = workflows
      if (options.dateRange) {
        filteredWorkflows = workflows.filter(workflow => 
          workflow.created_at >= options.dateRange!.start && 
          workflow.created_at <= options.dateRange!.end
        )
      }

      const result = this.formatExportData(filteredWorkflows as unknown as Record<string, unknown>[], options.format, 'automation_workflows')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export automation workflows') 
      }
    }
  }

  // Export consent records
  async exportConsentRecords(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      // Get all contacts for the store first
      const { data: contacts } = await this.contactRepo.getStoreContacts(storeId)
      if (!contacts) return { data: null, error: new Error('No contacts found') }

      const allConsentRecords = []
      
      // Get consent records for each contact
      for (const contact of contacts) {
        const { data: records } = await this.consentRepo.getContactConsentHistory(contact.id)
        if (records) {
          allConsentRecords.push(...records.map(record => ({
            ...record,
            contact_email: contact.email // Add email for context
          })))
        }
      }

      // Filter by date range if specified
      let filteredRecords = allConsentRecords
      if (options.dateRange) {
        filteredRecords = allConsentRecords.filter(record => 
          record.recorded_at >= options.dateRange!.start && 
          record.recorded_at <= options.dateRange!.end
        )
      }

      const result = this.formatExportData(filteredRecords as unknown as Record<string, unknown>[], options.format, 'consent_records')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export consent records') 
      }
    }
  }

  // Export revenue attribution data
  async exportRevenueAttribution(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const attributions = []

      // Get all campaigns for the store
      const { data: emailCampaigns } = await this.emailCampaignRepo.getStoreCampaigns(storeId)
      const { data: smsCampaigns } = await this.smsCampaignRepo.getStoreCampaigns(storeId)

      // Get revenue attribution for each campaign
      for (const campaign of emailCampaigns) {
        const { data: attribution } = await campaignAnalyticsService.getCampaignRevenueAttribution(
          campaign.id, 'email'
        )
        if (attribution) attributions.push(...attribution)
      }

      for (const campaign of smsCampaigns) {
        const { data: attribution } = await campaignAnalyticsService.getCampaignRevenueAttribution(
          campaign.id, 'sms'
        )
        if (attribution) attributions.push(...attribution)
      }

      // Filter by date range if specified
      let filteredAttributions = attributions
      if (options.dateRange) {
        filteredAttributions = attributions.filter(attr => 
          attr.orderDate >= options.dateRange!.start && 
          attr.orderDate <= options.dateRange!.end
        )
      }

      const result = this.formatExportData(filteredAttributions as unknown as Record<string, unknown>[], options.format, 'revenue_attribution')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export revenue attribution') 
      }
    }
  }

  // Export store analytics summary
  async exportStoreSummary(
    storeId: string, 
    options: ExportOptions = { format: 'csv' }
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const { data: summary, error } = await campaignAnalyticsService.getStoreAnalyticsSummary(
        storeId, 
        options.dateRange
      )
      if (error || !summary) {
        return { data: null, error: error || new Error('Failed to get store summary') }
      }

      const result = this.formatExportData([summary] as unknown as Record<string, unknown>[], options.format, 'store_summary')
      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export store summary') 
      }
    }
  }

  // Export all data for a store
  async exportAllData(
    storeId: string, 
    options: ExportOptions = { format: 'json' } // JSON is better for complex nested data
  ): Promise<DatabaseResult<ExportResult>> {
    try {
      const allData: Record<string, unknown> = {}

      // Export all data types
      const { data: contacts } = await this.exportContacts(storeId, { ...options, format: 'json' })
      const { data: emailCampaigns } = await this.exportEmailCampaigns(storeId, { ...options, format: 'json' })
      const { data: smsCampaigns } = await this.exportSMSCampaigns(storeId, { ...options, format: 'json' })
      const { data: analytics } = await this.exportCampaignAnalytics(storeId, { ...options, format: 'json' })
      const { data: workflows } = await this.exportAutomationWorkflows(storeId, { ...options, format: 'json' })
      const { data: consent } = await this.exportConsentRecords(storeId, { ...options, format: 'json' })
      const { data: attribution } = await this.exportRevenueAttribution(storeId, { ...options, format: 'json' })
      const { data: summary } = await this.exportStoreSummary(storeId, { ...options, format: 'json' })

      // Combine all data
      if (contacts) allData.contacts = JSON.parse(contacts.data) as unknown[]
      if (emailCampaigns) allData.emailCampaigns = JSON.parse(emailCampaigns.data) as unknown[]
      if (smsCampaigns) allData.smsCampaigns = JSON.parse(smsCampaigns.data) as unknown[]
      if (analytics) allData.campaignAnalytics = JSON.parse(analytics.data) as unknown[]
      if (workflows) allData.automationWorkflows = JSON.parse(workflows.data) as unknown[]
      if (consent) allData.consentRecords = JSON.parse(consent.data) as unknown[]
      if (attribution) allData.revenueAttribution = JSON.parse(attribution.data) as unknown[]
      if (summary) allData.storeSummary = JSON.parse(summary.data) as unknown

      // Add export metadata
      allData.exportMetadata = {
        storeId,
        exportedAt: new Date().toISOString(),
        dateRange: options.dateRange,
        includePersonalData: options.includePersonalData || false
      }

      const totalRecords = Object.values(allData).reduce((sum: number, data) => {
        if (Array.isArray(data)) return sum + data.length
        return sum + 1
      }, 0)

      const exportString = options.format === 'json' 
        ? JSON.stringify(allData, null, 2)
        : JSON.stringify(allData, null, 2) // For CSV, we'll just use JSON format for complex nested data

      const result: ExportResult = {
        filename: `store_${storeId}_all_data_${new Date().toISOString().split('T')[0]}.${options.format}`,
        data: exportString,
        mimeType: options.format === 'json' ? 'application/json' : 'text/csv',
        size: Buffer.byteLength(exportString, 'utf8'),
        recordCount: totalRecords
      }

      return { data: result, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to export all data') 
      }
    }
  }

  // Format data for export
  private formatExportData(data: Record<string, unknown>[], format: 'csv' | 'json', type: string): ExportResult {
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${type}_${timestamp}.${format}`
    
    let exportString: string
    let mimeType: string

    if (format === 'json') {
      exportString = JSON.stringify(data, null, 2)
      mimeType = 'application/json'
    } else {
      exportString = this.convertToCSV(data)
      mimeType = 'text/csv'
    }

    return {
      filename,
      data: exportString,
      mimeType,
      size: Buffer.byteLength(exportString, 'utf8'),
      recordCount: data.length
    }
  }

  // Convert data to CSV format
  private convertToCSV(data: unknown[]): string {
    if (!data || data.length === 0) return ''

    // Get all unique keys from all objects
    const allKeys = new Set<string>()
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key))
      }
    })

    const headers = Array.from(allKeys)
    
    // Create CSV header
    const csvHeaders = headers.map(header => `"${header}"`).join(',')
    
    // Create CSV rows
    const csvRows = data.map(item => {
      return headers.map(header => {
        const value = (item as Record<string, unknown>)[header]
        if (value === null || value === undefined) return '""'
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
        return `"${String(value).replace(/"/g, '""')}"`
      }).join(',')
    })

    return [csvHeaders, ...csvRows].join('\n')
  }

  // Schedule export (placeholder for future implementation)
  async scheduleExport(
    storeId: string,
    exportType: ExportType,
    schedule: 'daily' | 'weekly' | 'monthly',
    format: 'csv' | 'json',
    deliveryEmail: string
  ): Promise<DatabaseResult<ScheduledExport>> {
    try {
      // In a production system, this would integrate with a job scheduler
      // like Bull, Agenda, or AWS EventBridge
      
      const scheduledExport: ScheduledExport = {
        id: crypto.randomUUID(),
        storeId,
        exportType,
        schedule,
        format,
        lastRun: null,
        nextRun: this.calculateNextRun(schedule),
        isActive: true,
        deliveryEmail
      }

      // TODO: Store in database and set up actual scheduling
      console.log('Scheduled export created:', scheduledExport)

      return { data: scheduledExport, error: null }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to schedule export') 
      }
    }
  }

  // Calculate next run date for scheduled exports
  private calculateNextRun(schedule: 'daily' | 'weekly' | 'monthly'): Date {
    const now = new Date()
    
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      case 'monthly':
        const nextMonth = new Date(now)
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        return nextMonth
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000)
    }
  }

  // Validate export request
  async validateExportRequest(
    storeId: string,
    exportType: ExportType,
    options: ExportOptions
  ): Promise<DatabaseResult<{ isValid: boolean; estimatedSize: number; estimatedRecords: number }>> {
    try {
      // Check if store exists
      const { data: store, error: storeError } = await this.storeRepo.getStore(storeId)
      if (storeError || !store) {
        return { data: null, error: new Error('Store not found') }
      }

      // Estimate export size based on type
      let estimatedRecords = 0
      
      switch (exportType) {
        case 'contacts':
          const { data: contacts } = await this.contactRepo.getStoreContacts(storeId, { limit: 1 })
          estimatedRecords = contacts?.length || 0
          break
        case 'email_campaigns':
          const { data: emailCampaigns } = await this.emailCampaignRepo.getStoreCampaigns(storeId)
          estimatedRecords = emailCampaigns?.length || 0
          break
        case 'sms_campaigns':
          const { data: smsCampaigns } = await this.smsCampaignRepo.getStoreCampaigns(storeId)
          estimatedRecords = smsCampaigns?.length || 0
          break
        default:
          estimatedRecords = 1000 // Default estimate
      }

      // Estimate size (rough calculation)
      const avgRecordSize = options.format === 'json' ? 500 : 200 // bytes
      const estimatedSize = estimatedRecords * avgRecordSize

      return {
        data: {
          isValid: true,
          estimatedSize,
          estimatedRecords
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to validate export request') 
      }
    }
  }
}

// Export singleton instance
export const dataExportService = new DataExportService()
// Campaign Execution Engine - Handles sending campaigns and tracking analytics
import { 
  EmailCampaignRepository, 
  SMSCampaignRepository,
  ContactRepository,
  CampaignSendRepository 
} from '../database/repositories'
import {
  EmailCampaign,
  SMSCampaign,
  Contact,
  CampaignSend,
  CampaignStatus
} from '../database/types'
import { DatabaseResult, DatabaseListResult } from '../database/client'
import { emailService } from '../email/email-service'
import { smsService } from '../sms/sms-service'

export interface CampaignExecutionResult {
  campaignId: string
  campaignType: 'email' | 'sms'
  totalRecipients: number
  successfulSends: number
  failedSends: number
  executionTime: number // milliseconds
  errors: string[]
}

export interface RecipientListOptions {
  emailConsent?: boolean
  smsConsent?: boolean
  segments?: string[]
  tags?: string[]
  minTotalSpent?: number
  maxTotalSpent?: number
  minOrderCount?: number
  maxOrderCount?: number
}

export interface CampaignAnalytics {
  campaignId: string
  campaignType: 'email' | 'sms'
  campaignName: string
  status: CampaignStatus
  sentAt: Date | null
  totalRecipients: number
  deliveredCount: number
  openedCount?: number // Email only
  clickedCount?: number // Email only
  bouncedCount: number
  failedCount: number
  deliveryRate: number
  openRate?: number // Email only
  clickRate?: number // Email only
  bounceRate: number
  revenue?: number // If tracking is available
}

export class CampaignExecutionEngine {
  private emailCampaignRepo: EmailCampaignRepository
  private smsCampaignRepo: SMSCampaignRepository
  private contactRepo: ContactRepository
  private campaignSendRepo: CampaignSendRepository

  constructor() {
    this.emailCampaignRepo = new EmailCampaignRepository()
    this.smsCampaignRepo = new SMSCampaignRepository()
    this.contactRepo = new ContactRepository()
    this.campaignSendRepo = new CampaignSendRepository()
  }

  // Email Campaign Execution
  async executeEmailCampaign(
    campaignId: string,
    recipientOptions?: RecipientListOptions
  ): Promise<DatabaseResult<CampaignExecutionResult>> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Get campaign
      const { data: campaign, error: campaignError } = await this.emailCampaignRepo.getCampaign(campaignId)
      if (campaignError || !campaign) {
        return { data: null, error: campaignError || new Error('Campaign not found') }
      }

      // Check if campaign can be executed
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return { 
          data: null, 
          error: new Error(`Cannot execute campaign with status: ${campaign.status}`) 
        }
      }

      // Update campaign status to sending
      await this.emailCampaignRepo.updateCampaign(campaignId, { status: 'sending' })

      // Get recipient list
      const { data: recipients, error: recipientError } = await this.getRecipientList(
        campaign.store_id,
        { emailConsent: true, ...recipientOptions }
      )

      if (recipientError || !recipients) {
        await this.emailCampaignRepo.updateCampaign(campaignId, { status: 'failed' })
        return { data: null, error: recipientError || new Error('Failed to get recipients') }
      }

      if (recipients.length === 0) {
        await this.emailCampaignRepo.updateCampaign(campaignId, { status: 'failed' })
        return { 
          data: null, 
          error: new Error('No recipients found with email consent') 
        }
      }

      // Execute campaign
      const sendResult = await emailService.sendCampaign(campaign, recipients)

      // Update campaign status
      const finalStatus: CampaignStatus = sendResult.failed > 0 && sendResult.success === 0 ? 'failed' : 'sent'
      await this.emailCampaignRepo.updateCampaign(campaignId, { 
        status: finalStatus,
        sent_at: new Date(),
        recipient_count: recipients.length,
        delivered_count: sendResult.success
      })

      const executionTime = Date.now() - startTime

      return {
        data: {
          campaignId,
          campaignType: 'email',
          totalRecipients: recipients.length,
          successfulSends: sendResult.success,
          failedSends: sendResult.failed,
          executionTime,
          errors
        },
        error: null
      }

    } catch (error) {
      // Update campaign status to failed
      await this.emailCampaignRepo.updateCampaign(campaignId, { status: 'failed' })
      
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error during campaign execution') 
      }
    }
  }

  // SMS Campaign Execution
  async executeSMSCampaign(
    campaignId: string,
    recipientOptions?: RecipientListOptions
  ): Promise<DatabaseResult<CampaignExecutionResult>> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      // Get campaign
      const { data: campaign, error: campaignError } = await this.smsCampaignRepo.getCampaign(campaignId)
      if (campaignError || !campaign) {
        return { data: null, error: campaignError || new Error('Campaign not found') }
      }

      // Check if campaign can be executed
      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        return { 
          data: null, 
          error: new Error(`Cannot execute SMS campaign with status: ${campaign.status}`) 
        }
      }

      // Update campaign status to sending
      await this.smsCampaignRepo.updateCampaign(campaignId, { status: 'sending' })

      // Get recipient list
      const { data: recipients, error: recipientError } = await this.getRecipientList(
        campaign.store_id,
        { smsConsent: true, ...recipientOptions }
      )

      if (recipientError || !recipients) {
        await this.smsCampaignRepo.updateCampaign(campaignId, { status: 'failed' })
        return { data: null, error: recipientError || new Error('Failed to get recipients') }
      }

      if (recipients.length === 0) {
        await this.smsCampaignRepo.updateCampaign(campaignId, { status: 'failed' })
        return { 
          data: null, 
          error: new Error('No recipients found with SMS consent') 
        }
      }

      // Filter recipients with valid phone numbers
      const validRecipients = recipients.filter(contact => contact.phone && contact.phone.trim())
      
      if (validRecipients.length === 0) {
        await this.smsCampaignRepo.updateCampaign(campaignId, { status: 'failed' })
        return { 
          data: null, 
          error: new Error('No recipients found with valid phone numbers') 
        }
      }

      // Execute campaign
      const sendResult = await smsService.sendCampaign(campaign, validRecipients)

      // Update campaign status
      const finalStatus: CampaignStatus = sendResult.failed > 0 && sendResult.success === 0 ? 'failed' : 'sent'
      await this.smsCampaignRepo.updateCampaign(campaignId, { 
        status: finalStatus,
        sent_at: new Date(),
        recipient_count: validRecipients.length,
        delivered_count: sendResult.success
      })

      const executionTime = Date.now() - startTime

      return {
        data: {
          campaignId,
          campaignType: 'sms',
          totalRecipients: validRecipients.length,
          successfulSends: sendResult.success,
          failedSends: sendResult.failed,
          executionTime,
          errors
        },
        error: null
      }

    } catch (error) {
      // Update campaign status to failed
      await this.smsCampaignRepo.updateCampaign(campaignId, { status: 'failed' })
      
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error during SMS campaign execution') 
      }
    }
  }

  // Recipient List Processing
  async getRecipientList(
    storeId: string,
    options: RecipientListOptions = {}
  ): Promise<DatabaseListResult<Contact>> {
    try {
      // Start with basic consent filtering
      const { data: contacts, error } = await this.contactRepo.getStoreContacts(storeId, {
        emailConsent: options.emailConsent,
        smsConsent: options.smsConsent
      })

      if (error) {
        return { data: [], error }
      }

      // Apply additional filtering
      let filteredContacts = contacts

      // Filter by segments
      if (options.segments && options.segments.length > 0) {
        filteredContacts = filteredContacts.filter(contact =>
          options.segments!.some(segment => contact.segments.includes(segment))
        )
      }

      // Filter by tags
      if (options.tags && options.tags.length > 0) {
        filteredContacts = filteredContacts.filter(contact =>
          options.tags!.some(tag => contact.tags.includes(tag))
        )
      }

      // Filter by spending range
      if (options.minTotalSpent !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.total_spent >= options.minTotalSpent!
        )
      }

      if (options.maxTotalSpent !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.total_spent <= options.maxTotalSpent!
        )
      }

      // Filter by order count range
      if (options.minOrderCount !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.order_count >= options.minOrderCount!
        )
      }

      if (options.maxOrderCount !== undefined) {
        filteredContacts = filteredContacts.filter(contact =>
          contact.order_count <= options.maxOrderCount!
        )
      }

      return { 
        data: filteredContacts, 
        error: null, 
        count: filteredContacts.length 
      }

    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Failed to get recipient list') 
      }
    }
  }

  // Campaign Analytics
  async getEmailCampaignAnalytics(campaignId: string): Promise<DatabaseResult<CampaignAnalytics>> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await this.emailCampaignRepo.getCampaign(campaignId)
      if (campaignError || !campaign) {
        return { data: null, error: campaignError || new Error('Campaign not found') }
      }

      // Get campaign sends
      const { data: sends, error: sendsError } = await this.campaignSendRepo.getCampaignSends(campaignId)
      if (sendsError) {
        return { data: null, error: sendsError }
      }

      // Calculate metrics
      const totalRecipients = sends.length
      const deliveredCount = sends.filter(s => s.status === 'delivered').length
      const openedCount = sends.filter(s => s.opened_at).length
      const clickedCount = sends.filter(s => s.clicked_at).length
      const bouncedCount = sends.filter(s => s.status === 'bounced').length
      const failedCount = sends.filter(s => s.status === 'failed').length

      const deliveryRate = totalRecipients > 0 ? (deliveredCount / totalRecipients) * 100 : 0
      const openRate = deliveredCount > 0 ? (openedCount / deliveredCount) * 100 : 0
      const clickRate = openedCount > 0 ? (clickedCount / openedCount) * 100 : 0
      const bounceRate = totalRecipients > 0 ? (bouncedCount / totalRecipients) * 100 : 0

      return {
        data: {
          campaignId,
          campaignType: 'email',
          campaignName: campaign.name,
          status: campaign.status,
          sentAt: campaign.sent_at,
          totalRecipients,
          deliveredCount,
          openedCount,
          clickedCount,
          bouncedCount,
          failedCount,
          deliveryRate,
          openRate,
          clickRate,
          bounceRate
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to get email campaign analytics') 
      }
    }
  }

  async getSMSCampaignAnalytics(campaignId: string): Promise<DatabaseResult<CampaignAnalytics>> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await this.smsCampaignRepo.getCampaign(campaignId)
      if (campaignError || !campaign) {
        return { data: null, error: campaignError || new Error('Campaign not found') }
      }

      // Get campaign sends
      const { data: sends, error: sendsError } = await this.campaignSendRepo.getCampaignSends(campaignId)
      if (sendsError) {
        return { data: null, error: sendsError }
      }

      // Calculate metrics
      const totalRecipients = sends.length
      const deliveredCount = sends.filter(s => s.status === 'delivered').length
      const bouncedCount = sends.filter(s => s.status === 'bounced').length
      const failedCount = sends.filter(s => s.status === 'failed').length

      const deliveryRate = totalRecipients > 0 ? (deliveredCount / totalRecipients) * 100 : 0
      const bounceRate = totalRecipients > 0 ? (bouncedCount / totalRecipients) * 100 : 0

      return {
        data: {
          campaignId,
          campaignType: 'sms',
          campaignName: campaign.name,
          status: campaign.status,
          sentAt: campaign.sent_at,
          totalRecipients,
          deliveredCount,
          bouncedCount,
          failedCount,
          deliveryRate,
          bounceRate
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to get SMS campaign analytics') 
      }
    }
  }

  // Campaign Status Tracking
  async updateCampaignStatus(
    campaignId: string,
    campaignType: 'email' | 'sms',
    status: CampaignStatus
  ): Promise<DatabaseResult<boolean>> {
    try {
      if (campaignType === 'email') {
        const { error } = await this.emailCampaignRepo.updateCampaign(campaignId, { status })
        return { data: !error, error }
      } else {
        const { error } = await this.smsCampaignRepo.updateCampaign(campaignId, { status })
        return { data: !error, error }
      }
    } catch (error) {
      return { 
        data: false, 
        error: error instanceof Error ? error : new Error('Failed to update campaign status') 
      }
    }
  }

  // Schedule Campaign Execution
  async scheduleCampaign(
    campaignId: string,
    campaignType: 'email' | 'sms',
    scheduledAt: Date,
    recipientOptions?: RecipientListOptions
  ): Promise<DatabaseResult<boolean>> {
    try {
      // Update campaign with scheduled time
      if (campaignType === 'email') {
        const { error } = await this.emailCampaignRepo.updateCampaign(campaignId, {
          status: 'scheduled',
          scheduled_at: scheduledAt
        })
        if (error) return { data: false, error }
      } else {
        const { error } = await this.smsCampaignRepo.updateCampaign(campaignId, {
          status: 'scheduled',
          scheduled_at: scheduledAt
        })
        if (error) return { data: false, error }
      }

      // In a production system, you would integrate with a job queue system
      // like Bull, Agenda, or AWS SQS to handle scheduled execution
      // For now, we'll just mark it as scheduled
      
      return { data: true, error: null }

    } catch (error) {
      return { 
        data: false, 
        error: error instanceof Error ? error : new Error('Failed to schedule campaign') 
      }
    }
  }

  // Cancel Campaign
  async cancelCampaign(
    campaignId: string,
    campaignType: 'email' | 'sms'
  ): Promise<DatabaseResult<boolean>> {
    try {
      if (campaignType === 'email') {
        const { data: campaign, error: getError } = await this.emailCampaignRepo.getCampaign(campaignId)
        if (getError || !campaign) {
          return { data: false, error: getError || new Error('Campaign not found') }
        }

        if (campaign.status === 'sending') {
          return { data: false, error: new Error('Cannot cancel campaign that is currently sending') }
        }

        const { error } = await this.emailCampaignRepo.updateCampaign(campaignId, { 
          status: 'draft',
          scheduled_at: null
        })
        return { data: !error, error }
      } else {
        const { data: campaign, error: getError } = await this.smsCampaignRepo.getCampaign(campaignId)
        if (getError || !campaign) {
          return { data: false, error: getError || new Error('Campaign not found') }
        }

        if (campaign.status === 'sending') {
          return { data: false, error: new Error('Cannot cancel SMS campaign that is currently sending') }
        }

        const { error } = await this.smsCampaignRepo.updateCampaign(campaignId, { 
          status: 'draft',
          scheduled_at: null
        })
        return { data: !error, error }
      }
    } catch (error) {
      return { 
        data: false, 
        error: error instanceof Error ? error : new Error('Failed to cancel campaign') 
      }
    }
  }

  // Get Campaign Performance Summary
  async getCampaignPerformanceSummary(storeId: string): Promise<DatabaseResult<{
    totalEmailCampaigns: number
    totalSMSCampaigns: number
    totalEmailsSent: number
    totalSMSSent: number
    averageEmailOpenRate: number
    averageEmailClickRate: number
    averageSMSDeliveryRate: number
  }>> {
    try {
      // Get email campaigns
      const { data: emailCampaigns } = await this.emailCampaignRepo.getStoreCampaigns(storeId)
      
      // Get SMS campaigns
      const { data: smsCampaigns } = await this.smsCampaignRepo.getStoreCampaigns(storeId)

      // Calculate email metrics
      const totalEmailsSent = emailCampaigns.reduce((sum, campaign) => sum + campaign.recipient_count, 0)
      const totalEmailsDelivered = emailCampaigns.reduce((sum, campaign) => sum + campaign.delivered_count, 0)
      const totalEmailsOpened = emailCampaigns.reduce((sum, campaign) => sum + campaign.opened_count, 0)
      const totalEmailsClicked = emailCampaigns.reduce((sum, campaign) => sum + campaign.clicked_count, 0)

      // Calculate SMS metrics
      const totalSMSSent = smsCampaigns.reduce((sum, campaign) => sum + campaign.recipient_count, 0)
      const totalSMSDelivered = smsCampaigns.reduce((sum, campaign) => sum + campaign.delivered_count, 0)

      const averageEmailOpenRate = totalEmailsDelivered > 0 ? (totalEmailsOpened / totalEmailsDelivered) * 100 : 0
      const averageEmailClickRate = totalEmailsOpened > 0 ? (totalEmailsClicked / totalEmailsOpened) * 100 : 0
      const averageSMSDeliveryRate = totalSMSSent > 0 ? (totalSMSDelivered / totalSMSSent) * 100 : 0

      return {
        data: {
          totalEmailCampaigns: emailCampaigns.length,
          totalSMSCampaigns: smsCampaigns.length,
          totalEmailsSent,
          totalSMSSent,
          averageEmailOpenRate,
          averageEmailClickRate,
          averageSMSDeliveryRate
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to get campaign performance summary') 
      }
    }
  }
}

// Export singleton instance
export const campaignExecutionEngine = new CampaignExecutionEngine()
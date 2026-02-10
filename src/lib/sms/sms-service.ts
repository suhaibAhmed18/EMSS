// SMS service that integrates Telnyx with database operations
import { telnyxSMSService, SMSSendResult, SMSDeliveryStatus, SMSTemplate } from './telnyx-client'
import { getSupabaseAdmin } from '../database/client'
import { unsubscribeHandler } from '../compliance'
import { 
  SMSCampaign, 
  Contact, 
  CampaignSend, 
  CreateCampaignSend, 
  UpdateCampaignSend,
  CampaignSendStatus 
} from '../database/types'

export interface SMSServiceConfig {
  batchSize?: number
  delayBetweenBatches?: number // milliseconds
}

export class SMSService {
  private config: SMSServiceConfig

  constructor(config: SMSServiceConfig = {}) {
    this.config = {
      batchSize: 50, // Lower batch size for SMS to avoid rate limits
      delayBetweenBatches: 2000, // Longer delay for SMS
      ...config
    }
  }

  /**
   * Send SMS campaign to recipients with database tracking
   */
  async sendCampaign(
    campaign: SMSCampaign,
    recipients: Contact[]
  ): Promise<{ success: number; failed: number; results: SMSSendResult[] }> {
    const results: SMSSendResult[] = []
    let successCount = 0
    let failedCount = 0

    // Process recipients in batches
    const batches = this.chunkArray(recipients, this.config.batchSize!)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      // Send batch
      const batchResults = await telnyxSMSService.sendCampaign(campaign, batch)
      results.push(...batchResults)
      
      // Track sends in database
      await this.trackCampaignSends(campaign.id, 'sms', batchResults, batch)
      
      // Count results
      batchResults.forEach(result => {
        if (result.success) {
          successCount++
        } else {
          failedCount++
        }
      })
      
      // Delay between batches (except for last batch)
      if (i < batches.length - 1) {
        await this.delay(this.config.delayBetweenBatches!)
      }
    }

    // Update campaign statistics
    await this.updateCampaignStats(campaign.id, 'sms', {
      recipient_count: recipients.length,
      delivered_count: successCount,
      sent_at: new Date()
    })

    return { success: successCount, failed: failedCount, results }
  }

  /**
   * Send transactional SMS with tracking
   */
  async sendTransactional(
    templateId: string,
    recipient: Contact,
    data: Record<string, unknown> = {}
  ): Promise<SMSSendResult> {
    const supabaseAdmin = getSupabaseAdmin()
    // Get template from database
    const { data: template, error } = await supabaseAdmin
      .from('campaign_templates')
      .select('*')
      .eq('id', templateId)
      .eq('type', 'sms')
      .single()

    if (error || !template) {
      return {
        id: recipient.id,
        success: false,
        error: 'Template not found'
      }
    }

    // Create SMS template object
    const smsTemplate: SMSTemplate = {
      id: template.id,
      name: template.name,
      message: template.content,
      variables: template.variables || []
    }

    // Send SMS
    const result = await telnyxSMSService.sendTransactional(smsTemplate, recipient, data)

    // Track send in database
    if (result.messageId) {
      await this.trackCampaignSends('transactional', 'sms', [result], [recipient])
    }

    return result
  }

  /**
   * Update delivery status for tracked SMS
   */
  async updateDeliveryStatus(messageId: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    const status = await telnyxSMSService.trackDelivery(messageId)
    
    // Find campaign send record
    const { data: campaignSend } = await supabaseAdmin
      .from('campaign_sends')
      .select('*')
      .eq('external_message_id', messageId)
      .single()

    if (campaignSend) {
      const updates: Partial<UpdateCampaignSend> = {
        status: this.mapDeliveryStatusToCampaignStatus(status.status)
      }

      if (status.deliveredAt) {
        updates.delivered_at = status.deliveredAt
      }
      if (status.failedAt) {
        updates.bounced_at = status.failedAt
      }
      if (status.error) {
        updates.error_message = status.error
      }

      await supabaseAdmin
        .from('campaign_sends')
        .update(updates)
        .eq('id', campaignSend.id)
    }
  }

  /**
   * Process webhook events from Telnyx
   */
  async processWebhookEvent(event: { event_type: string; data: Record<string, unknown> }): Promise<void> {
    const { event_type, data } = event

    switch (event_type) {
      case 'message.sent':
        await this.handleMessageSent(data)
        break
      case 'message.delivered':
        await this.handleMessageDelivered(data)
        break
      case 'message.delivery_failed':
        await this.handleMessageFailed(data)
        break
      case 'message.received':
        await this.handleIncomingMessage(data)
        break
      default:
        console.log(`Unhandled Telnyx webhook event type: ${event_type}`)
    }
  }

  /**
   * Process STOP requests and opt-out users
   */
  async processStopRequest(phoneNumber: string, fromNumber: string, message: string): Promise<void> {
    // Use the compliance system to handle opt-out
    const result = await unsubscribeHandler.processSMSOptOut({
      fromNumber: phoneNumber,
      toNumber: fromNumber,
      message,
      timestamp: new Date()
    })

    if (result.error) {
      console.error('Failed to process SMS STOP request:', result.error)
    } else {
      console.log('SMS STOP request processed successfully:', result.data)
    }
  }

  /**
   * Get SMS analytics for a campaign
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    sent: number
    delivered: number
    failed: number
  }> {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: sends } = await supabaseAdmin
      .from('campaign_sends')
      .select('status, delivered_at, bounced_at')
      .eq('campaign_id', campaignId)
      .eq('campaign_type', 'sms')

    if (!sends) {
      return { sent: 0, delivered: 0, failed: 0 }
    }

    return {
      sent: sends.length,
      delivered: sends.filter(s => s.status === 'delivered').length,
      failed: sends.filter(s => s.status === 'failed').length
    }
  }

  /**
   * Track campaign sends in database
   */
  private async trackCampaignSends(
    campaignId: string,
    campaignType: 'email' | 'sms',
    results: SMSSendResult[],
    recipients: Contact[]
  ): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    const sends: CreateCampaignSend[] = results.map((result, index) => ({
      campaign_id: campaignId,
      campaign_type: campaignType,
      contact_id: recipients[index].id,
      external_message_id: result.messageId || null,
      status: result.success ? 'pending' : 'failed',
      error_message: result.error || null
    }))

    await supabaseAdmin
      .from('campaign_sends')
      .insert(sends)
  }

  /**
   * Update campaign statistics
   */
  private async updateCampaignStats(
    campaignId: string,
    campaignType: 'email' | 'sms',
    updates: Record<string, unknown>
  ): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    const table = campaignType === 'email' ? 'email_campaigns' : 'sms_campaigns'
    
    await supabaseAdmin
      .from(table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', campaignId)
  }

  /**
   * Handle message sent webhook
   */
  private async handleMessageSent(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin
      .from('campaign_sends')
      .update({ status: 'pending' })
      .eq('external_message_id', (data.payload as any).id)
  }

  /**
   * Handle message delivered webhook
   */
  private async handleMessageDelivered(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin
      .from('campaign_sends')
      .update({ 
        status: 'delivered',
        delivered_at: new Date(data.occurred_at as string)
      })
      .eq('external_message_id', (data.payload as any).id)
  }

  /**
   * Handle message failed webhook
   */
  private async handleMessageFailed(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin
      .from('campaign_sends')
      .update({ 
        status: 'failed',
        bounced_at: new Date(data.occurred_at as string),
        error_message: (data.payload as any).errors?.[0]?.detail || 'SMS delivery failed'
      })
      .eq('external_message_id', (data.payload as any).id)
  }

  /**
   * Handle incoming message webhook (for STOP requests)
   */
  private async handleIncomingMessage(data: Record<string, unknown>): Promise<void> {
    const result = await telnyxSMSService.handleIncomingMessage({ data })
    
    if (result.isStopRequest && result.phoneNumber && result.message) {
      await this.processStopRequest(
        result.phoneNumber, 
        data.payload.to?.[0]?.phone_number || 'unknown',
        result.message
      )
    }
  }

  /**
   * Map delivery status to campaign send status
   */
  private mapDeliveryStatusToCampaignStatus(status: string): CampaignSendStatus {
    switch (status) {
      case 'delivered':
        return 'delivered'
      case 'failed':
        return 'failed'
      default:
        return 'pending'
    }
  }

  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const smsService = new SMSService()
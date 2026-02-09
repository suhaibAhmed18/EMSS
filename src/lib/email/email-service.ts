// Email service that integrates Resend with database operations
import { resendEmailService, SendResult, DeliveryStatus, DomainSetupResult } from './resend-client'
import { getSupabaseAdmin } from '../database/client'
import { unsubscribeHandler } from '../compliance'
import { 
  EmailCampaign, 
  Contact, 
  CampaignSend, 
  CreateCampaignSend, 
  UpdateCampaignSend,
  CampaignSendStatus 
} from '../database/types'

export interface EmailServiceConfig {
  batchSize?: number
  delayBetweenBatches?: number // milliseconds
}

export class EmailService {
  private config: EmailServiceConfig

  constructor(config: EmailServiceConfig = {}) {
    this.config = {
      batchSize: 100,
      delayBetweenBatches: 1000,
      ...config
    }
  }

  /**
   * Send email campaign to recipients with database tracking
   */
  async sendCampaign(
    campaign: EmailCampaign,
    recipients: Contact[],
    baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ): Promise<{ success: number; failed: number; results: SendResult[] }> {
    const results: SendResult[] = []
    let successCount = 0
    let failedCount = 0

    // Process recipients in batches
    const batches = this.chunkArray(recipients, this.config.batchSize!)
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      
      // Add unsubscribe links to campaign content for each recipient
      const campaignWithUnsubscribe = await this.addUnsubscribeLinks(campaign, batch, baseUrl)
      
      // Send batch
      const batchResults = await resendEmailService.sendCampaign(campaignWithUnsubscribe, batch)
      results.push(...batchResults)
      
      // Track sends in database
      await this.trackCampaignSends(campaign.id, 'email', batchResults, batch)
      
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
    await this.updateCampaignStats(campaign.id, 'email', {
      recipient_count: recipients.length,
      delivered_count: successCount,
      sent_at: new Date()
    })

    return { success: successCount, failed: failedCount, results }
  }

  /**
   * Send transactional email with tracking
   */
  async sendTransactional(
    templateId: string,
    recipient: Contact,
    data: Record<string, unknown> = {},
    _fromEmail?: string,
    _fromName?: string
  ): Promise<SendResult> {
    const supabaseAdmin = getSupabaseAdmin()
    // Get template from database
    const { data: template, error } = await supabaseAdmin
      .from('campaign_templates')
      .select('*')
      .eq('id', templateId)
      .eq('type', 'email')
      .single()

    if (error || !template) {
      return {
        id: recipient.id,
        success: false,
        error: 'Template not found'
      }
    }

    // Create email template object
    const emailTemplate = {
      id: (template as any).id,
      name: (template as any).name,
      subject: (template as any).content, // Assuming content contains subject
      htmlContent: (template as any).content,
      textContent: undefined,
      variables: (template as any).variables || []
    }

    // Send email
    const result = await resendEmailService.sendTransactional(emailTemplate, recipient, data)

    // Track send in database
    if (result.messageId) {
      await this.trackCampaignSends('transactional', 'email', [result], [recipient])
    }

    return result
  }

  /**
   * Setup custom domain for store
   */
  async setupCustomDomain(domain: string, storeId: string): Promise<DomainSetupResult> {
    const result = await resendEmailService.setupCustomDomain(domain, storeId)
    
    const supabaseAdmin = getSupabaseAdmin()
    // Store domain configuration in database
    await (supabaseAdmin as any)
      .from('stores')
      .update({
        settings: {
          custom_domain: domain,
          domain_verified: result.verified,
          dns_records: result.dnsRecords
        },
        updated_at: new Date()
      })
      .eq('id', storeId)

    return result
  }

  /**
   * Verify domain setup
   */
  async verifyDomain(domain: string, storeId: string): Promise<boolean> {
    const verified = await resendEmailService.verifyDomain(domain)
    
    if (verified) {
      const supabaseAdmin = getSupabaseAdmin()
      // Update store settings
      await (supabaseAdmin as any)
        .from('stores')
        .update({
          settings: {
            domain_verified: true
          },
          updated_at: new Date()
        })
        .eq('id', storeId)
    }

    return verified
  }

  /**
   * Update delivery status for tracked emails
   */
  async updateDeliveryStatus(messageId: string): Promise<void> {
    const status = await resendEmailService.trackDelivery(messageId)
    
    const supabaseAdmin = getSupabaseAdmin()
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
      if (status.bouncedAt) {
        updates.bounced_at = status.bouncedAt
      }
      if (status.error) {
        updates.error_message = status.error
      }

      await (supabaseAdmin as any)
        .from('campaign_sends')
        .update(updates)
        .eq('id', (campaignSend as any).id)
    }
  }

  /**
   * Process webhook events from Resend
   */
  async processWebhookEvent(event: { type: string; data: Record<string, unknown> }): Promise<void> {
    const { type, data } = event

    switch (type) {
      case 'email.sent':
        await this.handleEmailSent(data)
        break
      case 'email.delivered':
        await this.handleEmailDelivered(data)
        break
      case 'email.bounced':
        await this.handleEmailBounced(data)
        break
      case 'email.opened':
        await this.handleEmailOpened(data)
        break
      case 'email.clicked':
        await this.handleEmailClicked(data)
        break
      default:
        console.log(`Unhandled webhook event type: ${type}`)
    }
  }

  /**
   * Get email analytics for a campaign
   */
  async getCampaignAnalytics(campaignId: string): Promise<{
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    failed: number
  }> {
    const supabaseAdmin = getSupabaseAdmin()
    const { data: sends } = await supabaseAdmin
      .from('campaign_sends')
      .select('status, delivered_at, opened_at, clicked_at, bounced_at')
      .eq('campaign_id', campaignId)
      .eq('campaign_type', 'email')

    if (!sends) {
      return { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, failed: 0 }
    }

    return {
      sent: sends.length,
      delivered: sends.filter((s: any) => s.status === 'delivered').length,
      opened: sends.filter((s: any) => s.opened_at).length,
      clicked: sends.filter((s: any) => s.clicked_at).length,
      bounced: sends.filter((s: any) => s.status === 'bounced').length,
      failed: sends.filter((s: any) => s.status === 'failed').length
    }
  }

  /**
   * Track campaign sends in database
   */
  private async trackCampaignSends(
    campaignId: string,
    campaignType: 'email' | 'sms',
    results: SendResult[],
    recipients: Contact[]
  ): Promise<void> {
    const sends: CreateCampaignSend[] = results.map((result, index) => ({
      campaign_id: campaignId,
      campaign_type: campaignType,
      contact_id: recipients[index].id,
      external_message_id: result.messageId || null,
      status: result.success ? 'pending' : 'failed',
      error_message: result.error || null,
      delivered_at: null,
      opened_at: null,
      clicked_at: null,
      bounced_at: null
    }))

    const supabaseAdmin = getSupabaseAdmin()
    await (supabaseAdmin as any)
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
    const table = campaignType === 'email' ? 'email_campaigns' : 'sms_campaigns'
    
    const supabaseAdmin = getSupabaseAdmin()
    await (supabaseAdmin as any)
      .from(table)
      .update({
        ...updates,
        updated_at: new Date()
      })
      .eq('id', campaignId)
  }

  /**
   * Handle email sent webhook
   */
  private async handleEmailSent(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await (supabaseAdmin as any)
      .from('campaign_sends')
      .update({ status: 'pending' })
      .eq('external_message_id', data.email_id)
  }

  /**
   * Handle email delivered webhook
   */
  private async handleEmailDelivered(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await (supabaseAdmin as any)
      .from('campaign_sends')
      .update({ 
        status: 'delivered',
        delivered_at: new Date(data.created_at as string)
      })
      .eq('external_message_id', data.email_id)
  }

  /**
   * Handle email bounced webhook
   */
  private async handleEmailBounced(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await (supabaseAdmin as any)
      .from('campaign_sends')
      .update({ 
        status: 'bounced',
        bounced_at: new Date(data.created_at as string),
        error_message: data.reason || 'Email bounced'
      })
      .eq('external_message_id', data.email_id)
  }

  /**
   * Handle email opened webhook
   */
  private async handleEmailOpened(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await (supabaseAdmin as any)
      .from('campaign_sends')
      .update({ opened_at: new Date(data.created_at as string) })
      .eq('external_message_id', data.email_id)
  }

  /**
   * Handle email clicked webhook
   */
  private async handleEmailClicked(data: Record<string, unknown>): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()
    await (supabaseAdmin as any)
      .from('campaign_sends')
      .update({ clicked_at: new Date(data.created_at as string) })
      .eq('external_message_id', data.email_id)
  }

  /**
   * Map delivery status to campaign send status
   */
  private mapDeliveryStatusToCampaignStatus(status: string): CampaignSendStatus {
    switch (status) {
      case 'delivered':
        return 'delivered'
      case 'bounced':
        return 'bounced'
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

  /**
   * Add unsubscribe links to campaign content
   */
  private async addUnsubscribeLinks(
    campaign: EmailCampaign,
    recipients: Contact[],
    baseUrl: string
  ): Promise<EmailCampaign> {
    // For batch processing, we'll use a generic unsubscribe link
    // In a real implementation, you'd personalize this per recipient
    const unsubscribeLink = `${baseUrl}/api/unsubscribe?email={{email}}&campaign=${campaign.id}`
    
    // Add unsubscribe link to HTML content
    let htmlContent = campaign.html_content
    if (!htmlContent.includes('unsubscribe')) {
      htmlContent += `
        <div style="margin-top: 20px; padding: 10px; font-size: 12px; color: #666; text-align: center;">
          <p>You received this email because you subscribed to our marketing communications.</p>
          <p><a href="${unsubscribeLink}" style="color: #666;">Unsubscribe</a> from future emails.</p>
        </div>
      `
    }

    // Add unsubscribe link to text content if it exists
    let textContent = campaign.text_content
    if (textContent && !textContent.includes('unsubscribe')) {
      textContent += `\n\nTo unsubscribe from future emails, visit: ${unsubscribeLink}`
    }

    return {
      ...campaign,
      html_content: htmlContent,
      text_content: textContent
    }
  }
}

// Export singleton instance
export const emailService = new EmailService()
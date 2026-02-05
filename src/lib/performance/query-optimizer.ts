import { createClient } from '../supabase/server'
import { createServiceSupabaseClient } from '../database/client'
import { Contact } from '../database/types'

export class QueryOptimizer {
  private supabase = createClient()
  private supabaseAdmin = createServiceSupabaseClient()

  /**
   * Optimized contact lookup with caching and indexing
   */
  async getContactsForCampaign(storeId: string, segmentIds?: string[], tags?: string[]): Promise<Contact[]> {
    const client = await this.supabase
    let query = client
      .from('contacts')
      .select(`
        id,
        email,
        phone,
        first_name,
        last_name,
        email_consent,
        sms_consent,
        total_spent,
        order_count,
        tags,
        segments
      `)
      .eq('store_id', storeId)
      .eq('email_consent', true) // Pre-filter for email campaigns

    // Add segment filtering if provided
    if (segmentIds && segmentIds.length > 0) {
      query = query.overlaps('segments', segmentIds)
    }

    // Add tag filtering if provided
    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags)
    }

    // Order by engagement metrics for better campaign performance
    query = query.order('total_spent', { ascending: false })
      .order('order_count', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch contacts: ${error.message}`)
    }

    return data || []
  }

  /**
   * Batch insert campaign sends with optimized performance
   */
  async batchInsertCampaignSends(sends: Array<{
    campaign_id: string
    campaign_type: 'email' | 'sms'
    contact_id: string
    status: string
    external_message_id?: string
    sent_at?: string
    delivered_at?: string
    opened_at?: string
    clicked_at?: string
    bounced_at?: string
    error_message?: string
  }>): Promise<void> {
    // Process in batches of 1000 to avoid timeout
    const batchSize = 1000
    const batches = []

    for (let i = 0; i < sends.length; i += batchSize) {
      batches.push(sends.slice(i, i + batchSize))
    }

    // Use Promise.all for parallel processing
    await Promise.all(
      batches.map(async (batch) => {
        const { error } = await this.supabaseAdmin
          .from('campaign_sends')
          .insert(batch as any)

        if (error) {
          throw new Error(`Batch insert failed: ${error.message}`)
        }
      })
    )
  }

  /**
   * Optimized campaign analytics query with aggregation
   */
  async getCampaignAnalytics(campaignId: string, campaignType: 'email' | 'sms'): Promise<{
    totalSent: number
    delivered: number
    opened?: number
    clicked?: number
    bounced: number
    failed: number
    deliveryRate: number
    openRate?: number
    clickRate?: number
  }> {
    const client = await this.supabase
    const { data, error } = await client
      .from('campaign_sends')
      .select(`
        status,
        delivered_at,
        opened_at,
        clicked_at,
        bounced_at
      `)
      .eq('campaign_id', campaignId)
      .eq('campaign_type', campaignType)

    if (error) {
      throw new Error(`Failed to fetch campaign analytics: ${error.message}`)
    }

    // Calculate metrics in memory to reduce database load
    const totalSent = data.length
    const delivered = data.filter((send: { status: string }) => send.status === 'delivered').length
    const opened = data.filter((send: { opened_at: string | null }) => send.opened_at).length
    const clicked = data.filter((send: { clicked_at: string | null }) => send.clicked_at).length
    const bounced = data.filter((send: { status: string }) => send.status === 'bounced').length
    const failed = data.filter((send: { status: string }) => send.status === 'failed').length

    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0

    return {
      totalSent,
      delivered,
      opened: campaignType === 'email' ? opened : undefined,
      clicked: campaignType === 'email' ? clicked : undefined,
      bounced,
      failed,
      deliveryRate,
      openRate: campaignType === 'email' ? openRate : undefined,
      clickRate: campaignType === 'email' ? clickRate : undefined,
    }
  }

  /**
   * Optimized webhook processing with bulk operations
   */
  async processWebhookBatch(webhooks: Array<{
    topic: string
    storeId: string
    payload: Record<string, unknown>
  }>): Promise<void> {
    // Group webhooks by type for batch processing
    const orderWebhooks = webhooks.filter(w => w.topic.startsWith('orders/'))
    const customerWebhooks = webhooks.filter(w => w.topic.startsWith('customers/'))

    // Process in parallel
    await Promise.all([
      this.processBatchOrders(orderWebhooks),
      this.processBatchCustomers(customerWebhooks)
    ])
  }

  private async processBatchOrders(orderWebhooks: Array<{
    topic: string
    storeId: string
    payload: Record<string, unknown>
  }>): Promise<void> {
    if (orderWebhooks.length === 0) return

    const orderData = orderWebhooks.map(webhook => ({
      store_id: webhook.storeId,
      shopify_order_id: String(webhook.payload.id || ''),
      order_number: String(webhook.payload.order_number || ''),
      email: String(webhook.payload.email || ''),
      total_price: parseFloat(String(webhook.payload.total_price || '0')),
      currency: String(webhook.payload.currency || 'USD'),
      financial_status: String(webhook.payload.financial_status || ''),
      fulfillment_status: String(webhook.payload.fulfillment_status || ''),
      created_at: String(webhook.payload.created_at || new Date().toISOString()),
      updated_at: String(webhook.payload.updated_at || new Date().toISOString()),
    }))

    // Use upsert for efficient insert/update
    const { error } = await this.supabaseAdmin
      .from('shopify_orders')
      .upsert(orderData as any, { 
        onConflict: 'store_id,shopify_order_id',
        ignoreDuplicates: false 
      })

    if (error) {
      throw new Error(`Batch order processing failed: ${error.message}`)
    }
  }

  private async processBatchCustomers(customerWebhooks: Array<{
    topic: string
    storeId: string
    payload: Record<string, unknown>
  }>): Promise<void> {
    if (customerWebhooks.length === 0) return

    const contactData = customerWebhooks.map(webhook => ({
      store_id: webhook.storeId,
      email: String(webhook.payload.email || ''),
      phone: webhook.payload.phone ? String(webhook.payload.phone) : null,
      first_name: webhook.payload.first_name ? String(webhook.payload.first_name) : null,
      last_name: webhook.payload.last_name ? String(webhook.payload.last_name) : null,
      shopify_customer_id: String(webhook.payload.id || ''),
      total_spent: parseFloat(String(webhook.payload.total_spent || '0')),
      order_count: Number(webhook.payload.orders_count || 0),
      email_consent: Boolean(webhook.payload.accepts_marketing),
      tags: webhook.payload.tags ? String(webhook.payload.tags).split(', ').filter(Boolean) : [],
      created_at: String(webhook.payload.created_at || new Date().toISOString()),
      updated_at: String(webhook.payload.updated_at || new Date().toISOString()),
    }))

    // Use upsert for efficient insert/update
    const { error } = await this.supabaseAdmin
      .from('contacts')
      .upsert(contactData as any, { 
        onConflict: 'store_id,email',
        ignoreDuplicates: false 
      })

    if (error) {
      throw new Error(`Batch customer processing failed: ${error.message}`)
    }
  }

  /**
   * Clean up old campaign sends to maintain performance
   */
  async cleanupOldCampaignSends(daysOld: number = 90): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { error } = await this.supabaseAdmin
      .from('campaign_sends')
      .delete()
      .lt('created_at', cutoffDate.toISOString())

    if (error) {
      throw new Error(`Cleanup failed: ${error.message}`)
    }
  }

  /**
   * Create database indexes for better query performance
   */
  async createOptimizationIndexes(): Promise<void> {
    const indexes = [
      // Contacts table indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_store_consent ON contacts(store_id, email_consent) WHERE email_consent = true',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_segments ON contacts USING GIN(segments)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_tags ON contacts USING GIN(tags)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_engagement ON contacts(store_id, total_spent DESC, order_count DESC)',
      
      // Campaign sends indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_campaign ON campaign_sends(campaign_id, campaign_type)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_status ON campaign_sends(status, created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaign_sends_external_id ON campaign_sends(external_message_id)',
      
      // Shopify orders indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_orders_store_status ON shopify_orders(store_id, financial_status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shopify_orders_email ON shopify_orders(email)',
      
      // Webhook events indexes (for monitoring)
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed_at, topic)',
    ]

    for (const indexSql of indexes) {
      try {
        await (this.supabaseAdmin as any).rpc('execute_sql', { sql: indexSql })
      } catch (error) {
        console.warn(`Failed to create index: ${indexSql}`, error)
        // Continue with other indexes even if one fails
      }
    }
  }
}

export const queryOptimizer = new QueryOptimizer()
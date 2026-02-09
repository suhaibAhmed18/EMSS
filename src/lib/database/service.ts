import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase-types'

// Create a singleton instance for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export class DatabaseService {
  public supabase = supabase

  // Store operations
  async getStoresByUserId(userId: string): Promise<Database['public']['Tables']['stores']['Row'][]> {
    console.log('🔍 Querying stores for user:', userId)
    
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('❌ Database error:', error)
      throw new Error(`Failed to fetch stores: ${error.message}`)
    }

    console.log('🏪 Query result:', data ? `${data.length} stores found` : 'null result')
    if (data && data.length > 0) {
      console.log('🏪 Store details:', data.map((s: any) => ({ 
        id: s.id, 
        domain: s.shop_domain, 
        active: s.is_active,
        created: s.created_at 
      })))
    }

    return data || []
  }

  async getStoreById(storeId: string): Promise<Database['public']['Tables']['stores']['Row']> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to fetch store: ${error.message}`)
    }

    return data
  }

  async updateStore(storeId: string, updates: Database['public']['Tables']['stores']['Update']): Promise<Database['public']['Tables']['stores']['Row']> {
    const { data, error } = await (supabase as any)
      .from('stores')
      .update(updates)
      .eq('id', storeId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to update store: ${error.message}`)
    }

    return data
  }

  async createStore(storeData: Database['public']['Tables']['stores']['Insert']): Promise<Database['public']['Tables']['stores']['Row']> {
    const { data, error } = await (supabase as any)
      .from('stores')
      .insert(storeData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to create store: ${error.message}`)
    }

    return data
  }

  async deleteStore(storeId: string): Promise<boolean> {
    // PERMANENT DELETE - This will cascade delete all related data
    const { error } = await (supabase as any)
      .from('stores')
      .delete()
      .eq('id', storeId)

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to delete store: ${error.message}`)
    }

    return true
  }

  // Contact operations
  async getContactsByStoreId(storeId: string, limit = 100, offset = 0) {
    const { data, error, count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to fetch contacts: ${error.message}`)
    }

    return { contacts: data || [], total: count || 0 }
  }

  async getContactById(contactId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to fetch contact: ${error.message}`)
    }

    return data
  }

  async createContact(contactData: Database['public']['Tables']['contacts']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to create contact: ${error.message}`)
    }

    return data
  }

  // Campaign operations
  async getEmailCampaignsByStoreId(storeId: string, limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('email_campaigns')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to fetch email campaigns: ${error.message}`)
    }

    return { campaigns: data || [], total: count || 0 }
  }

  async getSMSCampaignsByStoreId(storeId: string, limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('sms_campaigns')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to fetch SMS campaigns: ${error.message}`)
    }

    return { campaigns: data || [], total: count || 0 }
  }

  async createEmailCampaign(campaignData: Database['public']['Tables']['email_campaigns']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('email_campaigns')
      .insert(campaignData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to create email campaign: ${error.message}`)
    }

    return data
  }

  async createSMSCampaign(campaignData: Database['public']['Tables']['sms_campaigns']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('sms_campaigns')
      .insert(campaignData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to create SMS campaign: ${error.message}`)
    }

    return data
  }

  async createAutomationWorkflow(workflowData: Database['public']['Tables']['automation_workflows']['Insert']) {
    const { data, error } = await (supabase as any)
      .from('automation_workflows')
      .insert(workflowData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to create automation workflow: ${error.message}`)
    }

    return data
  }

  async getAutomationWorkflowsByStoreId(storeId: string, limit = 50, offset = 0) {
    const { data, error, count } = await supabase
      .from('automation_workflows')
      .select('*', { count: 'exact' })
      .eq('store_id', storeId)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      throw new Error(`Failed to fetch automation workflows: ${error.message}`)
    }

    return { workflows: data || [], total: count || 0 }
  }

  async updatePlaceholderStore(shopDomain: string, realUserId: string): Promise<boolean> {
    console.log('🔄 Updating placeholder store user_id:', { shopDomain, realUserId })
    
    const { data, error } = await (supabase as any)
      .from('stores')
      .update({ user_id: realUserId })
      .eq('shop_domain', shopDomain)
      .eq('user_id', '00000000-0000-0000-0000-000000000000') // Only update placeholder stores
      .select()

    if (error) {
      console.error('Database error updating placeholder store:', error)
      throw new Error(`Failed to update placeholder store: ${error.message}`)
    }

    console.log('✅ Placeholder store updated:', data)
    return true
  }

  // Analytics operations
  async getStoreAnalytics(storeId: string) {
    try {
      // Get contact count
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)

      // Get email campaign count
      const { count: emailCampaignCount } = await supabase
        .from('email_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)

      // Get SMS campaign count
      const { count: smsCampaignCount } = await supabase
        .from('sms_campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)

      // Get automation count
      const { count: automationCount } = await supabase
        .from('automation_workflows')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', storeId)

      // Calculate revenue from orders (if available)
      const { data: orders } = await supabase
        .from('shopify_orders')
        .select('total_price')
        .eq('store_id', storeId)

      const revenue = (orders as any)?.reduce((sum: number, order: any) => sum + (order.total_price || 0), 0) || 0

      return {
        totalContacts: contactCount || 0,
        emailCampaigns: emailCampaignCount || 0,
        smsCampaigns: smsCampaignCount || 0,
        automations: automationCount || 0,
        revenue: revenue
      }
    } catch (error) {
      console.error('Failed to fetch store analytics:', error)
      return {
        totalContacts: 0,
        emailCampaigns: 0,
        smsCampaigns: 0,
        automations: 0,
        revenue: 0
      }
    }
  }
  // Get revenue history for charts (last 30 days)
  async getRevenueHistory(storeId: string, days: number = 30) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data: orders } = await supabase
        .from('shopify_orders')
        .select('total_price, created_at_shopify, currency')
        .eq('store_id', storeId)
        .gte('created_at_shopify', startDate.toISOString())
        .order('created_at_shopify', { ascending: true })

      // Group by date
      const revenueByDate: Record<string, { email: number; sms: number; total: number }> = {}

      orders?.forEach((order: any) => {
        const date = new Date(order.created_at_shopify).toISOString().split('T')[0]
        if (!revenueByDate[date]) {
          revenueByDate[date] = { email: 0, sms: 0, total: 0 }
        }
        const amount = parseFloat(String(order.total_price)) || 0
        revenueByDate[date].total += amount
        // For now, split revenue 70/30 between email/sms as placeholder
        revenueByDate[date].email += amount * 0.7
        revenueByDate[date].sms += amount * 0.3
      })

      // Fill in missing dates with zeros
      const result = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        result.push({
          date: dateStr,
          email: Math.round(revenueByDate[dateStr]?.email || 0),
          sms: Math.round(revenueByDate[dateStr]?.sms || 0),
          total: Math.round(revenueByDate[dateStr]?.total || 0)
        })
      }

      return result
    } catch (error) {
      console.error('Failed to fetch revenue history:', error)
      return []
    }
  }

  // Get historical comparison data
  async getHistoricalComparison(storeId: string, currentDays: number = 7) {
    try {
      const now = new Date()
      const currentStart = new Date(now)
      currentStart.setDate(currentStart.getDate() - currentDays)

      const previousStart = new Date(currentStart)
      previousStart.setDate(previousStart.getDate() - currentDays)

      // Current period
      const { data: currentOrders } = await supabase
        .from('shopify_orders')
        .select('total_price')
        .eq('store_id', storeId)
        .gte('created_at_shopify', currentStart.toISOString())

      const currentRevenue = currentOrders?.reduce((sum, order) =>
        sum + (parseFloat(String(order.total_price)) || 0), 0) || 0

      // Previous period
      const { data: previousOrders } = await supabase
        .from('shopify_orders')
        .select('total_price')
        .eq('store_id', storeId)
        .gte('created_at_shopify', previousStart.toISOString())
        .lt('created_at_shopify', currentStart.toISOString())

      const previousRevenue = previousOrders?.reduce((sum, order) =>
        sum + (parseFloat(String(order.total_price)) || 0), 0) || 0

      // Calculate percentage changes
      const revenueChange = previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0

      // Get contact changes
      const { count: currentContacts } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .gte('created_at', currentStart.toISOString())

      const { count: previousContacts } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', currentStart.toISOString())

      const contactChange = (previousContacts || 0) > 0
        ? (((currentContacts || 0) - (previousContacts || 0)) / (previousContacts || 0)) * 100
        : 0

      // Get campaign changes
      const { count: currentCampaigns } = await supabase
        .from('email_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .gte('created_at', currentStart.toISOString())

      const { count: previousCampaigns } = await supabase
        .from('email_campaigns')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', storeId)
        .gte('created_at', previousStart.toISOString())
        .lt('created_at', currentStart.toISOString())

      const campaignChange = (previousCampaigns || 0) > 0
        ? (((currentCampaigns || 0) - (previousCampaigns || 0)) / (previousCampaigns || 0)) * 100
        : 0

      return {
        revenueChange: Math.round(revenueChange * 10) / 10,
        contactChange: Math.round(contactChange * 10) / 10,
        campaignChange: Math.round(campaignChange * 10) / 10,
        messageChange: Math.round(campaignChange * 10) / 10 // Use campaign change as proxy
      }
    } catch (error) {
      console.error('Failed to fetch historical comparison:', error)
      return {
        revenueChange: 0,
        contactChange: 0,
        campaignChange: 0,
        messageChange: 0
      }
    }
  }

  // Get top performing automations
  async getTopAutomations(storeId: string, limit: number = 3) {
      try {
        const { data: automations } = await supabase
          .from('automation_workflows')
          .select('*')
          .eq('store_id', storeId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit)

        if (!automations || automations.length === 0) {
          return []
        }

        // For now, return automations with simulated metrics
        // In production, you'd track actual execution data in an automation_executions table
        return automations.map((automation: any, index: number) => {
          // Simulate metrics based on automation age and type
          const daysOld = Math.floor((Date.now() - new Date(automation.created_at).getTime()) / (1000 * 60 * 60 * 24))
          const baseTriggers = Math.max(10, daysOld * 5)
          const baseRevenue = baseTriggers * (50 + Math.random() * 100)

          return {
            id: automation.id,
            name: automation.name,
            type: automation.trigger_type || 'Unknown',
            status: automation.is_active ? 'active' : 'paused',
            triggers: baseTriggers + Math.floor(Math.random() * 20),
            revenue: `$${Math.round(baseRevenue).toLocaleString()}`
          }
        })
      } catch (error) {
        console.error('Failed to fetch top automations:', error)
        return []
      }
    }

  // Calculate campaign revenue attribution
  async getCampaignRevenue(campaignId: string, campaignType: 'email' | 'sms') {
      try {
        // Get campaign sends from unified campaign_sends table
        const { data: sends } = await supabase
          .from('campaign_sends')
          .select('contact_id')
          .eq('campaign_id', campaignId)
          .eq('campaign_type', campaignType)

        if (!sends || sends.length === 0) {
          return 0
        }

        const contactIds = sends.map((s: any) => s.contact_id).filter(Boolean)

        if (contactIds.length === 0) {
          return 0
        }

        // Get campaign sent date
        const { data: campaign } = await supabase
          .from(campaignType === 'email' ? 'email_campaigns' : 'sms_campaigns')
          .select('sent_at')
          .eq('id', campaignId)
          .single()

        if (!campaign?.sent_at) {
          return 0
        }

        const sentDate = new Date(campaign.sent_at)
        const attributionWindow = new Date(sentDate)
        attributionWindow.setDate(attributionWindow.getDate() + 7)

        // Get orders from these contacts within 7 days of campaign
        const { data: orders } = await supabase
          .from('shopify_orders')
          .select('total_price')
          .in('contact_id', contactIds)
          .gte('created_at_shopify', sentDate.toISOString())
          .lte('created_at_shopify', attributionWindow.toISOString())

        const revenue = orders?.reduce((sum, order) => 
          sum + (parseFloat(String(order.total_price)) || 0), 0) || 0

        return revenue
      } catch (error) {
        console.error('Failed to calculate campaign revenue:', error)
        return 0
      }
    }

  // Dashboard data
  async getDashboardData(userId: string) {
    try {
      console.log('🔍 Getting dashboard data for user:', userId)
      
      // Get user's stores
      const stores = await this.getStoresByUserId(userId)
      console.log('🏪 Found stores:', stores.length, stores.map(s => ({ id: s.id, domain: s.shop_domain, active: s.is_active })))
      
      const hasStore = stores.length > 0
      console.log('🏪 Has store:', hasStore)

      if (!hasStore) {
        console.log('❌ No stores found - returning empty state')
        return {
          hasStore: false,
          storeMetrics: null,
          campaignStats: {
            emailCampaigns: 0,
            smsCampaigns: 0,
            totalSent: 0,
            totalRevenue: 0
          },
          recentCampaigns: [],
          topAutomations: [],
          contactStats: {
            totalContacts: 0,
            emailConsent: 0,
            smsConsent: 0
          }
        }
      }

      // Get primary store (first one)
      const primaryStore = stores[0]
      
      // Get store analytics
      const analytics = await this.getStoreAnalytics(primaryStore.id)

      // Get order metrics from shopify_orders table
      const { data: orders } = await supabase
        .from('shopify_orders')
        .select('total_price, currency')
        .eq('store_id', primaryStore.id)

      const orderCount = orders?.length || 0
      const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(String(order.total_price)) || 0), 0) || 0
      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0
      const currency = orders?.[0]?.currency || 'USD'

      // Get recent campaigns
      const { campaigns: recentEmailCampaigns } = await this.getEmailCampaignsByStoreId(primaryStore.id, 5)
      const { campaigns: recentSMSCampaigns } = await this.getSMSCampaignsByStoreId(primaryStore.id, 5)

      // Combine and sort campaigns
      const allCampaigns = [
        ...(recentEmailCampaigns as any[]).map((c: any) => ({ ...c, type: 'email' as const })),
        ...(recentSMSCampaigns as any[]).map((c: any) => ({ ...c, type: 'sms' as const }))
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Calculate revenue for each campaign
      const recentCampaignsWithRevenue = await Promise.all(
        allCampaigns.slice(0, 5).map(async (campaign: any) => {
          const revenue = await this.getCampaignRevenue(campaign.id, campaign.type)
          return {
            id: campaign.id,
            name: campaign.name,
            type: campaign.type,
            status: campaign.status,
            sent: campaign.recipient_count?.toString() || '0',
            opened: campaign.type === 'email' ? (campaign.opened_count?.toString() || '0') : 'N/A',
            clicked: campaign.type === 'email' ? (campaign.clicked_count?.toString() || '0') : 'N/A',
            revenue: `$${Math.round(revenue).toLocaleString()}`,
            date: new Date(campaign.created_at).toLocaleDateString()
          }
        })
      )

      // Get contact stats
      const { count: emailConsentCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', primaryStore.id)
        .eq('email_consent', true)

      const { count: smsConsentCount } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('store_id', primaryStore.id)
        .eq('sms_consent', true)

      // Get historical comparison data
      const historicalData = await this.getHistoricalComparison(primaryStore.id, 7)

      // Get revenue history for charts
      const revenueHistory = await this.getRevenueHistory(primaryStore.id, 30)

      // Get top performing automations
      const topAutomations = await this.getTopAutomations(primaryStore.id, 3)

      return {
        hasStore: true,
        storeMetrics: {
          totalRevenue: `$${Math.round(totalRevenue).toLocaleString()}`,
          orderCount: orderCount.toString(),
          customerCount: analytics.totalContacts.toString(),
          averageOrderValue: `$${Math.round(averageOrderValue).toLocaleString()}`
        },
        campaignStats: {
          emailCampaigns: analytics.emailCampaigns,
          smsCampaigns: analytics.smsCampaigns,
          totalSent: recentCampaignsWithRevenue.reduce((sum: number, c: any) => sum + parseInt(c.sent), 0),
          totalRevenue: analytics.revenue
        },
        recentCampaigns: recentCampaignsWithRevenue,
        topAutomations,
        contactStats: {
          totalContacts: analytics.totalContacts,
          emailConsent: emailConsentCount || 0,
          smsConsent: smsConsentCount || 0
        },
        historicalData,
        revenueHistory
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      throw error
    }
  }
}

export const databaseService = new DatabaseService()
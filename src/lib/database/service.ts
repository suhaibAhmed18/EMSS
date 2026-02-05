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

      // Get recent campaigns
      const { campaigns: recentEmailCampaigns } = await this.getEmailCampaignsByStoreId(primaryStore.id, 5)
      const { campaigns: recentSMSCampaigns } = await this.getSMSCampaignsByStoreId(primaryStore.id, 5)

      // Combine and sort campaigns
      const allCampaigns = [
        ...(recentEmailCampaigns as any[]).map((c: any) => ({ ...c, type: 'email' as const })),
        ...(recentSMSCampaigns as any[]).map((c: any) => ({ ...c, type: 'sms' as const }))
      ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const recentCampaigns = allCampaigns.slice(0, 5).map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        sent: campaign.recipient_count.toString(),
        opened: campaign.type === 'email' ? (campaign.opened_count?.toString() || '0') : 'N/A',
        clicked: campaign.type === 'email' ? (campaign.clicked_count?.toString() || '0') : 'N/A',
        revenue: '0', // Would need to calculate from campaign sends
        date: new Date(campaign.created_at).toLocaleDateString()
      }))

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

      return {
        hasStore: true,
        storeMetrics: {
          totalRevenue: `$${analytics.revenue.toLocaleString()}`,
          orderCount: '0', // Would need to get from orders table
          customerCount: analytics.totalContacts.toString(),
          averageOrderValue: '$0' // Would need to calculate
        },
        campaignStats: {
          emailCampaigns: analytics.emailCampaigns,
          smsCampaigns: analytics.smsCampaigns,
          totalSent: recentCampaigns.reduce((sum: number, c: any) => sum + parseInt(c.sent), 0),
          totalRevenue: analytics.revenue
        },
        recentCampaigns,
        topAutomations: [], // Would need to implement automation analytics
        contactStats: {
          totalContacts: analytics.totalContacts,
          emailConsent: emailConsentCount || 0,
          smsConsent: smsConsentCount || 0
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      throw error
    }
  }
}

export const databaseService = new DatabaseService()
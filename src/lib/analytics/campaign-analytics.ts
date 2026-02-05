// Campaign Analytics System - Performance metrics calculation and revenue attribution
import { 
  EmailCampaignRepository, 
  SMSCampaignRepository,
  CampaignSendRepository 
} from '../database/repositories'
import { createServiceSupabaseClient } from '../database/client'
import { CampaignStatus } from '../database/types'
import { DatabaseResult } from '../database/client'

export interface CampaignMetrics {
  campaignId: string
  campaignType: 'email' | 'sms'
  campaignName: string
  status: CampaignStatus
  sentAt: Date | null
  scheduledAt: Date | null
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
  revenue: number
  revenuePerRecipient: number
  createdAt: Date
}

export interface StoreAnalyticsSummary {
  storeId: string
  totalEmailCampaigns: number
  totalSMSCampaigns: number
  totalEmailsSent: number
  totalSMSSent: number
  totalEmailsDelivered: number
  totalSMSDelivered: number
  totalEmailsOpened: number
  totalEmailsClicked: number
  averageEmailOpenRate: number
  averageEmailClickRate: number
  averageEmailDeliveryRate: number
  averageSMSDeliveryRate: number
  totalRevenue: number
  averageRevenuePerCampaign: number
  averageRevenuePerRecipient: number
  lastCampaignSent: Date | null
}

export interface RevenueAttribution {
  campaignId: string
  campaignType: 'email' | 'sms'
  contactId: string
  orderId: string
  orderValue: number
  orderDate: Date
  attributionWindow: number // days
  attributionConfidence: 'high' | 'medium' | 'low'
}

export interface PerformanceComparison {
  period: 'week' | 'month' | 'quarter' | 'year'
  current: StoreAnalyticsSummary
  previous: StoreAnalyticsSummary
  growth: {
    campaignCount: number
    recipientCount: number
    deliveryRate: number
    openRate: number
    clickRate: number
    revenue: number
  }
}

export class CampaignAnalyticsService {
  private emailCampaignRepo: EmailCampaignRepository
  private smsCampaignRepo: SMSCampaignRepository
  private campaignSendRepo: CampaignSendRepository
  private supabase: ReturnType<typeof createServiceSupabaseClient>

  constructor() {
    this.emailCampaignRepo = new EmailCampaignRepository(true)
    this.smsCampaignRepo = new SMSCampaignRepository(true)
    this.campaignSendRepo = new CampaignSendRepository(true)
    this.supabase = createServiceSupabaseClient()
  }

  // Get detailed metrics for a specific email campaign
  async getEmailCampaignMetrics(campaignId: string): Promise<DatabaseResult<CampaignMetrics>> {
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

      // Calculate basic metrics
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

      // Calculate revenue attribution
      const revenue = await this.calculateCampaignRevenue(campaignId, 'email')
      const revenuePerRecipient = totalRecipients > 0 ? revenue / totalRecipients : 0

      return {
        data: {
          campaignId,
          campaignType: 'email',
          campaignName: campaign.name,
          status: campaign.status,
          sentAt: campaign.sent_at,
          scheduledAt: campaign.scheduled_at,
          totalRecipients,
          deliveredCount,
          openedCount,
          clickedCount,
          bouncedCount,
          failedCount,
          deliveryRate,
          openRate,
          clickRate,
          bounceRate,
          revenue,
          revenuePerRecipient,
          createdAt: campaign.created_at
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to get email campaign metrics') 
      }
    }
  }

  // Get detailed metrics for a specific SMS campaign
  async getSMSCampaignMetrics(campaignId: string): Promise<DatabaseResult<CampaignMetrics>> {
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

      // Calculate basic metrics
      const totalRecipients = sends.length
      const deliveredCount = sends.filter(s => s.status === 'delivered').length
      const bouncedCount = sends.filter(s => s.status === 'bounced').length
      const failedCount = sends.filter(s => s.status === 'failed').length

      const deliveryRate = totalRecipients > 0 ? (deliveredCount / totalRecipients) * 100 : 0
      const bounceRate = totalRecipients > 0 ? (bouncedCount / totalRecipients) * 100 : 0

      // Calculate revenue attribution
      const revenue = await this.calculateCampaignRevenue(campaignId, 'sms')
      const revenuePerRecipient = totalRecipients > 0 ? revenue / totalRecipients : 0

      return {
        data: {
          campaignId,
          campaignType: 'sms',
          campaignName: campaign.name,
          status: campaign.status,
          sentAt: campaign.sent_at,
          scheduledAt: campaign.scheduled_at,
          totalRecipients,
          deliveredCount,
          bouncedCount,
          failedCount,
          deliveryRate,
          bounceRate,
          revenue,
          revenuePerRecipient,
          createdAt: campaign.created_at
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to get SMS campaign metrics') 
      }
    }
  }

  // Get comprehensive analytics summary for a store
  async getStoreAnalyticsSummary(
    storeId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<DatabaseResult<StoreAnalyticsSummary>> {
    try {
      // Get email campaigns
      const { data: emailCampaigns } = await this.emailCampaignRepo.getStoreCampaigns(storeId)
      const filteredEmailCampaigns = dateRange 
        ? emailCampaigns.filter(c => 
            c.created_at >= dateRange.start && c.created_at <= dateRange.end
          )
        : emailCampaigns

      // Get SMS campaigns
      const { data: smsCampaigns } = await this.smsCampaignRepo.getStoreCampaigns(storeId)
      const filteredSMSCampaigns = dateRange 
        ? smsCampaigns.filter(c => 
            c.created_at >= dateRange.start && c.created_at <= dateRange.end
          )
        : smsCampaigns

      // Calculate email metrics
      const totalEmailsSent = filteredEmailCampaigns.reduce((sum, campaign) => sum + campaign.recipient_count, 0)
      const totalEmailsDelivered = filteredEmailCampaigns.reduce((sum, campaign) => sum + campaign.delivered_count, 0)
      const totalEmailsOpened = filteredEmailCampaigns.reduce((sum, campaign) => sum + campaign.opened_count, 0)
      const totalEmailsClicked = filteredEmailCampaigns.reduce((sum, campaign) => sum + campaign.clicked_count, 0)

      // Calculate SMS metrics
      const totalSMSSent = filteredSMSCampaigns.reduce((sum, campaign) => sum + campaign.recipient_count, 0)
      const totalSMSDelivered = filteredSMSCampaigns.reduce((sum, campaign) => sum + campaign.delivered_count, 0)

      // Calculate rates
      const averageEmailDeliveryRate = totalEmailsSent > 0 ? (totalEmailsDelivered / totalEmailsSent) * 100 : 0
      const averageEmailOpenRate = totalEmailsDelivered > 0 ? (totalEmailsOpened / totalEmailsDelivered) * 100 : 0
      const averageEmailClickRate = totalEmailsOpened > 0 ? (totalEmailsClicked / totalEmailsOpened) * 100 : 0
      const averageSMSDeliveryRate = totalSMSSent > 0 ? (totalSMSDelivered / totalSMSSent) * 100 : 0

      // Calculate revenue
      const emailRevenue = await Promise.all(
        filteredEmailCampaigns.map(c => this.calculateCampaignRevenue(c.id, 'email'))
      )
      const smsRevenue = await Promise.all(
        filteredSMSCampaigns.map(c => this.calculateCampaignRevenue(c.id, 'sms'))
      )

      const totalRevenue = [...emailRevenue, ...smsRevenue].reduce((sum, rev) => sum + rev, 0)
      const totalCampaigns = filteredEmailCampaigns.length + filteredSMSCampaigns.length
      const totalRecipients = totalEmailsSent + totalSMSSent

      const averageRevenuePerCampaign = totalCampaigns > 0 ? totalRevenue / totalCampaigns : 0
      const averageRevenuePerRecipient = totalRecipients > 0 ? totalRevenue / totalRecipients : 0

      // Find last campaign sent
      const allCampaigns = [
        ...filteredEmailCampaigns.map(c => ({ ...c, type: 'email' as const })),
        ...filteredSMSCampaigns.map(c => ({ ...c, type: 'sms' as const }))
      ]
      const sentCampaigns = allCampaigns.filter(c => c.sent_at)
      const lastCampaignSent = sentCampaigns.length > 0 
        ? sentCampaigns.reduce((latest, campaign) => 
            !latest || (campaign.sent_at && campaign.sent_at > latest) ? campaign.sent_at : latest
          , null as Date | null)
        : null

      return {
        data: {
          storeId,
          totalEmailCampaigns: filteredEmailCampaigns.length,
          totalSMSCampaigns: filteredSMSCampaigns.length,
          totalEmailsSent,
          totalSMSSent,
          totalEmailsDelivered,
          totalSMSDelivered,
          totalEmailsOpened,
          totalEmailsClicked,
          averageEmailOpenRate,
          averageEmailClickRate,
          averageEmailDeliveryRate,
          averageSMSDeliveryRate,
          totalRevenue,
          averageRevenuePerCampaign,
          averageRevenuePerRecipient,
          lastCampaignSent
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to get store analytics summary') 
      }
    }
  }

  // Calculate revenue attribution for a campaign
  private async calculateCampaignRevenue(
    campaignId: string, 
    campaignType: 'email' | 'sms',
    attributionWindow: number = 7 // days
  ): Promise<number> {
    try {
      // Get campaign sends
      const { data: sends } = await this.campaignSendRepo.getCampaignSends(campaignId)
      if (!sends || sends.length === 0) return 0

      // Get campaign details to find store_id
      let storeId: string
      if (campaignType === 'email') {
        const { data: campaign } = await this.emailCampaignRepo.getCampaign(campaignId)
        if (!campaign) return 0
        storeId = campaign.store_id
      } else {
        const { data: campaign } = await this.smsCampaignRepo.getCampaign(campaignId)
        if (!campaign) return 0
        storeId = campaign.store_id
      }

      // Calculate attribution window
      const campaignSentDate = sends[0]?.created_at
      if (!campaignSentDate) return 0

      const attributionEndDate = new Date(campaignSentDate)
      attributionEndDate.setDate(attributionEndDate.getDate() + attributionWindow)

      // Get orders from contacts who received the campaign within attribution window
      const contactIds = sends.map(send => send.contact_id)
      
      const { data: orders, error } = await this.supabase
        .from('shopify_orders')
        .select('total_price, created_at_shopify, contact_id')
        .eq('store_id', storeId)
        .in('contact_id', contactIds)
        .gte('created_at_shopify', campaignSentDate.toISOString())
        .lte('created_at_shopify', attributionEndDate.toISOString())
        .not('total_price', 'is', null)

      if (error || !orders) return 0

      // Sum up the revenue
      return orders.reduce((total, order) => total + ((order as { total_price?: number }).total_price || 0), 0)

    } catch (error) {
      console.error('Error calculating campaign revenue:', error)
      return 0
    }
  }

  // Get detailed revenue attribution for a campaign
  async getCampaignRevenueAttribution(
    campaignId: string,
    campaignType: 'email' | 'sms',
    attributionWindow: number = 7
  ): Promise<DatabaseResult<RevenueAttribution[]>> {
    try {
      // Get campaign sends
      const { data: sends } = await this.campaignSendRepo.getCampaignSends(campaignId)
      if (!sends || sends.length === 0) {
        return { data: [], error: null }
      }

      // Get campaign details to find store_id
      let storeId: string
      if (campaignType === 'email') {
        const { data: campaign } = await this.emailCampaignRepo.getCampaign(campaignId)
        if (!campaign) return { data: [], error: new Error('Campaign not found') }
        storeId = campaign.store_id
      } else {
        const { data: campaign } = await this.smsCampaignRepo.getCampaign(campaignId)
        if (!campaign) return { data: [], error: new Error('Campaign not found') }
        storeId = campaign.store_id
      }

      // Calculate attribution window
      const campaignSentDate = sends[0]?.created_at
      if (!campaignSentDate) return { data: [], error: null }

      const attributionEndDate = new Date(campaignSentDate)
      attributionEndDate.setDate(attributionEndDate.getDate() + attributionWindow)

      // Get orders from contacts who received the campaign within attribution window
      const contactIds = sends.map(send => send.contact_id)
      
      const { data: orders, error } = await this.supabase
        .from('shopify_orders')
        .select('id, total_price, created_at_shopify, contact_id')
        .eq('store_id', storeId)
        .in('contact_id', contactIds)
        .gte('created_at_shopify', campaignSentDate.toISOString())
        .lte('created_at_shopify', attributionEndDate.toISOString())
        .not('total_price', 'is', null)

      if (error) return { data: [], error }
      if (!orders) return { data: [], error: null }

      // Create attribution records
      const attributions: RevenueAttribution[] = orders.map(order => {
        const orderTyped = order as { 
          created_at_shopify: string
          contact_id: string
          id: string
          total_price: number
        }
        const orderDate = new Date(orderTyped.created_at_shopify)
        const daysSinceCampaign = Math.floor(
          (orderDate.getTime() - campaignSentDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        // Determine attribution confidence based on timing
        let attributionConfidence: 'high' | 'medium' | 'low'
        if (daysSinceCampaign <= 1) {
          attributionConfidence = 'high'
        } else if (daysSinceCampaign <= 3) {
          attributionConfidence = 'medium'
        } else {
          attributionConfidence = 'low'
        }

        return {
          campaignId,
          campaignType,
          contactId: orderTyped.contact_id,
          orderId: orderTyped.id,
          orderValue: orderTyped.total_price,
          orderDate,
          attributionWindow,
          attributionConfidence
        }
      })

      return { data: attributions, error: null }

    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Failed to get revenue attribution') 
      }
    }
  }

  // Get performance comparison between periods
  async getPerformanceComparison(
    storeId: string,
    period: 'week' | 'month' | 'quarter' | 'year'
  ): Promise<DatabaseResult<PerformanceComparison>> {
    try {
      const now = new Date()
      let currentStart: Date, currentEnd: Date, previousStart: Date, previousEnd: Date

      switch (period) {
        case 'week':
          currentEnd = new Date(now)
          currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          previousEnd = new Date(currentStart)
          previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          currentEnd = new Date(now)
          currentStart = new Date(now.getFullYear(), now.getMonth(), 1)
          previousEnd = new Date(currentStart)
          previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
          break
        case 'quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3)
          currentStart = new Date(now.getFullYear(), currentQuarter * 3, 1)
          currentEnd = new Date(now)
          previousStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 3, 1)
          previousEnd = new Date(currentStart)
          break
        case 'year':
          currentStart = new Date(now.getFullYear(), 0, 1)
          currentEnd = new Date(now)
          previousStart = new Date(now.getFullYear() - 1, 0, 1)
          previousEnd = new Date(currentStart)
          break
      }

      // Get current period analytics
      const { data: current, error: currentError } = await this.getStoreAnalyticsSummary(
        storeId, 
        { start: currentStart, end: currentEnd }
      )

      if (currentError || !current) {
        return { data: null, error: currentError || new Error('Failed to get current period data') }
      }

      // Get previous period analytics
      const { data: previous, error: previousError } = await this.getStoreAnalyticsSummary(
        storeId, 
        { start: previousStart, end: previousEnd }
      )

      if (previousError || !previous) {
        return { data: null, error: previousError || new Error('Failed to get previous period data') }
      }

      // Calculate growth percentages
      const calculateGrowth = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return ((current - previous) / previous) * 100
      }

      const growth = {
        campaignCount: calculateGrowth(
          current.totalEmailCampaigns + current.totalSMSCampaigns,
          previous.totalEmailCampaigns + previous.totalSMSCampaigns
        ),
        recipientCount: calculateGrowth(
          current.totalEmailsSent + current.totalSMSSent,
          previous.totalEmailsSent + previous.totalSMSSent
        ),
        deliveryRate: calculateGrowth(
          (current.averageEmailDeliveryRate + current.averageSMSDeliveryRate) / 2,
          (previous.averageEmailDeliveryRate + previous.averageSMSDeliveryRate) / 2
        ),
        openRate: calculateGrowth(current.averageEmailOpenRate, previous.averageEmailOpenRate),
        clickRate: calculateGrowth(current.averageEmailClickRate, previous.averageEmailClickRate),
        revenue: calculateGrowth(current.totalRevenue, previous.totalRevenue)
      }

      return {
        data: {
          period,
          current,
          previous,
          growth
        },
        error: null
      }

    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Failed to get performance comparison') 
      }
    }
  }

  // Get top performing campaigns
  async getTopPerformingCampaigns(
    storeId: string,
    metric: 'revenue' | 'open_rate' | 'click_rate' | 'delivery_rate',
    limit: number = 10,
    campaignType?: 'email' | 'sms'
  ): Promise<DatabaseResult<CampaignMetrics[]>> {
    try {
      const campaigns: CampaignMetrics[] = []

      // Get email campaigns if requested
      if (!campaignType || campaignType === 'email') {
        const { data: emailCampaigns } = await this.emailCampaignRepo.getStoreCampaigns(storeId)
        
        for (const campaign of emailCampaigns.filter(c => c.status === 'sent')) {
          const { data: metrics } = await this.getEmailCampaignMetrics(campaign.id)
          if (metrics) campaigns.push(metrics)
        }
      }

      // Get SMS campaigns if requested
      if (!campaignType || campaignType === 'sms') {
        const { data: smsCampaigns } = await this.smsCampaignRepo.getStoreCampaigns(storeId)
        
        for (const campaign of smsCampaigns.filter(c => c.status === 'sent')) {
          const { data: metrics } = await this.getSMSCampaignMetrics(campaign.id)
          if (metrics) campaigns.push(metrics)
        }
      }

      // Sort by the requested metric
      campaigns.sort((a, b) => {
        switch (metric) {
          case 'revenue':
            return b.revenue - a.revenue
          case 'open_rate':
            return (b.openRate || 0) - (a.openRate || 0)
          case 'click_rate':
            return (b.clickRate || 0) - (a.clickRate || 0)
          case 'delivery_rate':
            return b.deliveryRate - a.deliveryRate
          default:
            return 0
        }
      })

      return { data: campaigns.slice(0, limit), error: null }

    } catch (error) {
      return { 
        data: [], 
        error: error instanceof Error ? error : new Error('Failed to get top performing campaigns') 
      }
    }
  }
}

// Export singleton instance
export const campaignAnalyticsService = new CampaignAnalyticsService()
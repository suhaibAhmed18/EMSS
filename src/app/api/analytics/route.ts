import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

interface TimeSeriesData {
  date: string
  revenue: number
  emailRevenue: number
  smsRevenue: number
  orders: number
}

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({
        overview: { totalRevenue: 0, emailRevenue: 0, smsRevenue: 0, roi: 0, totalCost: 0 },
        email: { sent: 0, openRate: 0, clickRate: 0, conversionRate: 0, revenue: 0 },
        sms: { sent: 0, deliveryRate: 0, clickRate: 0, conversionRate: 0, revenue: 0 },
        automation: { totalRuns: 0, successRate: 0, revenue: 0, conversionRate: 0 },
        topCampaigns: [],
        revenueTimeSeries: [],
        emailTimeSeries: [],
        smsTimeSeries: []
      })
    }

    const storeId = stores[0].id
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '12m':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    // Get all orders in date range with attribution
    const { data: orders } = await databaseService.supabase
      .from('shopify_orders')
      .select('total_price, created_at_shopify, attributed_campaign_id, attributed_campaign_type')
      .eq('store_id', storeId)
      .gte('created_at_shopify', startDate.toISOString())
      .lte('created_at_shopify', endDate.toISOString())

    const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(String(order.total_price)) || 0), 0) || 0
    const emailRevenue = orders?.filter(o => o.attributed_campaign_type === 'email')
      .reduce((sum, order) => sum + (parseFloat(String(order.total_price)) || 0), 0) || 0
    const smsRevenue = orders?.filter(o => o.attributed_campaign_type === 'sms')
      .reduce((sum, order) => sum + (parseFloat(String(order.total_price)) || 0), 0) || 0
    const automationRevenue = orders?.filter(o => o.attributed_campaign_type === 'automation')
      .reduce((sum, order) => sum + (parseFloat(String(order.total_price)) || 0), 0) || 0

    // Get email campaigns in date range
    const { data: emailCampaigns } = await databaseService.supabase
      .from('email_campaigns')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const emailSent = emailCampaigns?.reduce((sum, c: any) => sum + (c.recipient_count || 0), 0) || 0
    const emailOpened = emailCampaigns?.reduce((sum, c: any) => sum + (c.opened_count || 0), 0) || 0
    const emailClicked = emailCampaigns?.reduce((sum, c: any) => sum + (c.clicked_count || 0), 0) || 0
    const emailConversions = emailCampaigns?.reduce((sum, c: any) => sum + (c.conversion_count || 0), 0) || 0
    const emailCost = emailCampaigns?.reduce((sum, c: any) => sum + (parseFloat(String(c.cost)) || 0), 0) || 0

    // Get SMS campaigns in date range
    const { data: smsCampaigns } = await databaseService.supabase
      .from('sms_campaigns')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const smsSent = smsCampaigns?.reduce((sum, c: any) => sum + (c.recipient_count || 0), 0) || 0
    const smsDelivered = smsCampaigns?.reduce((sum, c: any) => sum + (c.delivered_count || 0), 0) || 0
    const smsClicked = smsCampaigns?.reduce((sum, c: any) => sum + (c.clicked_count || 0), 0) || 0
    const smsConversions = smsCampaigns?.reduce((sum, c: any) => sum + (c.conversion_count || 0), 0) || 0
    const smsCost = smsCampaigns?.reduce((sum, c: any) => sum + (parseFloat(String(c.cost)) || 0), 0) || 0

    // Get automation workflows
    const { data: automations } = await databaseService.supabase
      .from('automation_workflows')
      .select('*')
      .eq('store_id', storeId)

    const totalAutomationRuns = automations?.reduce((sum, a: any) => sum + (a.total_runs || 0), 0) || 0
    const successfulAutomationRuns = automations?.reduce((sum, a: any) => sum + (a.successful_runs || 0), 0) || 0
    const automationConversions = automations?.reduce((sum, a: any) => sum + (a.conversion_count || 0), 0) || 0
    const automationCost = automations?.reduce((sum, a: any) => sum + (parseFloat(String(a.cost)) || 0), 0) || 0

    const totalCost = emailCost + smsCost + automationCost
    const roi = totalCost > 0 ? Math.round(((totalRevenue - totalCost) / totalCost) * 100) : 0

    // Generate time series data
    const revenueTimeSeries = generateTimeSeries(orders || [], startDate, endDate, timeRange)
    const emailTimeSeries = generateEmailTimeSeries(emailCampaigns || [], startDate, endDate, timeRange)
    const smsTimeSeries = generateSmsTimeSeries(smsCampaigns || [], startDate, endDate, timeRange)

    // Get top performing campaigns
    const allCampaigns = [
      ...(emailCampaigns || []).map((c: any) => ({ ...c, type: 'email' as const })),
      ...(smsCampaigns || []).map((c: any) => ({ ...c, type: 'sms' as const }))
    ]

    const topCampaigns = allCampaigns
      .sort((a: any, b: any) => (parseFloat(String(b.revenue)) || 0) - (parseFloat(String(a.revenue)) || 0))
      .slice(0, 10)
      .map((campaign: any) => ({
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        revenue: parseFloat(String(campaign.revenue)) || 0,
        sent: campaign.recipient_count || 0,
        openRate: campaign.type === 'email' && campaign.recipient_count > 0 
          ? Math.round((campaign.opened_count || 0) / campaign.recipient_count * 100) 
          : 0,
        clickRate: campaign.recipient_count > 0 
          ? Math.round((campaign.clicked_count || 0) / campaign.recipient_count * 100) 
          : 0,
        conversionRate: campaign.recipient_count > 0 
          ? Math.round((campaign.conversion_count || 0) / campaign.recipient_count * 100) 
          : 0
      }))
    
    return NextResponse.json({
      overview: {
        totalRevenue,
        emailRevenue,
        smsRevenue,
        automationRevenue,
        roi,
        totalCost
      },
      email: {
        sent: emailSent,
        openRate: emailSent > 0 ? Math.round(emailOpened / emailSent * 100) : 0,
        clickRate: emailSent > 0 ? Math.round(emailClicked / emailSent * 100) : 0,
        conversionRate: emailSent > 0 ? Math.round(emailConversions / emailSent * 100) : 0,
        revenue: emailRevenue
      },
      sms: {
        sent: smsSent,
        deliveryRate: smsSent > 0 ? Math.round(smsDelivered / smsSent * 100) : 0,
        clickRate: smsSent > 0 ? Math.round(smsClicked / smsSent * 100) : 0,
        conversionRate: smsSent > 0 ? Math.round(smsConversions / smsSent * 100) : 0,
        revenue: smsRevenue
      },
      automation: {
        totalRuns: totalAutomationRuns,
        successRate: totalAutomationRuns > 0 ? Math.round(successfulAutomationRuns / totalAutomationRuns * 100) : 0,
        revenue: automationRevenue,
        conversionRate: totalAutomationRuns > 0 ? Math.round(automationConversions / totalAutomationRuns * 100) : 0
      },
      topCampaigns,
      revenueTimeSeries,
      emailTimeSeries,
      smsTimeSeries
    })
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

function generateTimeSeries(orders: any[], startDate: Date, endDate: Date, timeRange: string): TimeSeriesData[] {
  const data: Map<string, TimeSeriesData> = new Map()
  const dateFormat = timeRange === '12m' ? 'month' : 'day'
  
  // Initialize all dates in range
  const current = new Date(startDate)
  while (current <= endDate) {
    const key = dateFormat === 'month' 
      ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      : current.toISOString().split('T')[0]
    
    data.set(key, {
      date: key,
      revenue: 0,
      emailRevenue: 0,
      smsRevenue: 0,
      orders: 0
    })
    
    if (dateFormat === 'month') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setDate(current.getDate() + 1)
    }
  }
  
  // Aggregate order data
  orders.forEach(order => {
    const orderDate = new Date(order.created_at_shopify)
    const key = dateFormat === 'month'
      ? `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`
      : orderDate.toISOString().split('T')[0]
    
    const existing = data.get(key)
    if (existing) {
      const revenue = parseFloat(String(order.total_price)) || 0
      existing.revenue += revenue
      existing.orders += 1
      
      if (order.attributed_campaign_type === 'email') {
        existing.emailRevenue += revenue
      } else if (order.attributed_campaign_type === 'sms') {
        existing.smsRevenue += revenue
      }
    }
  })
  
  return Array.from(data.values())
}

function generateEmailTimeSeries(campaigns: any[], startDate: Date, endDate: Date, timeRange: string) {
  const data: Map<string, any> = new Map()
  const dateFormat = timeRange === '12m' ? 'month' : 'day'
  
  // Initialize all dates
  const current = new Date(startDate)
  while (current <= endDate) {
    const key = dateFormat === 'month'
      ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      : current.toISOString().split('T')[0]
    
    data.set(key, {
      date: key,
      sent: 0,
      opened: 0,
      clicked: 0,
      openRate: 0,
      clickRate: 0
    })
    
    if (dateFormat === 'month') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setDate(current.getDate() + 1)
    }
  }
  
  // Aggregate campaign data
  campaigns.forEach(campaign => {
    if (campaign.sent_at) {
      const sentDate = new Date(campaign.sent_at)
      const key = dateFormat === 'month'
        ? `${sentDate.getFullYear()}-${String(sentDate.getMonth() + 1).padStart(2, '0')}`
        : sentDate.toISOString().split('T')[0]
      
      const existing = data.get(key)
      if (existing) {
        existing.sent += campaign.recipient_count || 0
        existing.opened += campaign.opened_count || 0
        existing.clicked += campaign.clicked_count || 0
      }
    }
  })
  
  // Calculate rates
  data.forEach(item => {
    item.openRate = item.sent > 0 ? Math.round((item.opened / item.sent) * 100) : 0
    item.clickRate = item.sent > 0 ? Math.round((item.clicked / item.sent) * 100) : 0
  })
  
  return Array.from(data.values())
}

function generateSmsTimeSeries(campaigns: any[], startDate: Date, endDate: Date, timeRange: string) {
  const data: Map<string, any> = new Map()
  const dateFormat = timeRange === '12m' ? 'month' : 'day'
  
  // Initialize all dates
  const current = new Date(startDate)
  while (current <= endDate) {
    const key = dateFormat === 'month'
      ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      : current.toISOString().split('T')[0]
    
    data.set(key, {
      date: key,
      sent: 0,
      delivered: 0,
      clicked: 0,
      deliveryRate: 0,
      clickRate: 0
    })
    
    if (dateFormat === 'month') {
      current.setMonth(current.getMonth() + 1)
    } else {
      current.setDate(current.getDate() + 1)
    }
  }
  
  // Aggregate campaign data
  campaigns.forEach(campaign => {
    if (campaign.sent_at) {
      const sentDate = new Date(campaign.sent_at)
      const key = dateFormat === 'month'
        ? `${sentDate.getFullYear()}-${String(sentDate.getMonth() + 1).padStart(2, '0')}`
        : sentDate.toISOString().split('T')[0]
      
      const existing = data.get(key)
      if (existing) {
        existing.sent += campaign.recipient_count || 0
        existing.delivered += campaign.delivered_count || 0
        existing.clicked += campaign.clicked_count || 0
      }
    }
  })
  
  // Calculate rates
  data.forEach(item => {
    item.deliveryRate = item.sent > 0 ? Math.round((item.delivered / item.sent) * 100) : 0
    item.clickRate = item.sent > 0 ? Math.round((item.clicked / item.sent) * 100) : 0
  })
  
  return Array.from(data.values())
}
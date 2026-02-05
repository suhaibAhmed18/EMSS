import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // For now, return empty analytics since database isn't set up
    console.log('📊 Analytics API called - returning empty data (database not set up)')
    
    return NextResponse.json({
      overview: {
        totalRevenue: 0,
        emailRevenue: 0,
        smsRevenue: 0,
        roi: 0
      },
      email: {
        sent: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0
      },
      sms: {
        sent: 0,
        deliveryRate: 0,
        clickRate: 0,
        conversionRate: 0
      },
      topCampaigns: [],
      message: 'Database tables not set up yet. Please run the database migrations first.'
    })

    // TODO: Uncomment this code after database setup
    /*
    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({
        overview: { totalRevenue: 0, emailRevenue: 0, smsRevenue: 0, roi: 0 },
        email: { sent: 0, openRate: 0, clickRate: 0, conversionRate: 0 },
        sms: { sent: 0, deliveryRate: 0, clickRate: 0, conversionRate: 0 },
        topCampaigns: []
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

    // Get analytics data from database
    const analyticsData = await databaseService.getAnalytics(storeId, startDate, endDate)
    
    return NextResponse.json(analyticsData)
    */
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
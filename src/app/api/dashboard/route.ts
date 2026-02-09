import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API called')
    
    // Get authenticated user
    const user = await authServer.getCurrentUser()
    console.log('👤 Current user:', user ? `${user.id} (${user.email})` : 'null')
    
    if (!user) {
      console.log('❌ No user - returning empty state')
      // No user - return empty state
      return NextResponse.json({
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
      })
    }

    // Get dashboard data from database
    console.log('🔍 Fetching dashboard data for user:', user.id)
    const dashboardData = await databaseService.getDashboardData(user.id)
    console.log('📊 Dashboard data result:', JSON.stringify(dashboardData, null, 2))
    
    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('❌ Dashboard API error:', error)
    
    // Return empty state on error
    return NextResponse.json({
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
    })
  }
}
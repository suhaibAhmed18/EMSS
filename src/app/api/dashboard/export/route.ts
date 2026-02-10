import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'

    // Get dashboard data
    const dashboardData = await databaseService.getDashboardData(user.id)

    // Build CSV content
    const csvRows = []
    
    // Header
    csvRows.push('Dashboard Export')
    csvRows.push(`Generated: ${new Date().toLocaleString()}`)
    csvRows.push(`Time Range: ${timeRange}`)
    csvRows.push('')

    // Store Metrics
    csvRows.push('Store Metrics')
    if (dashboardData.storeMetrics) {
      csvRows.push('Metric,Value')
      csvRows.push(`Total Revenue,${dashboardData.storeMetrics.totalRevenue}`)
      csvRows.push(`Order Count,${dashboardData.storeMetrics.orderCount}`)
      csvRows.push(`Customer Count,${dashboardData.storeMetrics.customerCount}`)
      csvRows.push(`Average Order Value,${dashboardData.storeMetrics.averageOrderValue}`)
    } else {
      csvRows.push('No store connected')
    }
    csvRows.push('')

    // Campaign Stats
    csvRows.push('Campaign Statistics')
    csvRows.push('Metric,Value')
    csvRows.push(`Email Campaigns,${dashboardData.campaignStats.emailCampaigns}`)
    csvRows.push(`SMS Campaigns,${dashboardData.campaignStats.smsCampaigns}`)
    csvRows.push(`Total Sent,${dashboardData.campaignStats.totalSent}`)
    csvRows.push(`Total Revenue,$${dashboardData.campaignStats.totalRevenue}`)
    csvRows.push('')

    // Contact Stats
    csvRows.push('Contact Statistics')
    csvRows.push('Metric,Value')
    csvRows.push(`Total Contacts,${dashboardData.contactStats.totalContacts}`)
    csvRows.push(`Email Consent,${dashboardData.contactStats.emailConsent}`)
    csvRows.push(`SMS Consent,${dashboardData.contactStats.smsConsent}`)
    csvRows.push('')

    // Recent Campaigns
    if (dashboardData.recentCampaigns.length > 0) {
      csvRows.push('Recent Campaigns')
      csvRows.push('Name,Type,Status,Sent,Opened,Clicked,Revenue,Date')
      dashboardData.recentCampaigns.forEach(campaign => {
        csvRows.push(`"${campaign.name}",${campaign.type},${campaign.status},${campaign.sent},${campaign.opened},${campaign.clicked},${campaign.revenue},${campaign.date}`)
      })
      csvRows.push('')
    }

    // Top Automations
    if (dashboardData.topAutomations.length > 0) {
      csvRows.push('Top Performing Automations')
      csvRows.push('Name,Type,Status,Triggers,Revenue')
      dashboardData.topAutomations.forEach(automation => {
        csvRows.push(`"${automation.name}",${automation.type},${automation.status},${automation.triggers},${automation.revenue}`)
      })
      csvRows.push('')
    }

    // Historical Data
    if (dashboardData.historicalData) {
      csvRows.push('Historical Trends')
      csvRows.push('Metric,Change (%)')
      csvRows.push(`Revenue Change,${dashboardData.historicalData.revenueChange.toFixed(2)}`)
      csvRows.push(`Contacts Change,${dashboardData.historicalData.contactsChange.toFixed(2)}`)
      csvRows.push(`Campaigns Change,${dashboardData.historicalData.campaignsChange.toFixed(2)}`)
      csvRows.push(`Messages Change,${dashboardData.historicalData.messagesChange.toFixed(2)}`)
      csvRows.push('')
    }

    // Revenue History
    if (dashboardData.revenueHistory && dashboardData.revenueHistory.length > 0) {
      csvRows.push('Revenue History')
      csvRows.push('Date,Revenue')
      dashboardData.revenueHistory.forEach(entry => {
        csvRows.push(`${entry.date},${entry.revenue}`)
      })
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dashboard-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Failed to export dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to export dashboard data' },
      { status: 500 }
    )
  }
}

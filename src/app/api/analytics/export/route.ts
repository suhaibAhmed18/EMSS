import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function POST(request: NextRequest) {
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
      const csvContent = `Campaign Name,Type,Revenue,Sent,Open Rate,Click Rate,Conversion Rate\nNo stores found,N/A,0,0,0%,0%,0%`
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`
        }
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

    // Get email campaigns in date range
    const { data: emailCampaigns } = await databaseService.supabase
      .from('email_campaigns')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Get SMS campaigns in date range
    const { data: smsCampaigns } = await databaseService.supabase
      .from('sms_campaigns')
      .select('*')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    // Combine all campaigns
    const allCampaigns = [
      ...(emailCampaigns || []).map((c: any) => ({
        name: c.name,
        type: 'email',
        revenue: parseFloat(String(c.revenue)) || 0,
        sent: c.recipient_count || 0,
        openRate: c.recipient_count > 0 ? Math.round((c.opened_count || 0) / c.recipient_count * 100) : 0,
        clickRate: c.recipient_count > 0 ? Math.round((c.clicked_count || 0) / c.recipient_count * 100) : 0,
        conversionRate: c.recipient_count > 0 ? Math.round((c.conversion_count || 0) / c.recipient_count * 100) : 0,
        cost: parseFloat(String(c.cost)) || 0,
        sentAt: c.sent_at
      })),
      ...(smsCampaigns || []).map((c: any) => ({
        name: c.name,
        type: 'sms',
        revenue: parseFloat(String(c.revenue)) || 0,
        sent: c.recipient_count || 0,
        openRate: 0, // SMS doesn't have open rate
        clickRate: c.recipient_count > 0 ? Math.round((c.clicked_count || 0) / c.recipient_count * 100) : 0,
        conversionRate: c.recipient_count > 0 ? Math.round((c.conversion_count || 0) / c.recipient_count * 100) : 0,
        cost: parseFloat(String(c.cost)) || 0,
        sentAt: c.sent_at
      }))
    ]

    // Sort by revenue descending
    allCampaigns.sort((a, b) => b.revenue - a.revenue)

    // Generate CSV content
    const csvRows = [
      'Campaign Name,Type,Revenue,Sent,Open Rate,Click Rate,Conversion Rate,Cost,ROI,Sent Date'
    ]

    if (allCampaigns.length === 0) {
      csvRows.push('No campaigns found,N/A,0,0,0%,0%,0%,0,0%,N/A')
    } else {
      allCampaigns.forEach(campaign => {
        const roi = campaign.cost > 0 ? Math.round(((campaign.revenue - campaign.cost) / campaign.cost) * 100) : 0
        const sentDate = campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : 'Not sent'
        csvRows.push(
          `"${campaign.name}",${campaign.type.toUpperCase()},${campaign.revenue.toFixed(2)},${campaign.sent},${campaign.openRate}%,${campaign.clickRate}%,${campaign.conversionRate}%,${campaign.cost.toFixed(2)},${roi}%,${sentDate}`
        )
      })
    }

    const csvContent = csvRows.join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Failed to export analytics:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics' },
      { status: 500 }
    )
  }
}
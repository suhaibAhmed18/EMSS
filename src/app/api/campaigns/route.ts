import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'
import { requireActiveSubscription } from '@/lib/subscription/subscription-guard'
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit-middleware'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({ campaigns: [], total: 0 })
    }

    // Get campaigns from all user's stores
    const allCampaigns = []
    
    for (const store of stores) {
      try {
        // Get email campaigns
        const { campaigns: emailCampaigns } = await databaseService.getEmailCampaignsByStoreId(store.id, 100)
        const emailCampaignsWithType = emailCampaigns.map(campaign => ({
          ...campaign,
          type: 'email' as const
        }))
        
        // Get SMS campaigns
        const { campaigns: smsCampaigns } = await databaseService.getSMSCampaignsByStoreId(store.id, 100)
        const smsCampaignsWithType = smsCampaigns.map(campaign => ({
          ...campaign,
          type: 'sms' as const,
          subject: undefined, // SMS doesn't have subject
          message: campaign.message
        }))
        
        allCampaigns.push(...emailCampaignsWithType, ...smsCampaignsWithType)
      } catch (error) {
        console.error(`Failed to load campaigns for store ${store.id}:`, error)
      }
    }

    // Sort by created_at descending
    allCampaigns.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      campaigns: allCampaigns,
      total: allCampaigns.length
    })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitError = await withRateLimit(request, RATE_LIMITS.api)
  if (rateLimitError) return rateLimitError

  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check subscription status and expiry
    try {
      await requireActiveSubscription(user.id)
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Subscription required',
        needsUpgrade: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      type, 
      store_id, 
      name, 
      subject, 
      message, 
      html_content, 
      text_content, 
      from_email, 
      from_name, 
      from_number,
      status,
      send_type,
      scheduled_at
    } = body

    if (!type || !store_id || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: type, store_id, name' },
        { status: 400 }
      )
    }

    // Verify store ownership
    const stores = await databaseService.getStoresByUserId(user.id)
    const store = stores.find(s => s.id === store_id)
    if (!store) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 403 })
    }

    // Determine campaign status
    let campaignStatus = status || 'draft'
    if (send_type === 'now') {
      campaignStatus = 'sending'
    } else if (send_type === 'later' && scheduled_at) {
      campaignStatus = 'scheduled'
    }

    let campaign
    if (type === 'email') {
      if (!subject || !html_content || !from_email || !from_name) {
        return NextResponse.json(
          { error: 'Missing required fields for email campaign: subject, html_content, from_email, from_name' },
          { status: 400 }
        )
      }

      campaign = await databaseService.createEmailCampaign({
        store_id,
        name,
        subject,
        html_content,
        text_content: text_content || '',
        from_email,
        from_name,
        status: campaignStatus,
        scheduled_at: scheduled_at || null,
        recipient_count: 0,
        delivered_count: 0,
        opened_count: 0,
        clicked_count: 0
      })
    } else if (type === 'sms') {
      if (!message || !from_number) {
        return NextResponse.json(
          { error: 'Missing required fields for SMS campaign: message, from_number' },
          { status: 400 }
        )
      }

      campaign = await databaseService.createSMSCampaign({
        store_id,
        name,
        message,
        from_number,
        status: campaignStatus,
        scheduled_at: scheduled_at || null,
        recipient_count: 0,
        delivered_count: 0
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid campaign type. Must be "email" or "sms"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        type
      },
      message: 'Campaign created successfully'
    })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
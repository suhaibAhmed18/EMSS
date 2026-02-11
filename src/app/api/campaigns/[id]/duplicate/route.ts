import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Try to find the campaign in email_campaigns first
    let campaign: any = null
    let campaignType: 'email' | 'sms' = 'email'

    const { data: emailCampaign } = await databaseService.supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', id)
      .single()

    if (emailCampaign) {
      campaign = emailCampaign
      campaignType = 'email'
    } else {
      // Try SMS campaigns
      const { data: smsCampaign } = await databaseService.supabase
        .from('sms_campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (smsCampaign) {
        campaign = smsCampaign
        campaignType = 'sms'
      }
    }

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Create a copy of the campaign
    const { id: _, created_at, updated_at, sent_at, ...campaignData } = campaign
    const duplicatedCampaign = {
      ...campaignData,
      name: `${campaign.name} (Copy)`,
      status: 'draft',
      recipient_count: 0,
      delivered_count: 0,
      opened_count: 0,
      clicked_count: 0,
      sent_at: null
    }

    // Insert the duplicated campaign
    const tableName = campaignType === 'email' ? 'email_campaigns' : 'sms_campaigns'
    const { data: newCampaign, error } = await databaseService.supabase
      .from(tableName)
      .insert(duplicatedCampaign)
      .select()
      .single()

    if (error) {
      console.error('Failed to duplicate campaign:', error)
      return NextResponse.json(
        { error: 'Failed to duplicate campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign duplicated successfully',
      campaign: newCampaign ? {
        ...newCampaign,
        type: campaignType
      } : null
    })
  } catch (error) {
    console.error('Failed to duplicate campaign:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate campaign' },
      { status: 500 }
    )
  }
}
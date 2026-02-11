import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { CampaignExecutionEngine } from '@/lib/campaigns/campaign-execution-engine'
import { EmailCampaignRepository, SMSCampaignRepository } from '@/lib/database/repositories'
import { requireActiveSubscription } from '@/lib/subscription/subscription-guard'

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { campaignId, campaignType = 'email', sendNow = false } = await request.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    if (!campaignType || !['email', 'sms'].includes(campaignType)) {
      return NextResponse.json({ error: 'Invalid campaign type' }, { status: 400 })
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

    console.log(`📧 Sending ${campaignType} campaign: ${campaignId}`)

    // Initialize execution engine
    const executionEngine = new CampaignExecutionEngine()

    // Execute campaign based on type
    let result
    if (campaignType === 'email') {
      result = await executionEngine.executeEmailCampaign(campaignId)
    } else {
      result = await executionEngine.executeSMSCampaign(campaignId)
    }

    if (result.error) {
      console.error('Campaign send failed:', result.error)
      return NextResponse.json(
        { error: result.error.message || 'Failed to send campaign' },
        { status: 500 }
      )
    }

    if (!result.data) {
      return NextResponse.json(
        { error: 'Campaign execution returned no data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${campaignType === 'email' ? 'Email' : 'SMS'} campaign sent successfully`,
      campaignId: result.data.campaignId,
      recipientCount: result.data.totalRecipients,
      successfulSends: result.data.successfulSends,
      failedSends: result.data.failedSends,
      executionTime: result.data.executionTime,
      estimatedDeliveryTime: campaignType === 'email' ? '5-10 minutes' : '1-2 minutes'
    })

  } catch (error) {
    console.error('Failed to send campaign:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send campaign',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    )
  }
}
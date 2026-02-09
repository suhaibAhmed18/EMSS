import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const campaignId = id

    // Get campaign details
    let campaign
    let campaignType = 'email'
    
    try {
      // Try to get as email campaign first
      const { data: emailCampaign, error: emailError } = await databaseService.supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (emailCampaign) {
        campaign = emailCampaign
        campaignType = 'email'
      } else {
        // Try SMS campaign
        const { data: smsCampaign, error: smsError } = await databaseService.supabase
          .from('sms_campaigns')
          .select('*')
          .eq('id', campaignId)
          .single()

        if (smsCampaign) {
          campaign = smsCampaign
          campaignType = 'sms'
        } else {
          return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
        }
      }
    } catch (error) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // Verify store ownership
    const stores = await databaseService.getStoresByUserId(user.id)
    const store = stores.find(s => s.id === campaign.store_id)
    if (!store) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 403 })
    }

    // Get contacts for the store
    const { contacts } = await databaseService.getContactsByStoreId(campaign.store_id, 1000)
    
    // Filter contacts based on campaign type
    const eligibleContacts = contacts.filter(contact => {
      if (campaignType === 'email') {
        return contact.email && contact.email_consent
      } else {
        return contact.phone && contact.sms_consent
      }
    })

    if (eligibleContacts.length === 0) {
      return NextResponse.json({ 
        error: `No eligible contacts found for ${campaignType} campaign` 
      }, { status: 400 })
    }

    // Update campaign status and recipient count
    const updateTable = campaignType === 'email' ? 'email_campaigns' : 'sms_campaigns'
    const { error: updateError } = await databaseService.supabase
      .from(updateTable)
      .update({
        status: 'sending',
        recipient_count: eligibleContacts.length,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (updateError) {
      console.error('Failed to update campaign status:', updateError)
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
    }

    // TODO: Implement actual email/SMS sending
    // For now, we'll simulate sending and mark as sent
    
    // Simulate sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Update campaign to sent status
    const { error: sentError } = await databaseService.supabase
      .from(updateTable)
      .update({
        status: 'sent',
        delivered_count: eligibleContacts.length,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (sentError) {
      console.error('Failed to update campaign to sent:', sentError)
    }

    return NextResponse.json({
      message: `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} campaign sent successfully`,
      recipients: eligibleContacts.length,
      campaign_id: campaignId
    })

  } catch (error) {
    console.error('Failed to send campaign:', error)
    return NextResponse.json(
      { error: 'Failed to send campaign' },
      { status: 500 }
    )
  }
}
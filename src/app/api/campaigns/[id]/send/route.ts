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

    // Send to each contact
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const contact of eligibleContacts) {
      try {
        if (campaignType === 'email') {
          // Send email using Resend
          const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: contact.email,
              subject: campaign.subject,
              html: campaign.html_content || campaign.text_content,
              from_name: campaign.from_name || 'MarketingPro',
              from_email: campaign.from_email || process.env.EMAIL_FROM_ADDRESS
            })
          })

          if (emailResponse.ok) {
            successCount++
            // Record send
            await databaseService.supabase.from('campaign_sends').insert({
              campaign_id: campaignId,
              campaign_type: 'email',
              contact_id: contact.id,
              status: 'delivered',
              sent_at: new Date().toISOString(),
              delivered_at: new Date().toISOString()
            })
          } else {
            failCount++
            errors.push(`Failed to send to ${contact.email}`)
          }
        } else {
          // Send SMS using Telnyx
          const smsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sms/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: contact.phone,
              message: campaign.message,
              from: campaign.from_number || process.env.TELNYX_PHONE_NUMBER
            })
          })

          if (smsResponse.ok) {
            successCount++
            // Record send
            await databaseService.supabase.from('campaign_sends').insert({
              campaign_id: campaignId,
              campaign_type: 'sms',
              contact_id: contact.id,
              status: 'delivered',
              sent_at: new Date().toISOString(),
              delivered_at: new Date().toISOString()
            })
          } else {
            failCount++
            errors.push(`Failed to send to ${contact.phone}`)
          }
        }
      } catch (error) {
        failCount++
        errors.push(`Error sending to contact ${contact.id}: ${error}`)
      }
    }

    // Update campaign to sent status
    const { error: sentError } = await databaseService.supabase
      .from(updateTable)
      .update({
        status: 'sent',
        delivered_count: successCount,
        sent_at: new Date().toISOString()
      })
      .eq('id', campaignId)

    if (sentError) {
      console.error('Failed to update campaign to sent:', sentError)
    }

    return NextResponse.json({
      message: `${campaignType.charAt(0).toUpperCase() + campaignType.slice(1)} campaign sent successfully`,
      recipients: eligibleContacts.length,
      successful: successCount,
      failed: failCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
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
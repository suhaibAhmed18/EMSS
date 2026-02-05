import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get campaign type from query parameter
    const { searchParams } = new URL(request.url)
    const campaignType = searchParams.get('type') || 'email'

    // Import database service
    const { databaseService } = await import('@/lib/database/service')

    // Determine which table to query
    const tableName = campaignType === 'sms' ? 'sms_campaigns' : 'email_campaigns'
    
    // Fetch the campaign
    const { data: campaign, error } = await databaseService.supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .single()

    if (error || !campaign) {
      console.error('Campaign not found:', error)
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      campaign: {
        ...campaign,
        type: campaignType
      }
    })
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const updates = await request.json()
    const { type, ...campaignUpdates } = updates
    
    // Import database service
    const { databaseService } = await import('@/lib/database/service')

    // Determine which table to update
    const tableName = type === 'sms' ? 'sms_campaigns' : 'email_campaigns'
    
    // Update the campaign
    const { data, error } = await databaseService.supabase
      .from(tableName)
      .update({
        ...campaignUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update campaign:', error)
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: data
    })
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get campaign type from query parameter
    const { searchParams } = new URL(request.url)
    const campaignType = searchParams.get('type') || 'email'

    // Import database service
    const { databaseService } = await import('@/lib/database/service')

    // Try to delete from both tables since we don't know the type
    let deleted = false
    let error = null

    // Try email campaigns first
    try {
      const { error: emailError } = await databaseService.supabase
        .from('email_campaigns')
        .delete()
        .eq('id', id)

      if (!emailError) {
        deleted = true
      }
    } catch (e) {
      // Campaign might not be in email_campaigns
    }

    // Try SMS campaigns if not found in email
    if (!deleted) {
      try {
        const { error: smsError } = await databaseService.supabase
          .from('sms_campaigns')
          .delete()
          .eq('id', id)

        if (!smsError) {
          deleted = true
        }
      } catch (e) {
        // Campaign might not be in sms_campaigns
      }
    }

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: 'Campaign deleted successfully'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Campaign not found or already deleted'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
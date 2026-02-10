import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    
    // Get user's store IDs
    const { data: userStores } = await supabase
      .from('user_stores')
      .select('store_id')
      .eq('user_id', user.id)

    const storeIds = userStores?.map(us => us.store_id) || []

    // Get custom templates from templates table
    const { data: customTemplates, error: templatesError } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_custom', true)
      .order('updated_at', { ascending: false })

    if (templatesError && templatesError.code !== 'PGRST116') {
      console.error('Error fetching templates:', templatesError)
    }

    // Get email campaigns as templates
    const { data: emailCampaigns, error: emailError } = await supabase
      .from('email_campaigns')
      .select('id, name, subject, html_content, text_content, created_at, updated_at')
      .in('store_id', storeIds.length > 0 ? storeIds : ['00000000-0000-0000-0000-000000000000'])
      .order('updated_at', { ascending: false })

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error fetching email campaigns:', emailError)
    }

    // Get SMS campaigns as templates
    const { data: smsCampaigns, error: smsError } = await supabase
      .from('sms_campaigns')
      .select('id, name, message, created_at, updated_at')
      .in('store_id', storeIds.length > 0 ? storeIds : ['00000000-0000-0000-0000-000000000000'])
      .order('updated_at', { ascending: false })

    if (smsError && smsError.code !== 'PGRST116') {
      console.error('Error fetching SMS campaigns:', smsError)
    }

    // Transform campaigns into template format
    const emailTemplates = (emailCampaigns || []).map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: 'email',
      subject: campaign.subject,
      html: campaign.html_content,
      message: campaign.text_content,
      source: 'campaign',
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at
    }))

    const smsTemplates = (smsCampaigns || []).map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      type: 'sms',
      message: campaign.message,
      source: 'campaign',
      createdAt: campaign.created_at,
      updatedAt: campaign.updated_at
    }))

    // Combine all templates
    const allTemplates = [
      ...(customTemplates || []).map(t => ({ ...t, source: 'custom' })),
      ...emailTemplates,
      ...smsTemplates
    ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json({
      templates: allTemplates
    })
  } catch (error) {
    console.error('Failed to get templates:', error)
    return NextResponse.json(
      { error: 'Failed to load templates' },
      { status: 500 }
    )
  }
}

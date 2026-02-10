import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'email' or 'sms'

    const supabase = getSupabaseAdmin()

    // Get user's store IDs
    const { data: userStores } = await supabase
      .from('user_stores')
      .select('store_id')
      .eq('user_id', user.id)

    const storeIds = userStores?.map(us => us.store_id) || []

    if (storeIds.length === 0) {
      return NextResponse.json({ templates: [] })
    }

    // Get campaign templates
    let query = supabase
      .from('campaign_templates')
      .select('*')
      .in('store_id', storeIds)
      .order('updated_at', { ascending: false })

    if (type) {
      query = query.eq('type', type)
    }

    const { data: templates, error } = await query

    if (error) {
      console.error('Error fetching templates:', error)
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
    }

    return NextResponse.json({ templates: templates || [] })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, type, content, variables, store_id } = body

    // Validation
    if (!name || !type || !content || !store_id) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, content, store_id' },
        { status: 400 }
      )
    }

    if (!['email', 'sms'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "email" or "sms"' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify user has access to this store
    const { data: userStore } = await supabase
      .from('user_stores')
      .select('store_id')
      .eq('user_id', user.id)
      .eq('store_id', store_id)
      .single()

    if (!userStore) {
      return NextResponse.json({ error: 'Unauthorized access to store' }, { status: 403 })
    }

    // Create template
    const { data: template, error } = await supabase
      .from('campaign_templates')
      .insert({
        store_id,
        name,
        type,
        content,
        variables: variables || []
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating template:', error)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}

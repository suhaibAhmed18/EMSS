import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'
import { emailTemplates } from '@/lib/templates/email-templates'
import { smsTemplates } from '@/lib/templates/sms-templates'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'email' or 'sms'
    const category = searchParams.get('category')

    const supabase = getSupabaseAdmin()

    // Get custom templates from database
    let query = supabase
      .from('templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_custom', true)

    if (type) {
      query = query.eq('type', type)
    }

    const { data: userTemplates, error } = await query

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching templates:', error)
    }

    // Combine with built-in templates
    let builtInTemplates: any[] = []
    if (!type || type === 'email') {
      builtInTemplates = [...builtInTemplates, ...emailTemplates.map(t => ({
        ...t,
        type: 'email',
        is_custom: false
      }))]
    }
    if (!type || type === 'sms') {
      builtInTemplates = [...builtInTemplates, ...smsTemplates.map(t => ({
        ...t,
        type: 'sms',
        is_custom: false
      }))]
    }

    // Filter by category if specified
    if (category) {
      builtInTemplates = builtInTemplates.filter(t => t.category === category)
    }

    const allTemplates = [...builtInTemplates, ...(userTemplates || [])]

    return NextResponse.json({ templates: allTemplates })
  } catch (error) {
    console.error('Failed to fetch templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      description,
      type,
      category,
      subject,
      preheader,
      message,
      html,
      variables
    } = body

    if (!name || !type || !category) {
      return NextResponse.json(
        { error: 'Name, type, and category are required' },
        { status: 400 }
      )
    }

    const templateId = `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const template = {
      id: templateId,
      user_id: user.id,
      name,
      description: description || null,
      type,
      category,
      subject: subject || null,
      preheader: preheader || null,
      message: message || null,
      html: html || null,
      variables: variables || [],
      is_custom: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Save to database
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('templates')
      .insert(template)
      .select()
      .single()

    if (error) {
      console.error('Error saving template:', error)
      return NextResponse.json(
        { error: 'Failed to save template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ template: data }, { status: 201 })
  } catch (error) {
    console.error('Failed to create template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}

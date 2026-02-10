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
    
    // Get user domains (you'll need to create a domains table)
    const { data: domains, error } = await supabase
      .from('email_domains')
      .select('*')
      .eq('user_id', user.id)

    if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
      console.error('Error fetching domains:', error)
    }

    return NextResponse.json({
      domains: domains || []
    })
  } catch (error) {
    console.error('Failed to get domains:', error)
    return NextResponse.json(
      { error: 'Failed to load domains' },
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

    const { domain, type } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('email_domains')
      .insert({
        user_id: user.id,
        domain,
        type: type || 'email',
        verified: false,
        auto_warmup: false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ domain: data })
  } catch (error) {
    console.error('Failed to add domain:', error)
    return NextResponse.json(
      { error: 'Failed to add domain' },
      { status: 500 }
    )
  }
}

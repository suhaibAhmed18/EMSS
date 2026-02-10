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
    
    // Get user email addresses
    const { data: emailAddresses, error } = await supabase
      .from('sender_email_addresses')
      .select('*')
      .eq('user_id', user.id)

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching email addresses:', error)
    }

    // Always include the shared Sendra email
    const addresses = [
      {
        id: 'shared',
        email: 'Shared Sendra Email',
        status: 'Verified',
        verifiedOn: null,
        isShared: true
      },
      ...(emailAddresses || [])
    ]

    return NextResponse.json({
      emailAddresses: addresses
    })
  } catch (error) {
    console.error('Failed to get email addresses:', error)
    return NextResponse.json(
      { error: 'Failed to load email addresses' },
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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('sender_email_addresses')
      .insert({
        user_id: user.id,
        email,
        status: 'Pending',
        verified_on: null,
        is_shared: false
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // TODO: Send verification email

    return NextResponse.json({ emailAddress: data })
  } catch (error) {
    console.error('Failed to add email address:', error)
    return NextResponse.json(
      { error: 'Failed to add email address' },
      { status: 500 }
    )
  }
}

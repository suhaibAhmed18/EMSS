import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user data from database
    const supabase = getSupabaseAdmin()
    const { data: userData, error } = await supabase
      .from('users')
      .select('first_name, last_name, email, telnyx_phone_number')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Failed to fetch user settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    return NextResponse.json({
      settings: {
        firstName: userData.first_name || '',
        lastName: userData.last_name || '',
        email: userData.email || '',
        phone: userData.telnyx_phone_number || ''
      }
    })

  } catch (error) {
    console.error('Settings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { settings } = await request.json()

    // Note: Profile information (first_name, last_name, email) is set during registration
    // and cannot be modified through settings. Only phone number can be updated.
    
    const supabase = getSupabaseAdmin()
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only allow updating phone number
    if (settings.phone !== undefined) {
      updateData.telnyx_phone_number = settings.phone
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      console.error('Failed to update settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Settings updated successfully' 
    })

  } catch (error) {
    console.error('Settings update error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}

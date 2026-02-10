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
    
    // Get user data with subscription plan
    const { data: userData, error } = await supabase
      .from('users')
      .select('telnyx_phone_number, subscription_plan')
      .eq('id', user.id)
      .single()

    if (error) {
      throw error
    }

    // Get the subscription plan details to fetch daily SMS limit
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('features')
      .eq('name', userData.subscription_plan || 'Starter')
      .single()

    // Extract daily SMS limit from plan features
    const dailyLimit = planData?.features?.daily_sms_limit || 100

    // Get SMS settings from a settings table (you may need to create this)
    const { data: smsSettings } = await supabase
      .from('sms_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      settings: {
        phoneNumber: userData.telnyx_phone_number || '',
        keyword: smsSettings?.keyword || 'JOIN',
        senderName: smsSettings?.sender_name || 'TESTINGAPP',
        quietHoursEnabled: smsSettings?.quiet_hours_enabled || false,
        quietHoursStart: smsSettings?.quiet_hours_start || '00:00',
        quietHoursEnd: smsSettings?.quiet_hours_end || '00:00',
        dailyLimit: dailyLimit, // Now comes from subscription plan
        timezone: smsSettings?.timezone || 'America/New_York'
      }
    })
  } catch (error) {
    console.error('Failed to get SMS settings:', error)
    return NextResponse.json(
      { error: 'Failed to load SMS settings' },
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

    const { settings } = await request.json()

    const supabase = getSupabaseAdmin()
    
    // Upsert SMS settings (daily_limit is NOT saved - it comes from subscription plan)
    const { error } = await supabase
      .from('sms_settings')
      .upsert({
        user_id: user.id,
        keyword: settings.keyword,
        sender_name: settings.senderName,
        quiet_hours_enabled: settings.quietHoursEnabled,
        quiet_hours_start: settings.quietHoursStart,
        quiet_hours_end: settings.quietHoursEnd,
        timezone: settings.timezone,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save SMS settings:', error)
    return NextResponse.json(
      { error: 'Failed to save SMS settings' },
      { status: 500 }
    )
  }
}

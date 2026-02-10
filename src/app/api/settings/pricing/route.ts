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
    
    // Get user subscription data
    const { data: userData, error } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date')
      .eq('id', user.id)
      .single()

    if (error) {
      throw error
    }

    // Get subscription plan details to fetch limits
    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('features')
      .eq('name', userData.subscription_plan || 'Starter')
      .single()

    const planFeatures = planData?.features || {}
    const emailLimit = planFeatures.email_credits || 5000
    const smsCredits = planFeatures.sms_credits || 500

    // Get actual email usage for current billing cycle
    const billingStart = userData.subscription_start_date || new Date(new Date().setDate(1)).toISOString()
    const billingEnd = userData.subscription_end_date || new Date(new Date().setMonth(new Date().getMonth() + 1, 0)).toISOString()

    const { data: emailUsageData } = await supabase
      .from('email_usage')
      .select('emails_sent')
      .eq('user_id', user.id)
      .gte('sent_at', billingStart)
      .lte('sent_at', billingEnd)

    const totalEmailsSent = emailUsageData?.reduce((sum, record) => sum + (record.emails_sent || 0), 0) || 0

    // Get actual SMS usage for current billing cycle
    const { data: smsUsageData } = await supabase
      .from('sms_usage')
      .select('sms_sent, cost')
      .eq('user_id', user.id)
      .gte('sent_at', billingStart)
      .lte('sent_at', billingEnd)

    const totalSmsSent = smsUsageData?.reduce((sum, record) => sum + (record.sms_sent || 0), 0) || 0
    const totalSmsCost = smsUsageData?.reduce((sum, record) => sum + (parseFloat(record.cost?.toString() || '0')), 0) || 0

    const usageData = {
      emailsSent: totalEmailsSent,
      emailsLimit: emailLimit,
      smsCredits: smsCredits,
      smsUsed: totalSmsSent,
      smsCost: totalSmsCost,
      billingCycle: {
        start: billingStart,
        end: billingEnd
      }
    }

    return NextResponse.json({
      plan: userData.subscription_plan || 'Free',
      status: userData.subscription_status || 'active',
      usage: usageData
    })
  } catch (error) {
    console.error('Failed to get pricing data:', error)
    return NextResponse.json(
      { error: 'Failed to load pricing data' },
      { status: 500 }
    )
  }
}

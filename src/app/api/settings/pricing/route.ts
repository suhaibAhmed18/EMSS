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
      .select('subscription_plan, subscription_status, subscription_start_date, subscription_end_date, subscription_expires_at')
      .eq('id', user.id)
      .single()

    if (error) {
      throw error
    }

    // Check if subscription is expired
    const isExpired = userData.subscription_expires_at 
      ? new Date(userData.subscription_expires_at) < new Date()
      : false

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
    
    // Calculate billing end date
    let billingEnd: string
    if (userData.subscription_end_date) {
      billingEnd = userData.subscription_end_date
    } else if (userData.subscription_start_date) {
      // If we have a start date but no end date, calculate 1 month from start
      const startDate = new Date(userData.subscription_start_date)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      billingEnd = endDate.toISOString()
    } else {
      // Fallback to end of current month
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      billingEnd = endOfMonth.toISOString()
    }

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
      expiresAt: userData.subscription_expires_at,
      isExpired: isExpired,
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

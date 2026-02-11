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
    const diagnostics: any = {
      userId: user.id,
      checks: {}
    }

    // Check 1: User subscription data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status, subscription_expires_at')
      .eq('id', user.id)
      .single()

    diagnostics.checks.userData = {
      success: !userError,
      data: userData,
      error: userError?.message
    }

    // Check 2: Subscription plans exist
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name, price, features')
      .eq('is_active', true)

    diagnostics.checks.plans = {
      success: !plansError,
      count: plans?.length || 0,
      plans: plans,
      error: plansError?.message
    }

    // Check 3: RPC function exists
    try {
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_available_upgrades', { p_user_id: user.id })

      diagnostics.checks.rpcFunction = {
        success: !rpcError,
        data: rpcData,
        error: rpcError?.message
      }
    } catch (rpcErr) {
      diagnostics.checks.rpcFunction = {
        success: false,
        error: rpcErr instanceof Error ? rpcErr.message : 'Unknown error'
      }
    }

    // Check 4: Environment variables
    diagnostics.checks.environment = {
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      hasStripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }

    // Summary
    diagnostics.summary = {
      allChecksPass: 
        diagnostics.checks.userData.success &&
        diagnostics.checks.plans.success &&
        diagnostics.checks.plans.count > 0 &&
        diagnostics.checks.environment.hasStripeKey &&
        diagnostics.checks.environment.hasStripePublishableKey,
      issues: []
    }

    if (!diagnostics.checks.userData.success) {
      diagnostics.summary.issues.push('User data not found')
    }
    if (!diagnostics.checks.plans.success || diagnostics.checks.plans.count === 0) {
      diagnostics.summary.issues.push('No subscription plans found - run scripts/ensure-subscription-plans.sql')
    }
    if (!diagnostics.checks.rpcFunction.success) {
      diagnostics.summary.issues.push('RPC function not available - run scripts/create-upgrade-function.sql (fallback will be used)')
    }
    if (!diagnostics.checks.environment.hasStripeKey) {
      diagnostics.summary.issues.push('Missing STRIPE_SECRET_KEY')
    }
    if (!diagnostics.checks.environment.hasStripePublishableKey) {
      diagnostics.summary.issues.push('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')
    }

    return NextResponse.json(diagnostics)
  } catch (error) {
    console.error('Diagnostic error:', error)
    return NextResponse.json(
      { 
        error: 'Diagnostic failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

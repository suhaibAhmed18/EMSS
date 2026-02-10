import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Test endpoint to diagnose upgrade issues
 * Access at: /api/test-upgrade
 */
export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {}
  }

  try {
    // 1. Check environment variables
    diagnostics.checks.env = {
      hasStripePublicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
      appUrl: process.env.NEXT_PUBLIC_APP_URL
    }

    // 2. Check Supabase connection
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      
      diagnostics.checks.supabase = {
        connected: true,
        authenticated: !!user,
        userId: user?.id,
        error: error?.message
      }

      if (user) {
        // 3. Check user data
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email, subscription_plan')
          .eq('id', user.id)
          .single()

        diagnostics.checks.userData = {
          found: !!userData,
          email: userData?.email,
          currentPlan: userData?.subscription_plan,
          error: userError?.message
        }

        // 4. Check subscription plans
        const { data: plans, error: plansError } = await supabase
          .from('subscription_plans')
          .select('id, name, price, is_active')
          .eq('is_active', true)

        diagnostics.checks.plans = {
          count: plans?.length || 0,
          plans: plans?.map(p => ({ name: p.name, price: p.price })),
          error: plansError?.message
        }

        // 5. Check if get_available_upgrades function exists
        const { data: functionCheck, error: funcError } = await supabase
          .rpc('get_available_upgrades', { p_user_id: user.id })

        diagnostics.checks.upgradeFunction = {
          exists: !funcError,
          availablePlans: functionCheck?.length || 0,
          error: funcError?.message
        }
      }
    } catch (error) {
      diagnostics.checks.supabase = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // 6. Check Stripe
    try {
      const Stripe = require('stripe')
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
      
      // Try to list customers (just to verify connection)
      await stripe.customers.list({ limit: 1 })
      
      diagnostics.checks.stripe = {
        connected: true,
        apiVersion: stripe.VERSION
      }
    } catch (error) {
      diagnostics.checks.stripe = {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    diagnostics.status = 'completed'
    diagnostics.summary = generateSummary(diagnostics.checks)

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error) {
    diagnostics.status = 'failed'
    diagnostics.error = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(diagnostics, { status: 500 })
  }
}

function generateSummary(checks: any): string[] {
  const issues: string[] = []

  if (!checks.env?.hasStripeSecretKey) {
    issues.push('❌ STRIPE_SECRET_KEY not set')
  }
  if (!checks.env?.hasStripePublicKey) {
    issues.push('❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not set')
  }
  if (!checks.supabase?.connected) {
    issues.push('❌ Cannot connect to Supabase')
  }
  if (!checks.supabase?.authenticated) {
    issues.push('⚠️  User not authenticated (login required)')
  }
  if (!checks.userData?.found) {
    issues.push('❌ User data not found in database')
  }
  if (checks.plans?.count === 0) {
    issues.push('❌ No subscription plans found in database')
  }
  if (!checks.upgradeFunction?.exists) {
    issues.push('❌ get_available_upgrades function not found')
  }
  if (!checks.stripe?.connected) {
    issues.push('❌ Cannot connect to Stripe API')
  }

  if (issues.length === 0) {
    issues.push('✅ All checks passed! Upgrade should work.')
  }

  return issues
}

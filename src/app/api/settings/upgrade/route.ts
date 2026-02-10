import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia'
})

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { plan } = await request.json()

    if (!plan || !['starter', 'professional', 'enterprise'].includes(plan.toLowerCase())) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_plan')
      .eq('id', user.id)
      .single()

    if (userError) {
      throw userError
    }

    // Check if user is trying to upgrade to the same plan
    if (userData.subscription_plan?.toLowerCase() === plan.toLowerCase()) {
      return NextResponse.json({ 
        error: 'You are already on this plan' 
      }, { status: 400 })
    }

    // Plan pricing (monthly)
    const planPrices: Record<string, { priceId: string, amount: number }> = {
      starter: { priceId: 'price_starter', amount: 0 },
      professional: { priceId: 'price_professional', amount: 4900 }, // $49
      enterprise: { priceId: 'price_enterprise', amount: 9900 } // $99
    }

    const selectedPlan = planPrices[plan.toLowerCase()]

    // Create Stripe checkout session for upgrade
    const session = await stripe.checkout.sessions.create({
      customer: userData.stripe_customer_id || undefined,
      customer_email: !userData.stripe_customer_id ? user.email : undefined,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `Upgrade to ${plan} plan`,
            },
            unit_amount: selectedPlan.amount,
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true&plan=${plan}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgrade=cancelled`,
      metadata: {
        userId: user.id,
        plan: plan,
        upgradeFrom: userData.subscription_plan || 'free',
      },
    })

    // Store checkout session in database
    await supabase
      .from('payment_checkout_sessions')
      .insert({
        user_id: user.id,
        session_id: session.id,
        plan: plan,
        amount: selectedPlan.amount,
        status: 'pending',
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Failed to create upgrade session:', error)
    return NextResponse.json(
      { error: 'Failed to process upgrade' },
      { status: 500 }
    )
  }
}

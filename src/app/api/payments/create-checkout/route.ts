import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/database/client'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { userId, email, plan, amount } = await request.json()

    if (!userId || !email || !plan || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Create or get existing checkout session in database
    const { data: dbSession, error: dbError } = await supabase
      .rpc('get_or_create_checkout_session', {
        p_user_id: userId,
        p_email: email,
        p_plan: plan,
        p_price: amount,
        p_provider: 'stripe'
      })

    if (dbError) {
      console.error('Failed to create checkout session in database:', dbError)
      // Continue anyway - don't block payment
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment-success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email)}`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/payment?email=${encodeURIComponent(email)}&plan=${plan}&userId=${userId}&cancelled=true`

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
              description: `MarketingPro ${plan} subscription`,
            },
            unit_amount: amount * 100, // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: email,
      metadata: {
        userId,
        plan,
        checkoutSessionId: dbSession || 'unknown',
      },
      subscription_data: {
        metadata: {
          userId,
          plan,
        },
      },
    })

    // Update database session with Stripe session ID
    if (dbSession) {
      await supabase
        .from('payment_checkout_sessions')
        .update({
          stripe_session_id: session.id,
          success_url: successUrl,
          cancel_url: cancelUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbSession)
    }

    console.log(`✅ Checkout session created: ${session.id} for user ${userId}`)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

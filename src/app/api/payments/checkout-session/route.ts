import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/database/client'

/**
 * GET /api/payments/checkout-session
 * Retrieve checkout session information for a user
 * 
 * Query params:
 * - userId: User ID to get session for
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get user's latest checkout session
    const { data: session, error } = await supabase
      .rpc('get_latest_checkout_session', { p_user_id: userId })
      .single()

    if (error) {
      console.error('Failed to get checkout session:', error)
      return NextResponse.json(
        { error: 'Failed to retrieve checkout session' },
        { status: 500 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No checkout session found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      session: {
        id: session.session_id,
        email: session.email,
        plan: session.plan,
        price: session.price,
        status: session.status,
        provider: session.provider,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
      },
    })
  } catch (error) {
    console.error('Checkout session retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/payments/checkout-session
 * Create or update a checkout session
 * 
 * Body:
 * - userId: User ID
 * - email: User email
 * - plan: Subscription plan
 * - price: Plan price
 * - provider: Payment provider (stripe/paypal)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, email, plan, price, provider = 'stripe' } = await request.json()

    if (!userId || !email || !plan || !price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Create or get existing checkout session
    const { data: sessionId, error } = await supabase
      .rpc('get_or_create_checkout_session', {
        p_user_id: userId,
        p_email: email,
        p_plan: plan,
        p_price: price,
        p_provider: provider,
      })

    if (error) {
      console.error('Failed to create checkout session:', error)
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      sessionId,
      message: 'Checkout session created successfully',
    })
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/payments/checkout-session
 * Update checkout session status
 * 
 * Body:
 * - sessionId: Checkout session ID
 * - status: New status (completed, cancelled, failed)
 * - stripeSessionId: Stripe session ID (optional)
 * - stripeCustomerId: Stripe customer ID (optional)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, status, stripeSessionId, stripeCustomerId } = await request.json()

    if (!sessionId || !status) {
      return NextResponse.json(
        { error: 'Session ID and status are required' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    if (status === 'completed') {
      // Use the complete_checkout_session function
      const { data, error } = await supabase
        .rpc('complete_checkout_session', {
          p_session_id: sessionId,
          p_stripe_session_id: stripeSessionId || null,
          p_stripe_customer_id: stripeCustomerId || null,
          p_paypal_order_id: null,
        })

      if (error) {
        console.error('Failed to complete checkout session:', error)
        return NextResponse.json(
          { error: 'Failed to update checkout session' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: data,
        message: 'Checkout session completed',
      })
    } else {
      // Update status directly
      const { error } = await supabase
        .from('payment_checkout_sessions')
        .update({
          status,
          updated_at: new Date().toISOString(),
          ...(status === 'cancelled' && { cancelled_at: new Date().toISOString() }),
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Failed to update checkout session:', error)
        return NextResponse.json(
          { error: 'Failed to update checkout session' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Checkout session updated',
      })
    }
  } catch (error) {
    console.error('Checkout session update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

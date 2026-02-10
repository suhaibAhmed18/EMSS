import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/payments/stripe'

export async function POST(request: NextRequest) {
  try {
    console.log('Upgrade API called');
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('User authenticated:', user.id);

    const body = await request.json()
    const { planName, planPrice } = body

    console.log('Upgrade request:', { planName, planPrice });

    if (!planName || !planPrice) {
      return NextResponse.json(
        { error: 'Plan name and price are required' },
        { status: 400 }
      )
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, name, subscription_plan')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('User data error:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    console.log('User data:', userData);

    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .single()

    if (planError || !plan) {
      console.error('Plan error:', planError);
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    console.log('Plan found:', plan);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe checkout session for upgrade
    console.log('Creating Stripe session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planName} Plan`,
              description: `Upgrade to ${planName} plan`,
            },
            unit_amount: Math.round(parseFloat(planPrice) * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/settings?upgraded=true&plan=${planName}`,
      cancel_url: `${baseUrl}/settings`,
      customer_email: userData.email,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planId: plan.id,
        planName: planName,
        isUpgrade: 'true',
        previousPlan: userData.subscription_plan || 'starter',
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: plan.id,
          isUpgrade: 'true',
        },
      },
    })

    console.log('Stripe session created:', session.id);

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('Error creating upgrade checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

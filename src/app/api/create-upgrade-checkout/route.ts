import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

export async function POST(request: NextRequest) {
  try {
    const { userId, planName, planPrice } = await request.json();

    if (!userId || !planName || !planPrice) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    );

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id, subscription_expiry_date')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate upgrade cost with prorated credit
    const { data: upgradeCalc, error: calcError } = await supabase.rpc(
      'calculate_upgrade_cost',
      {
        p_user_id: userId,
        p_new_plan_name: planName
      }
    );

    if (calcError) {
      console.error('Error calculating upgrade cost:', calcError);
      return NextResponse.json(
        { error: 'Failed to calculate upgrade cost' },
        { status: 500 }
      );
    }

    const upgradeCost = upgradeCalc[0]?.upgrade_cost || planPrice;

    // Create or get Stripe customer
    let customerId = user.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create Stripe Checkout Session for upgrade
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Upgrade to ${planName} Plan`,
              description: `Monthly subscription - ${planName} plan with all features`,
            },
            unit_amount: Math.round(upgradeCost * 100), // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=success&plan=${planName}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgrade=cancelled`,
      metadata: {
        userId,
        planName,
        type: 'upgrade',
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating upgrade checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

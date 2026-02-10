import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.metadata?.type === 'upgrade') {
          await handleUpgradeSuccess(session);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        
        // Handle recurring payment (monthly renewal)
        if (invoice.subscription && invoice.metadata?.userId) {
          await handleRecurringPayment(invoice);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancellation(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleUpgradeSuccess(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planName = session.metadata?.planName;
  const subscriptionId = session.subscription as string;

  if (!userId || !planName) {
    console.error('Missing metadata in checkout session');
    return;
  }

  console.log(`Processing upgrade for user ${userId} to ${planName}`);

  // Upgrade the subscription in database
  const { data, error } = await supabase.rpc('upgrade_subscription', {
    p_user_id: userId,
    p_new_plan_name: planName,
    p_payment_id: session.payment_intent as string
  });

  if (error) {
    console.error('Error upgrading subscription:', error);
    return;
  }

  // Update Stripe subscription ID
  await supabase
    .from('users')
    .update({ 
      stripe_subscription_id: subscriptionId,
      payment_id: session.payment_intent as string
    })
    .eq('id', userId);

  console.log(`Successfully upgraded user ${userId} to ${planName}`);
  console.log('Upgrade result:', data);

  // TODO: Send upgrade confirmation email
  // await sendUpgradeConfirmationEmail(userId, planName, data[0]);
}

async function handleRecurringPayment(invoice: Stripe.Invoice) {
  const userId = invoice.metadata?.userId;
  const planName = invoice.metadata?.planName;

  if (!userId) {
    console.error('Missing userId in invoice metadata');
    return;
  }

  console.log(`Processing recurring payment for user ${userId}`);

  // Extend subscription by 1 month
  const { data, error } = await supabase.rpc('extend_subscription', {
    p_user_id: userId,
    p_plan_name: planName
  });

  if (error) {
    console.error('Error extending subscription:', error);
    return;
  }

  // Update payment info
  await supabase
    .from('users')
    .update({ 
      payment_id: invoice.payment_intent as string,
      last_payment_date: new Date().toISOString()
    })
    .eq('id', userId);

  console.log(`Successfully extended subscription for user ${userId}`);

  // TODO: Send payment confirmation email
  // await sendPaymentConfirmationEmail(userId, data[0]);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  console.log(`Subscription updated for user ${userId}`);

  // Update subscription status
  const status = subscription.status === 'active' ? 'active' : 
                 subscription.status === 'canceled' ? 'cancelled' : 
                 subscription.status;

  await supabase
    .from('users')
    .update({ 
      subscription_status: status,
      stripe_subscription_id: subscription.id
    })
    .eq('id', userId);
}

async function handleSubscriptionCancellation(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  console.log(`Subscription cancelled for user ${userId}`);

  // Cancel subscription in database
  const { error } = await supabase.rpc('cancel_subscription', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error cancelling subscription:', error);
    return;
  }

  console.log(`Successfully cancelled subscription for user ${userId}`);

  // TODO: Send cancellation confirmation email
  // await sendCancellationEmail(userId);
}

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/payments/stripe'
import { createClient } from '@/lib/supabase/server'
import { searchAvailableNumbers, purchasePhoneNumber } from '@/lib/payments/telnyx'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const planId = session.metadata?.planId

        if (!userId) {
          console.error('No userId in session metadata')
          break
        }

        // Calculate subscription end date (1 month from now)
        const startDate = new Date()
        const endDate = new Date(startDate)
        endDate.setMonth(endDate.getMonth() + 1)
        
        // Update user subscription status
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_plan: session.metadata?.planName || 'unknown',
            subscription_start_date: startDate.toISOString(),
            subscription_end_date: endDate.toISOString(),
            stripe_customer_id: session.customer as string,
            payment_method: 'stripe',
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Error updating user subscription:', updateError)
          break
        }

        // Record payment
        await supabase.from('payments').insert({
          user_id: userId,
          amount: (session.amount_total || 0) / 100,
          currency: session.currency || 'usd',
          payment_method: 'card',
          payment_provider: 'stripe',
          transaction_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          status: 'completed',
          metadata: { planId },
        })

        // Provision Telnyx number
        try {
          const availableNumbers = await searchAvailableNumbers()
          if (availableNumbers.length > 0) {
            const selectedNumber = availableNumbers[0]
            const purchasedNumber = await purchasePhoneNumber(selectedNumber.phone_number)

            // Store in database
            await supabase.from('telnyx_numbers').insert({
              user_id: userId,
              phone_number: selectedNumber.phone_number,
              telnyx_number_id: purchasedNumber.id,
              status: 'active',
            })

            // Update user with phone number
            await supabase
              .from('users')
              .update({
                telnyx_phone_number: selectedNumber.phone_number,
                telnyx_phone_number_id: purchasedNumber.id,
              })
              .eq('id', userId)
          }
        } catch (telnyxError) {
          console.error('Error provisioning Telnyx number:', telnyxError)
          // Don't fail the webhook if Telnyx provisioning fails
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        const status = subscription.status === 'active' ? 'active' : 'inactive'

        await supabase
          .from('users')
          .update({
            subscription_status: status,
            subscription_end_date: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        await supabase
          .from('users')
          .update({
            subscription_status: 'cancelled',
            subscription_end_date: new Date().toISOString(),
          })
          .eq('id', userId)

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

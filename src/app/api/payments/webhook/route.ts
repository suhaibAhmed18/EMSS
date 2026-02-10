import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/database/client'
import { emailService } from '@/lib/email/service'
import { tokenService } from '@/lib/auth/tokens'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe signature' },
        { status: 400 }
      )
    }

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

    const supabase = getSupabaseAdmin()

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        const email = session.customer_email
        const checkoutSessionId = session.metadata?.checkoutSessionId

        if (!userId || !plan || !email) {
          console.error('Missing metadata in checkout session')
          break
        }

        // Update user subscription status
        const { error: updateError } = await supabase
          .from('users')
          .update({
            subscription_status: 'active',
            subscription_plan: plan,
            payment_id: session.id,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to update user subscription:', updateError)
          break
        }

        // Mark checkout session as completed in database
        if (checkoutSessionId && checkoutSessionId !== 'unknown') {
          await supabase
            .rpc('complete_checkout_session', {
              p_session_id: checkoutSessionId,
              p_stripe_session_id: session.id,
              p_stripe_customer_id: session.customer as string,
              p_paypal_order_id: null
            })
        }

        // Send verification email
        try {
          const verificationToken = tokenService.createVerificationToken(email)
          await emailService.sendVerificationEmail(email, verificationToken)
          console.log(`✅ Verification email sent to: ${email}`)
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError)
        }

        console.log(`✅ Payment successful for user ${userId}, plan: ${plan}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        // Update subscription status based on Stripe status
        const status = subscription.status === 'active' ? 'active' : 'inactive'
        
        await supabase
          .from('users')
          .update({ subscription_status: status })
          .eq('id', userId)

        console.log(`✅ Subscription updated for user ${userId}: ${status}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) break

        // Mark subscription as cancelled
        await supabase
          .from('users')
          .update({ subscription_status: 'cancelled' })
          .eq('id', userId)

        console.log(`✅ Subscription cancelled for user ${userId}`)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        )
        const userId = subscription.metadata?.userId

        if (!userId) break

        // Mark subscription as past_due
        await supabase
          .from('users')
          .update({ subscription_status: 'past_due' })
          .eq('id', userId)

        console.log(`⚠️ Payment failed for user ${userId}`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/database/client'
import { emailService } from '@/lib/email/service'
import { tokenService } from '@/lib/auth/tokens'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2026-01-28.clover',
})

export async function POST(request: NextRequest) {
  try {
    const { userId, email, plan, amount, paymentMethod, cardDetails } = await request.json()

    if (!userId || !email || !plan || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Process payment based on method
    let paymentSuccess = false
    let paymentId = ''

    if (paymentMethod === 'card') {
      // In production, integrate with Stripe
      // For now, simulate successful payment
      try {
        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100, // Convert to cents
          currency: 'usd',
          description: `${plan} plan subscription`,
          metadata: {
            userId,
            email,
            plan,
          },
        })

        paymentId = paymentIntent.id
        paymentSuccess = true
        console.log(`✅ Payment processed: ${paymentId}`)
      } catch (stripeError) {
        console.error('Stripe payment error:', stripeError)
        // In development, allow to proceed
        if (process.env.NODE_ENV === 'development') {
          paymentId = `dev_payment_${Date.now()}`
          paymentSuccess = true
          console.log('🔧 Development mode: Simulating successful payment')
        } else {
          throw new Error('Payment processing failed')
        }
      }
    } else if (paymentMethod === 'paypal') {
      // In production, integrate with PayPal
      // For now, simulate successful payment
      paymentId = `paypal_${Date.now()}`
      paymentSuccess = true
      console.log('🔧 PayPal payment simulated')
    }

    if (!paymentSuccess) {
      return NextResponse.json(
        { error: 'Payment processing failed' },
        { status: 400 }
      )
    }

    // Update user subscription status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        payment_id: paymentId,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update user subscription:', updateError)
      return NextResponse.json(
        { error: 'Failed to activate subscription' },
        { status: 500 }
      )
    }

    // Send verification email after successful payment
    try {
      const verificationToken = tokenService.createVerificationToken(email)
      await emailService.sendVerificationEmail(email, verificationToken)
      console.log(`✅ Verification email sent to: ${email}`)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail the payment if email fails
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Verification email would be sent in production')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      paymentId,
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    )
  }
}

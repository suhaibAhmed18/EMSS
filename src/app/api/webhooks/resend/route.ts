// Resend webhook handler for email delivery tracking
import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Verify webhook signature (if configured)
    const signature = request.headers.get('resend-signature')
    if (signature) {
      // TODO: Implement signature verification when Resend supports it
      // For now, we'll process all webhook events
    }

    // Process the webhook event
    await emailService.processWebhookEvent(body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
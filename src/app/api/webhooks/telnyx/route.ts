// Telnyx webhook handler for SMS delivery status and incoming messages
import { NextRequest, NextResponse } from 'next/server'
import { smsService } from '@/lib/sms'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('telnyx-signature-ed25519')
    const timestamp = request.headers.get('telnyx-timestamp')

    // Verify webhook signature (basic implementation)
    // In production, you should implement proper signature verification
    if (!signature || !timestamp) {
      console.warn('Missing Telnyx webhook signature or timestamp')
    }

    const event = JSON.parse(body)
    
    // Log the event for debugging
    console.log('Telnyx webhook event:', {
      type: event.event_type,
      id: event.data?.payload?.id,
      timestamp: event.occurred_at
    })

    // Process the webhook event
    await smsService.processWebhookEvent(event)

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Telnyx webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const challenge = searchParams.get('webhook_challenge')
  
  if (challenge) {
    return NextResponse.json({ webhook_challenge: challenge })
  }
  
  return NextResponse.json({ status: 'Telnyx webhook endpoint active' })
}
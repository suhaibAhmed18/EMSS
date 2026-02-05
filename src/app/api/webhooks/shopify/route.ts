// Shopify webhook endpoint
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { config } from '@/lib/config'
import { webhookProcessor } from '@/lib/shopify/webhook-processor'

/**
 * Verify Shopify webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', config.shopify.webhookSecret)
  hmac.update(body, 'utf8')
  const calculatedSignature = hmac.digest('base64')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'base64'),
    Buffer.from(calculatedSignature, 'base64')
  )
}

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text()
    
    // Get headers
    const signature = request.headers.get('X-Shopify-Hmac-Sha256')
    const topic = request.headers.get('X-Shopify-Topic')
    const shopDomain = request.headers.get('X-Shopify-Shop-Domain')
    
    if (!signature || !topic || !shopDomain) {
      console.error('Missing required webhook headers')
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse the JSON payload
    let payload: Record<string, unknown>
    try {
      payload = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON payload:', error)
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Process the webhook based on topic
    try {
      await webhookProcessor.processWebhook({
        topic,
        shopDomain,
        payload,
        headers: {
          signature,
          topic,
          shopDomain,
          timestamp: request.headers.get('X-Shopify-Webhook-Id') || '',
        },
      })

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error(`Failed to process webhook ${topic} from ${shopDomain}:`, error)
      
      // Return 200 to prevent Shopify from retrying if it's a processing error
      // but log the error for investigation
      return NextResponse.json(
        { error: 'Processing failed', topic, shopDomain },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error('Webhook endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  })
}
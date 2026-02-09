// API route for handling SMS opt-out requests
import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeHandler } from '@/lib/compliance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fromNumber, toNumber, message, timestamp } = body

    if (!fromNumber || !toNumber || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Check if this is a STOP request
    if (!unsubscribeHandler.isSMSStopRequest(message)) {
      return NextResponse.json(
        { message: 'Not a STOP request' },
        { status: 200 }
      )
    }

    const result = await unsubscribeHandler.processSMSOptOut({
      fromNumber,
      toNumber,
      message,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    })

    if (result.error) {
      console.error('SMS opt-out processing error:', result.error)
      return NextResponse.json(
        { error: 'Failed to process opt-out request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: result.data?.success,
      message: result.data?.message,
      shouldReply: result.data?.success // Indicate if SMS service should send confirmation
    })

  } catch (error) {
    console.error('SMS opt-out API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
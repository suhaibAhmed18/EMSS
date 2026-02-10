import { NextRequest, NextResponse } from 'next/server'
import Telnyx from 'telnyx'

const telnyx = new Telnyx(process.env.TELNYX_API_KEY || '')

export async function POST(request: NextRequest) {
  try {
    const { to, message, from } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.TELNYX_API_KEY) {
      console.error('TELNYX_API_KEY not configured')
      return NextResponse.json({ error: 'SMS service not configured' }, { status: 500 })
    }

    const fromNumber = from || process.env.TELNYX_PHONE_NUMBER

    if (!fromNumber) {
      return NextResponse.json({ error: 'From number not configured' }, { status: 500 })
    }

    const response = await telnyx.messages.create({
      from: fromNumber,
      to: to,
      text: message
    })

    return NextResponse.json({ 
      success: true, 
      messageId: response.data.id 
    })

  } catch (error: any) {
    console.error('SMS send error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send SMS' },
      { status: 500 }
    )
  }
}

// API route for handling email unsubscribe requests
import { NextRequest, NextResponse } from 'next/server'
import { unsubscribeHandler } from '@/lib/compliance'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const type = searchParams.get('type') as 'email' | 'sms'
    const email = searchParams.get('email')

    if (!token && !email) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    const result = await unsubscribeHandler.processEmailUnsubscribe({
      token: token || undefined,
      email: email || undefined,
      ipAddress
    })

    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to process unsubscribe request' },
        { status: 500 }
      )
    }

    // Return HTML page for user-friendly experience
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribe ${result.data?.success ? 'Successful' : 'Failed'}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
            background-color: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .success { color: #28a745; }
          .error { color: #dc3545; }
          h1 { margin-bottom: 20px; }
          p { margin-bottom: 15px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="${result.data?.success ? 'success' : 'error'}">
            ${result.data?.success ? '✓ Unsubscribed Successfully' : '✗ Unsubscribe Failed'}
          </h1>
          <p>${result.data?.message}</p>
          ${result.data?.success ? 
            '<p>You will no longer receive marketing emails from us. This change is effective immediately.</p>' :
            '<p>If you continue to have issues, please contact our support team.</p>'
          }
        </div>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error) {
    console.error('Unsubscribe API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, campaignId } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Get client IP address
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    const result = await unsubscribeHandler.processEmailUnsubscribe({
      email,
      campaignId,
      ipAddress
    })

    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to process unsubscribe request' },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)

  } catch (error) {
    console.error('Unsubscribe API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
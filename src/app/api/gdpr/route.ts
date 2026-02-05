// API route for GDPR compliance requests
import { NextRequest, NextResponse } from 'next/server'
import { consentManager } from '@/lib/compliance'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactId, requestType } = body

    if (!contactId || !requestType) {
      return NextResponse.json(
        { error: 'Missing required parameters: contactId, requestType' },
        { status: 400 }
      )
    }

    if (!['access', 'deletion', 'portability'].includes(requestType)) {
      return NextResponse.json(
        { error: 'Invalid request type. Must be one of: access, deletion, portability' },
        { status: 400 }
      )
    }

    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'

    const result = await consentManager.processGDPRRequest({
      contactId,
      requestType,
      requestedAt: new Date(),
      ipAddress
    })

    if (result.error) {
      return NextResponse.json(
        { error: `Failed to process ${requestType} request` },
        { status: 500 }
      )
    }

    // For deletion requests, return simple confirmation
    if (requestType === 'deletion') {
      return NextResponse.json({
        success: true,
        message: 'Data deletion request processed successfully',
        requestType
      })
    }

    // For access and portability requests, return the data
    return NextResponse.json({
      success: true,
      requestType,
      data: result.data
    })

  } catch (error) {
    console.error('GDPR API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
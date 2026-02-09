// API route for consent management
import { NextRequest, NextResponse } from 'next/server'
import { consentManager } from '@/lib/compliance'
import { ConsentType, ConsentSource } from '@/lib/database/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contactId, type, consented, source, ipAddress } = body

    if (!contactId || type === undefined || consented === undefined || !source) {
      return NextResponse.json(
        { error: 'Missing required parameters: contactId, type, consented, source' },
        { status: 400 }
      )
    }

    // Validate type and source
    if (!['email', 'sms'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid consent type. Must be "email" or "sms"' },
        { status: 400 }
      )
    }

    if (!['shopify', 'manual', 'campaign', 'api'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid consent source. Must be one of: shopify, manual, campaign, api' },
        { status: 400 }
      )
    }

    const result = await consentManager.recordConsent({
      contactId,
      type: type as ConsentType,
      consented: Boolean(consented),
      source: source as ConsentSource,
      ipAddress: ipAddress || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    })

    if (result.error) {
      return NextResponse.json(
        { error: 'Failed to record consent' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      consentRecord: result.data
    })

  } catch (error) {
    console.error('Consent API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const contactId = searchParams.get('contactId')
    const action = searchParams.get('action')

    if (!contactId) {
      return NextResponse.json(
        { error: 'contactId parameter is required' },
        { status: 400 }
      )
    }

    if (action === 'status') {
      // Get current consent status
      const result = await consentManager.getConsentStatus(contactId)
      
      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to get consent status' },
          { status: 500 }
        )
      }

      return NextResponse.json(result.data)

    } else if (action === 'audit') {
      // Get consent audit trail
      const result = await consentManager.getConsentAuditTrail(contactId)
      
      if (result.error) {
        return NextResponse.json(
          { error: 'Failed to get consent audit trail' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        auditTrail: result.data,
        count: result.count
      })

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "status" or "audit"' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Consent API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
// API route for bulk compliance operations
import { NextRequest, NextResponse } from 'next/server'
import { bulkComplianceOperations } from '@/lib/compliance'
import { ConsentType, ConsentSource } from '@/lib/database/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { operation, ...params } = body

    if (!operation) {
      return NextResponse.json(
        { error: 'Operation type is required' },
        { status: 400 }
      )
    }

    switch (operation) {
      case 'bulk_consent':
        return await handleBulkConsent(request, params)
      
      case 'bulk_unsubscribe':
        return await handleBulkUnsubscribe(request, params)
      
      case 'validate_consent':
        return await handleValidateConsent(params)
      
      case 'compliance_report':
        return await handleComplianceReport(params)
      
      default:
        return NextResponse.json(
          { error: 'Invalid operation type' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Bulk compliance API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleBulkConsent(request: NextRequest, params: {
  contactIds: string[]
  type: 'email' | 'sms'
  consented: boolean
  source: string
}) {
  const { contactIds, type, consented, source } = params

  if (!contactIds || !Array.isArray(contactIds) || !type || consented === undefined || !source) {
    return NextResponse.json(
      { error: 'Missing required parameters: contactIds, type, consented, source' },
      { status: 400 }
    )
  }

  if (!['email', 'sms'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid consent type' },
      { status: 400 }
    )
  }

  if (!['shopify', 'manual', 'campaign', 'api'].includes(source)) {
    return NextResponse.json(
      { error: 'Invalid consent source' },
      { status: 400 }
    )
  }

  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'

  const result = await bulkComplianceOperations.processBulkConsent({
    contactIds,
    type: type as ConsentType,
    consented: Boolean(consented),
    source: source as ConsentSource,
    ipAddress
  })

  if (result.error) {
    return NextResponse.json(
      { error: 'Failed to process bulk consent' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    result: result.data
  })
}

async function handleBulkUnsubscribe(request: NextRequest, params: {
  emails?: string[]
  phoneNumbers?: string[]
  campaignId?: string
  source: string
}) {
  const { emails, phoneNumbers, campaignId, source } = params

  if ((!emails || !Array.isArray(emails)) && (!phoneNumbers || !Array.isArray(phoneNumbers))) {
    return NextResponse.json(
      { error: 'Either emails or phoneNumbers array is required' },
      { status: 400 }
    )
  }

  const ipAddress = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown'

  const result = await bulkComplianceOperations.processBulkUnsubscribe({
    emails,
    phoneNumbers,
    campaignId,
    source: source as ConsentSource,
    ipAddress
  })

  if (result.error) {
    return NextResponse.json(
      { error: 'Failed to process bulk unsubscribe' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    result: result.data
  })
}

async function handleValidateConsent(params: {
  contactIds: string[]
  type: 'email' | 'sms'
}) {
  const { contactIds, type } = params

  if (!contactIds || !Array.isArray(contactIds) || !type) {
    return NextResponse.json(
      { error: 'Missing required parameters: contactIds, type' },
      { status: 400 }
    )
  }

  if (!['email', 'sms'].includes(type)) {
    return NextResponse.json(
      { error: 'Invalid consent type' },
      { status: 400 }
    )
  }

  const result = await bulkComplianceOperations.validateCampaignConsent(
    contactIds,
    type as ConsentType
  )

  if (result.error) {
    return NextResponse.json(
      { error: 'Failed to validate consent' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    validation: result.data
  })
}

async function handleComplianceReport(params: {
  storeId: string
}) {
  const { storeId } = params

  if (!storeId) {
    return NextResponse.json(
      { error: 'storeId is required' },
      { status: 400 }
    )
  }

  const result = await bulkComplianceOperations.generateComplianceReport(storeId)

  if (result.error) {
    return NextResponse.json(
      { error: 'Failed to generate compliance report' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    report: result.data
  })
}
// API route for sending emails
import { NextRequest, NextResponse } from 'next/server'
import { emailService } from '@/lib/email'
import { getSupabaseAdmin } from '@/lib/database/client'
import { authServer } from '@/lib/auth/server'
import { domainManager } from '@/lib/email/domain-manager'

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId, recipientIds } = await request.json()
    
    if (!campaignId) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    // Mock email sending for now
    const mockResult = {
      success: Math.floor(Math.random() * 100) + 50,
      failed: Math.floor(Math.random() * 10),
      total: Math.floor(Math.random() * 110) + 50
    }

    return NextResponse.json({
      success: true,
      sent: mockResult.success,
      failed: mockResult.failed,
      total: mockResult.total
    })
  } catch (error) {
    console.error('Send email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email campaign' },
      { status: 500 }
    )
  }
}
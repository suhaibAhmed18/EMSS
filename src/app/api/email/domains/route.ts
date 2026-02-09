// API routes for email domain management
import { NextRequest, NextResponse } from 'next/server'
import { domainManager } from '@/lib/email/domain-manager'
import { authServer } from '@/lib/auth/server'

export async function GET() {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock domain config for now
    const domainConfig = {
      domain: 'example.com',
      verified: false,
      dnsRecords: []
    }
    
    return NextResponse.json({ 
      domain: domainConfig,
      canSend: false
    })
  } catch (error) {
    console.error('Get domain error:', error)
    return NextResponse.json(
      { error: 'Failed to get domain configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domain } = await request.json()
    
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Mock domain setup
    const domainConfig = {
      domain,
      verified: false,
      dnsRecords: [
        { type: 'TXT', name: '@', value: 'v=spf1 include:resend.com ~all' },
        { type: 'CNAME', name: 'resend._domainkey', value: 'resend._domainkey.resend.com' }
      ]
    }
    
    const instructions = {
      steps: [
        'Add the DNS records to your domain',
        'Wait for DNS propagation (up to 24 hours)',
        'Click verify to check the setup'
      ]
    }
    
    return NextResponse.json({ 
      domain: domainConfig,
      instructions
    })
  } catch (error) {
    console.error('Setup domain error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to setup domain' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Mock domain removal
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove domain error:', error)
    return NextResponse.json(
      { error: 'Failed to remove domain' },
      { status: 500 }
    )
  }
}
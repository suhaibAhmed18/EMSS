import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    
    // Get user domains (you'll need to create a domains table)
    const { data: domains, error } = await supabase
      .from('email_domains')
      .select('*')
      .eq('user_id', user.id)

    if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
      console.error('Error fetching domains:', error)
    }

    return NextResponse.json({
      domains: domains || []
    })
  } catch (error) {
    console.error('Failed to get domains:', error)
    return NextResponse.json(
      { error: 'Failed to load domains' },
      { status: 500 }
    )
  }
}

// Validate domain format
function validateDomain(domain: string): { valid: boolean; error?: string } {
  // Basic domain format validation
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i
  
  if (!domain || domain.trim().length === 0) {
    return { valid: false, error: 'Domain cannot be empty' }
  }
  
  if (!domainRegex.test(domain)) {
    return { valid: false, error: 'Invalid domain format. Example: example.com' }
  }
  
  // Check for common invalid patterns
  if (domain.includes('..') || domain.startsWith('.') || domain.endsWith('.')) {
    return { valid: false, error: 'Domain contains invalid characters' }
  }
  
  // Check for protocol or www (should be cleaned by frontend but double-check)
  if (domain.includes('://') || domain.startsWith('www.')) {
    return { valid: false, error: 'Domain should not include protocol or www' }
  }
  
  // Check minimum length
  if (domain.length < 4) {
    return { valid: false, error: 'Domain is too short' }
  }
  
  // Check maximum length (DNS limit is 253 characters)
  if (domain.length > 253) {
    return { valid: false, error: 'Domain is too long' }
  }
  
  return { valid: true }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domain, type } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 })
    }

    // Validate domain format
    const validation = validateDomain(domain)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    // Check if domain already exists for this user
    const { data: existingDomain } = await supabase
      .from('email_domains')
      .select('id')
      .eq('user_id', user.id)
      .eq('domain', domain)
      .single()

    if (existingDomain) {
      return NextResponse.json({ error: 'This domain is already added to your account' }, { status: 400 })
    }

    // Initiate domain verification with Resend
    const { resendEmailService } = await import('@/lib/email/resend-client')
    const verificationResult = await resendEmailService.verifyDomain(domain)
    
    const { data, error } = await supabase
      .from('email_domains')
      .insert({
        user_id: user.id,
        domain,
        type: type || 'email',
        verified: false,
        auto_warmup: false,
        resend_domain_id: verificationResult.domainId || null,
        verification_status: verificationResult.success ? 'pending' : 'failed',
        verification_started_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ 
      domain: data,
      message: 'Domain added successfully. Verification can take up to 2 days to complete.'
    })
  } catch (error) {
    console.error('Failed to add domain:', error)
    return NextResponse.json(
      { error: 'Failed to add domain' },
      { status: 500 }
    )
  }
}

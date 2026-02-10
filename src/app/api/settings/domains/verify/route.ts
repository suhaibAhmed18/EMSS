import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'
import { resendEmailService } from '@/lib/email/resend-client'

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { domainId, businessEmail } = await request.json()

    if (!domainId) {
      return NextResponse.json({ error: 'Domain ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    
    // Get the domain from database
    const { data: domainData, error: fetchError } = await supabase
      .from('email_domains')
      .select('*')
      .eq('id', domainId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !domainData) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 })
    }

    // Verify domain through Resend API
    const isVerified = await resendEmailService.verifyDomain(domainData.domain)

    if (!isVerified) {
      return NextResponse.json({ 
        error: 'Domain verification failed. Please ensure DNS records are properly configured.',
        verified: false 
      }, { status: 400 })
    }

    // Update domain with verification status and business email
    const updateData: any = {
      verified: true,
      updated_at: new Date().toISOString()
    }

    // Store business email if provided
    if (businessEmail) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(businessEmail)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Verify email belongs to the domain
      const emailDomain = businessEmail.split('@')[1]
      if (emailDomain !== domainData.domain) {
        return NextResponse.json({ 
          error: `Business email must belong to the domain ${domainData.domain}` 
        }, { status: 400 })
      }

      updateData.business_email = businessEmail
    }

    const { data: updatedDomain, error: updateError } = await supabase
      .from('email_domains')
      .update(updateData)
      .eq('id', domainId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ 
      success: true,
      verified: true,
      domain: updatedDomain,
      message: 'Domain verified successfully'
    })
  } catch (error) {
    console.error('Failed to verify domain:', error)
    return NextResponse.json(
      { error: 'Failed to verify domain' },
      { status: 500 }
    )
  }
}

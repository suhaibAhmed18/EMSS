import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

interface ContactRow {
  first_name?: string
  last_name?: string
  email: string
  phone?: string
  tags?: string
  email_consent?: string | boolean
  sms_consent?: string | boolean
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({ 
        error: 'No store connected. Please connect a Shopify store first.' 
      }, { status: 400 })
    }

    const storeId = stores[0].id

    // Parse CSV data from request
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 })
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    
    // Parse CSV rows
    const contacts: ContactRow[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const contact: any = {}
      
      headers.forEach((header, index) => {
        if (values[index]) {
          contact[header] = values[index]
        }
      })
      
      if (contact.email) {
        contacts.push(contact)
      }
    }

    if (contacts.length === 0) {
      return NextResponse.json({ error: 'No valid contacts found in CSV' }, { status: 400 })
    }

    // Check contact limit based on subscription plan
    const { getSupabaseAdmin } = await import('@/lib/database/client')
    const { getPlanLimits } = await import('@/lib/pricing/plans')
    const supabase = getSupabaseAdmin()
    
    // Get user's subscription plan
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()

    const planLimits = getPlanLimits(userData?.subscription_plan || 'Free')
    
    // Count existing contacts for this store
    const { count: existingContactCount } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)

    const currentCount = existingContactCount || 0
    const newTotalCount = currentCount + contacts.length

    // Check if import would exceed contact limit
    if (newTotalCount > planLimits.contacts) {
      const remainingSlots = planLimits.contacts - currentCount
      return NextResponse.json({
        error: `Contact limit exceeded. Your ${userData?.subscription_plan || 'Free'} plan allows up to ${planLimits.contacts.toLocaleString()} contacts. You currently have ${currentCount.toLocaleString()} contacts and are trying to import ${contacts.length.toLocaleString()} more. You can only import ${remainingSlots} more contact(s). Please upgrade your plan to import more contacts.`,
        needsUpgrade: true,
        currentCount,
        limit: planLimits.contacts,
        attemptedImport: contacts.length,
        remainingSlots
      }, { status: 403 })
    }

    // Import contacts into database
    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    for (const contact of contacts) {
      try {
        const contactData = {
          store_id: storeId,
          email: contact.email,
          first_name: contact.first_name || contact['first name'] || '',
          last_name: contact.last_name || contact['last name'] || '',
          phone: contact.phone || '',
          tags: contact.tags ? contact.tags.split(';').map((t: string) => t.trim()) : [],
          email_consent: contact.email_consent === 'true' || contact.email_consent === 'Yes' || contact.email_consent === true,
          sms_consent: contact.sms_consent === 'true' || contact.sms_consent === 'Yes' || contact.sms_consent === true
        }

        const { error } = await databaseService.supabase
          .from('contacts')
          .upsert(contactData, { 
            onConflict: 'store_id,email',
            ignoreDuplicates: false 
          })

        if (error) {
          failCount++
          errors.push(`Failed to import ${contact.email}: ${error.message}`)
        } else {
          successCount++
        }
      } catch (error) {
        failCount++
        errors.push(`Error importing ${contact.email}: ${error}`)
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      total: contacts.length,
      successful: successCount,
      failed: failCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined
    })

  } catch (error) {
    console.error('Contact import error:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    )
  }
}

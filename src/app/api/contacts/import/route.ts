import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { ContactManager, createServiceSupabaseClient } from '@/lib/database/client'

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's store ID
    const storeId = user.store_id
    if (!storeId) {
      return NextResponse.json({ error: 'No store associated with user' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only CSV files are allowed.' 
      }, { status: 400 })
    }

    // Parse CSV file
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json({ 
        error: 'CSV file must contain headers and at least one data row' 
      }, { status: 400 })
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Validate required headers
    const requiredHeaders = ['email']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `Missing required headers: ${missingHeaders.join(', ')}` 
      }, { status: 400 })
    }

    const errors: string[] = []
    let imported = 0
    let skipped = 0

    // Initialize contact manager
    const supabase = createServiceSupabaseClient()
    const contactManager = new ContactManager(supabase)
    
    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      try {
        // Simple CSV parsing (handles basic cases)
        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''))
        
        const getColumnValue = (columnName: string): string => {
          const index = headers.indexOf(columnName)
          return index >= 0 ? values[index] || '' : ''
        }

        const email = getColumnValue('email')
        
        if (!email) {
          errors.push(`Row ${i + 1}: Email is required`)
          skipped++
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          errors.push(`Row ${i + 1}: Invalid email format: ${email}`)
          skipped++
          continue
        }

        // Check if contact already exists
        const existingContact = await contactManager.findContactByEmail(storeId, email)
        if (existingContact.data) {
          errors.push(`Row ${i + 1}: Contact with email ${email} already exists`)
          skipped++
          continue
        }

        // Parse tags
        const tagsValue = getColumnValue('tags')
        const tags = tagsValue ? tagsValue.split(';').map(t => t.trim()).filter(t => t) : []

        // Parse consent values
        const emailConsentValue = getColumnValue('email_consent')
        const smsConsentValue = getColumnValue('sms_consent')
        
        // Create contact data
        const contactData = {
          store_id: storeId,
          email,
          first_name: getColumnValue('first_name') || null,
          last_name: getColumnValue('last_name') || null,
          phone: getColumnValue('phone') || null,
          shopify_customer_id: null,
          tags,
          segments: [],
          email_consent: ['yes', 'true', '1'].includes(emailConsentValue.toLowerCase()),
          sms_consent: ['yes', 'true', '1'].includes(smsConsentValue.toLowerCase()),
          total_spent: parseFloat(getColumnValue('total_spent')) || 0,
          order_count: parseInt(getColumnValue('order_count')) || 0,
          last_order_at: null,
        }

        // Create contact
        const result = await contactManager.createContact(contactData)
        
        if (result.error) {
          errors.push(`Row ${i + 1}: Failed to import ${email}: ${result.error.message}`)
          skipped++
        } else {
          imported++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push(`Row ${i + 1}: ${errorMessage}`)
        skipped++
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 20), // Limit to first 20 errors
      message: `Successfully imported ${imported} contact(s). ${skipped} skipped.`
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import contacts' },
      { status: 500 }
    )
  }
}
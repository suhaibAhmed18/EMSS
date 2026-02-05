import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only CSV and Excel files are allowed.' 
      }, { status: 400 })
    }

    // For now, simulate import since database isn't set up
    const importResult = {
      success: true,
      message: 'Contacts imported successfully (demo mode)',
      imported: 0,
      skipped: 0,
      errors: []
    }

    return NextResponse.json(importResult)

    // TODO: Uncomment this code after database setup
    /*
    // Parse CSV/Excel file
    const text = await file.text()
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    const contacts = []
    const errors = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const values = line.split(',').map(v => v.trim())
      
      try {
        const contact = {
          first_name: values[headers.indexOf('First Name')] || '',
          last_name: values[headers.indexOf('Last Name')] || '',
          email: values[headers.indexOf('Email')] || '',
          phone: values[headers.indexOf('Phone')] || '',
          tags: (values[headers.indexOf('Tags')] || '').split(';').filter(t => t),
          email_consent: (values[headers.indexOf('Email Consent')] || '').toLowerCase() === 'yes',
          sms_consent: (values[headers.indexOf('SMS Consent')] || '').toLowerCase() === 'yes',
          total_spent: parseFloat(values[headers.indexOf('Total Spent')] || '0'),
          order_count: parseInt(values[headers.indexOf('Order Count')] || '0')
        }
        
        if (!contact.email) {
          errors.push(`Row ${i + 1}: Email is required`)
          continue
        }
        
        contacts.push(contact)
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`)
      }
    }
    
    // Import contacts to database
    let imported = 0
    let skipped = 0
    
    for (const contact of contacts) {
      try {
        await databaseService.createContact({
          ...contact,
          store_id: storeId
        })
        imported++
      } catch (error) {
        skipped++
        errors.push(`Failed to import ${contact.email}: ${error.message}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      imported,
      skipped,
      errors: errors.slice(0, 10) // Limit to first 10 errors
    })
    */
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import contacts' },
      { status: 500 }
    )
  }
}
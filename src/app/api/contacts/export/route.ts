import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { ContactRepository } from '@/lib/database/repositories'
import { databaseService } from '@/lib/database/service'

// Helper function to escape CSV values
function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  
  const stringValue = String(value)
  
  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { format = 'csv', includePersonalData = true } = await request.json()

    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({ 
        error: 'No store associated with user. Please connect a Shopify store first.' 
      }, { status: 400 })
    }

    // Use the first store
    const storeId = stores[0].id

    // Fetch all contacts from database
    const contactRepo = new ContactRepository(true)
    const { data: contacts, error } = await contactRepo.getStoreContacts(storeId)
    
    if (error) {
      console.error('Failed to fetch contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    // Handle empty contacts
    if (!contacts || contacts.length === 0) {
      const emptyContent = `First Name,Last Name,Email,Phone,Tags,Segments,Email Consent,SMS Consent,Total Spent,Order Count,Last Order Date,Shopify Customer ID,Created At,Updated At
No contacts available,,,,,,,,,,,,,`
      
      return new NextResponse(emptyContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`
        }
      })
    }

    // Generate CSV content with all contact fields
    const headers = [
      'First Name',
      'Last Name', 
      'Email',
      'Phone',
      'Tags',
      'Segments',
      'Email Consent',
      'SMS Consent',
      'Total Spent',
      'Order Count',
      'Last Order Date',
      'Shopify Customer ID',
      'Created At',
      'Updated At'
    ]
    
    const csvRows = [headers.join(',')]
    
    contacts.forEach(contact => {
      const row = [
        escapeCsvValue(contact.first_name),
        escapeCsvValue(contact.last_name),
        escapeCsvValue(contact.email),
        escapeCsvValue(contact.phone),
        escapeCsvValue(contact.tags?.join(';') || ''),
        escapeCsvValue(contact.segments?.join(';') || ''),
        escapeCsvValue(contact.email_consent ? 'Yes' : 'No'),
        escapeCsvValue(contact.sms_consent ? 'Yes' : 'No'),
        escapeCsvValue(contact.total_spent?.toFixed(2) || '0.00'),
        escapeCsvValue(contact.order_count || 0),
        escapeCsvValue(contact.last_order_at ? new Date(contact.last_order_at).toLocaleDateString() : ''),
        escapeCsvValue(contact.shopify_customer_id),
        escapeCsvValue(contact.created_at ? new Date(contact.created_at).toLocaleString() : ''),
        escapeCsvValue(contact.updated_at ? new Date(contact.updated_at).toLocaleString() : '')
      ]
      csvRows.push(row.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Failed to export contacts:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    )
  }
}
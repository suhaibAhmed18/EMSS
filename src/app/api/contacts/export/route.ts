import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { format = 'csv', includePersonalData = true } = await request.json()

    // For now, return empty CSV since database isn't set up
    const csvContent = `First Name,Last Name,Email,Phone,Tags,Email Consent,SMS Consent,Total Spent,Order Count,Last Order Date
No contacts available,,,,,,,,,`

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

    // TODO: Uncomment this code after database setup
    /*
    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return new NextResponse('No contacts available', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="contacts-empty.csv"'
        }
      })
    }

    const storeId = stores[0].id
    const { contacts } = await databaseService.getContactsByStoreId(storeId)
    
    // Generate CSV content
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Tags', 'Email Consent', 'SMS Consent', 'Total Spent', 'Order Count', 'Last Order Date']
    const csvRows = [headers.join(',')]
    
    contacts.forEach(contact => {
      const row = [
        contact.first_name || '',
        contact.last_name || '',
        contact.email,
        contact.phone || '',
        contact.tags.join(';'),
        contact.email_consent ? 'Yes' : 'No',
        contact.sms_consent ? 'Yes' : 'No',
        contact.total_spent.toString(),
        contact.order_count.toString(),
        contact.last_order_at ? new Date(contact.last_order_at).toLocaleDateString() : ''
      ]
      csvRows.push(row.join(','))
    })
    
    const csvContent = csvRows.join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="contacts-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
    */
  } catch (error) {
    console.error('Failed to export contacts:', error)
    return NextResponse.json(
      { error: 'Failed to export contacts' },
      { status: 500 }
    )
  }
}
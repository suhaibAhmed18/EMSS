import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For now, return mock segments since database isn't set up
    // In a real implementation, this would calculate segments from the database
    const segments = [
      { name: 'All Contacts', count: 0, description: 'All contacts in your database' },
      { name: 'Email Subscribers', count: 0, description: 'Contacts who have opted in to email marketing' },
      { name: 'SMS Subscribers', count: 0, description: 'Contacts who have opted in to SMS marketing' },
      { name: 'High Value Customers', count: 0, description: 'Customers who have spent over $1000' },
      { name: 'Recent Customers', count: 0, description: 'Customers who made a purchase in the last 30 days' },
    ]

    return NextResponse.json({ 
      segments,
      message: 'Database tables not set up yet. Segments will show real counts after database setup.'
    })

    // TODO: Uncomment this code after database setup
    /*
    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({ segments: [] })
    }

    const storeId = stores[0].id
    
    // Calculate segments from database
    const [
      allContacts,
      emailSubscribers,
      smsSubscribers,
      highValueCustomers,
      recentCustomers
    ] = await Promise.all([
      databaseService.getContactCount(storeId),
      databaseService.getContactCount(storeId, { email_consent: true }),
      databaseService.getContactCount(storeId, { sms_consent: true }),
      databaseService.getContactCount(storeId, { total_spent: { gte: 1000 } }),
      databaseService.getContactCount(storeId, { 
        last_order_at: { 
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
        } 
      })
    ])

    const segments = [
      { name: 'All Contacts', count: allContacts, description: 'All contacts in your database' },
      { name: 'Email Subscribers', count: emailSubscribers, description: 'Contacts who have opted in to email marketing' },
      { name: 'SMS Subscribers', count: smsSubscribers, description: 'Contacts who have opted in to SMS marketing' },
      { name: 'High Value Customers', count: highValueCustomers, description: 'Customers who have spent over $1000' },
      { name: 'Recent Customers', count: recentCustomers, description: 'Customers who made a purchase in the last 30 days' },
    ]
    
    return NextResponse.json({ segments })
    */
  } catch (error) {
    console.error('Failed to fetch segments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch segments' },
      { status: 500 }
    )
  }
}
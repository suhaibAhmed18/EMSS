import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    console.log('👥 Contacts API called for user:', user.id)

    try {
      // Get user's stores
      const stores = await databaseService.getStoresByUserId(user.id)
      console.log('🏪 Found stores:', stores.length)
      
      if (stores.length === 0) {
        console.log('ℹ️ No stores found for user')
        return NextResponse.json({ 
          contacts: [],
          message: 'No stores connected. Please connect a Shopify store first.'
        })
      }

      // Get contacts from all stores (or specific store if provided)
      const { searchParams } = new URL(request.url)
      const storeId = searchParams.get('store')
      
      let allContacts: any[] = []
      
      if (storeId) {
        // Get contacts from specific store
        const store = stores.find(s => s.id === storeId)
        if (store) {
          console.log('📊 Getting contacts for specific store:', store.shop_domain)
          const { contacts } = await databaseService.getContactsByStoreId(storeId)
          allContacts = contacts || []
        }
      } else {
        // Get contacts from all stores
        console.log('📊 Getting contacts from all stores...')
        for (const store of stores) {
          try {
            const { contacts } = await databaseService.getContactsByStoreId(store.id)
            if (contacts && contacts.length > 0) {
              allContacts.push(...contacts)
            }
          } catch (storeError) {
            console.error(`❌ Failed to get contacts for store ${store.shop_domain}:`, storeError)
            // Continue with other stores
          }
        }
      }

      console.log(`✅ Retrieved ${allContacts.length} contacts`)
      
      return NextResponse.json({ 
        contacts: allContacts,
        total: allContacts.length,
        stores: stores.map(s => ({
          id: s.id,
          name: s.store_name,
          domain: s.shop_domain
        }))
      })
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError)
      
      // If database tables don't exist, return helpful message
      if (dbError instanceof Error && dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return NextResponse.json({ 
          contacts: [],
          message: 'Database tables not set up yet. Please run the database migrations first.',
          error: 'database_not_setup'
        })
      }
      
      throw dbError
    }
  } catch (error) {
    console.error('❌ Failed to fetch contacts:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch contacts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const contactData = await request.json()
    console.log('👤 Creating new contact:', contactData.email)

    try {
      // Get user's first store (or specific store if provided)
      const stores = await databaseService.getStoresByUserId(user.id)
      if (stores.length === 0) {
        return NextResponse.json(
          { error: 'No stores connected. Please connect a Shopify store first.' },
          { status: 400 }
        )
      }

      const store = stores[0] // Use first store for now
      
      // Add store_id to contact data
      const fullContactData = {
        ...contactData,
        store_id: store.id,
        shopify_customer_id: `manual_${Date.now()}`, // Mark as manually created
        total_spent: 0,
        order_count: 0,
        tags: contactData.tags || [],
        segments: ['Manual Import']
      }

      const newContact = await databaseService.createContact(fullContactData)
      console.log('✅ Contact created successfully:', newContact.id)

      return NextResponse.json({
        success: true,
        message: 'Contact created successfully',
        contact: newContact
      })
    } catch (dbError) {
      console.error('❌ Database error creating contact:', dbError)
      
      if (dbError instanceof Error && dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Database tables not set up yet. Please run the database migrations first.' },
          { status: 500 }
        )
      }
      
      throw dbError
    }
  } catch (error) {
    console.error('❌ Failed to create contact:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create contact',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
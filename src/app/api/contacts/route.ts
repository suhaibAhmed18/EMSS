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

    // Validate required fields
    if (!contactData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    try {
      // Get user's first store (or specific store if provided)
      const stores = await databaseService.getStoresByUserId(user.id)
      console.log(`📊 Found ${stores.length} store(s) for user ${user.id}`)
      
      if (stores.length === 0) {
        return NextResponse.json(
          { error: 'No stores connected. Please connect a Shopify store first.' },
          { status: 400 }
        )
      }

      const store = stores[0] // Use first store for now
      console.log(`🏪 Using store: ${store.store_name} (${store.id})`)

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
      const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)

      // Check if user has reached contact limit
      if (contactCount !== null && contactCount >= planLimits.contacts) {
        return NextResponse.json({
          error: `Contact limit reached. Your ${userData?.subscription_plan || 'Free'} plan allows up to ${planLimits.contacts.toLocaleString()} contacts. Please upgrade your plan to add more contacts.`,
          needsUpgrade: true,
          currentCount: contactCount,
          limit: planLimits.contacts
        }, { status: 403 })
      }
      
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
      
      // Handle specific database errors
      if (dbError instanceof Error) {
        // Table doesn't exist
        if (dbError.message.includes('relation') && dbError.message.includes('does not exist')) {
          return NextResponse.json(
            { error: 'Database tables not set up yet. Please run the database migrations first.' },
            { status: 500 }
          )
        }
        
        // Duplicate email
        if (dbError.message.includes('duplicate key') || dbError.message.includes('unique constraint')) {
          return NextResponse.json(
            { error: 'A contact with this email already exists in your store.' },
            { status: 400 }
          )
        }
        
        // Return the actual error message for debugging
        return NextResponse.json(
          { 
            error: 'Database error',
            details: dbError.message 
          },
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
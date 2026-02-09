// Sync Shopify store data API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'
import { ShopifyClient } from '@/lib/shopify/client'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Shopify sync API called')
    
    // Get authenticated user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({ error: 'No store connected' }, { status: 404 })
    }

    const store = stores[0] // Use first store
    console.log('🏪 Syncing store:', store.shop_domain)

    // Create Shopify client
    const shopifyClient = new ShopifyClient(
      store.shop_domain.replace('.myshopify.com', ''),
      store.access_token
    )

    // Fetch store metrics from Shopify
    console.log('📊 Fetching store metrics from Shopify...')
    const metrics = await shopifyClient.getStoreMetrics()
    console.log('✅ Store metrics fetched:', metrics)

    // Sync customers
    console.log('👥 Syncing customers...')
    const { customers } = await shopifyClient.getCustomers(250)
    let customersImported = 0
    let customersUpdated = 0

    for (const shopifyCustomer of customers) {
      try {
        const contactData = {
          store_id: store.id,
          email: shopifyCustomer.email,
          phone: shopifyCustomer.phone || undefined,
          first_name: shopifyCustomer.first_name || '',
          last_name: shopifyCustomer.last_name || '',
          shopify_customer_id: shopifyCustomer.id,
          email_consent: shopifyCustomer.accepts_marketing || false,
          sms_consent: shopifyCustomer.accepts_marketing && !!shopifyCustomer.phone,
          accepts_marketing: shopifyCustomer.accepts_marketing || false,
          total_spent: parseFloat(String(shopifyCustomer.total_spent || '0')),
          order_count: shopifyCustomer.orders_count || 0,
          tags: shopifyCustomer.tags || [],
          segments: []
        }

        // Check if contact exists
        const existingContact = await databaseService.supabase
          .from('contacts')
          .select('id')
          .eq('store_id', store.id)
          .eq('email', shopifyCustomer.email)
          .single()

        if (existingContact.data) {
          // Update existing contact
          await databaseService.supabase
            .from('contacts')
            .update(contactData)
            .eq('id', existingContact.data.id)
          customersUpdated++
        } else {
          // Create new contact
          await databaseService.createContact(contactData)
          customersImported++
        }
      } catch (contactError) {
        console.error(`Failed to sync customer ${shopifyCustomer.email}:`, contactError)
      }
    }

    console.log(`✅ Customers synced: ${customersImported} imported, ${customersUpdated} updated`)

    // Sync orders
    console.log('📦 Syncing orders...')
    const { orders } = await shopifyClient.getOrders(250)
    let ordersImported = 0
    let ordersUpdated = 0

    for (const shopifyOrder of orders) {
      try {
        // Find contact by email
        let contactId = null
        if (shopifyOrder.email) {
          const contact = await databaseService.supabase
            .from('contacts')
            .select('id')
            .eq('store_id', store.id)
            .eq('email', shopifyOrder.email)
            .single()
          
          contactId = contact.data?.id || null
        }

        const orderData = {
          store_id: store.id,
          shopify_order_id: shopifyOrder.id.toString(),
          contact_id: contactId,
          order_number: shopifyOrder.order_number?.toString() || shopifyOrder.name,
          total_price: parseFloat(String(shopifyOrder.total_price || '0')),
          currency: shopifyOrder.currency,
          financial_status: shopifyOrder.financial_status,
          fulfillment_status: shopifyOrder.fulfillment_status || 'unfulfilled',
          created_at_shopify: new Date(shopifyOrder.created_at),
          updated_at_shopify: new Date(shopifyOrder.updated_at)
        }

        // Upsert order
        const { error } = await databaseService.supabase
          .from('shopify_orders')
          .upsert(orderData, {
            onConflict: 'store_id,shopify_order_id',
            ignoreDuplicates: false
          })

        if (error) {
          console.error('Failed to upsert order:', error)
        } else {
          ordersImported++
        }
      } catch (orderError) {
        console.error(`Failed to sync order ${shopifyOrder.id}:`, orderError)
      }
    }

    console.log(`✅ Orders synced: ${ordersImported} imported/updated`)

    // Update store last_synced_at
    await databaseService.updateStore(store.id, {
      settings: {
        ...store.settings,
        last_synced_at: new Date().toISOString(),
        last_sync_metrics: {
          customers_imported: customersImported,
          customers_updated: customersUpdated,
          orders_synced: ordersImported
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Store data synced successfully',
      metrics: {
        storeMetrics: metrics,
        customersImported,
        customersUpdated,
        ordersSynced: ordersImported
      }
    })
  } catch (error) {
    console.error('❌ Shopify sync error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to sync store data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

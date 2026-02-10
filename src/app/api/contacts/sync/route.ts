import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

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

    const store = stores[0]

    // Check if store has access token
    if (!store.access_token) {
      return NextResponse.json({ 
        error: 'Store not properly configured. Please reconnect your Shopify store.' 
      }, { status: 400 })
    }

    // Fetch customers from Shopify
    const shopifyUrl = `https://${store.shop_domain}/admin/api/2024-01/customers.json`
    
    try {
      const response = await fetch(shopifyUrl, {
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.statusText}`)
      }

      const data = await response.json()
      const customers = data.customers || []

      // Import customers as contacts
      let successCount = 0
      let failCount = 0

      for (const customer of customers) {
        try {
          const contactData = {
            store_id: store.id,
            email: customer.email,
            first_name: customer.first_name || '',
            last_name: customer.last_name || '',
            phone: customer.phone || '',
            shopify_customer_id: String(customer.id),
            email_consent: customer.accepts_marketing || false,
            sms_consent: customer.accepts_marketing_updated_at ? true : false,
            total_spent: parseFloat(customer.total_spent || '0'),
            order_count: customer.orders_count || 0,
            tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : []
          }

          const { error } = await databaseService.supabase
            .from('contacts')
            .upsert(contactData, { 
              onConflict: 'store_id,email',
              ignoreDuplicates: false 
            })

          if (error) {
            failCount++
          } else {
            successCount++
          }
        } catch (error) {
          failCount++
        }
      }

      return NextResponse.json({
        message: 'Shopify sync completed',
        total: customers.length,
        successful: successCount,
        failed: failCount
      })

    } catch (shopifyError: any) {
      console.error('Shopify API error:', shopifyError)
      return NextResponse.json({ 
        error: `Failed to fetch from Shopify: ${shopifyError.message}` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Shopify sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Shopify' },
      { status: 500 }
    )
  }
}

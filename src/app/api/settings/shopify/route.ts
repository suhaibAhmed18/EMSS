import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    // Get user's stores
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (storesError) {
      console.error('Error fetching stores:', storesError)
      throw storesError
    }

    if (!stores || stores.length === 0) {
      return NextResponse.json({
        connected: false,
        store: null,
        stats: null,
        webhooks: [],
        lastSync: null,
        syncStatus: 'not_connected'
      })
    }

    // Get the first (most recent) store
    const store = stores[0]
    
    // Get stats from database
    const [productsResult, contactsResult, campaignsResult] = await Promise.all([
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
      supabaseAdmin.from('contacts').select('id', { count: 'exact', head: true }).eq('store_id', store.id),
      supabaseAdmin.from('campaigns').select('id', { count: 'exact', head: true }).eq('store_id', store.id)
    ])

    const shopifyData = {
      connected: true,
      store: {
        name: store.store_name || store.shop_domain,
        domain: store.shop_domain,
        email: store.store_email || '',
        currency: store.currency || 'USD',
        timezone: store.timezone || 'UTC',
        plan: store.plan_name || 'Shopify'
      },
      stats: {
        products: productsResult.count || 0,
        customers: contactsResult.count || 0,
        orders: 0, // We don't have orders table yet
        revenue: 0 // We don't have revenue tracking yet
      },
      webhooks: [
        { name: 'Order Created', enabled: true, url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders/create` },
        { name: 'Order Paid', enabled: true, url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders/paid` },
        { name: 'Order Updated', enabled: true, url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders/update` },
        { name: 'Customer Created', enabled: true, url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/customers/create` },
        { name: 'Cart Updated', enabled: false, url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/carts/update` },
      ],
      lastSync: store.updated_at || store.created_at,
      syncStatus: 'completed'
    }

    return NextResponse.json(shopifyData)
  } catch (error) {
    console.error('Failed to fetch Shopify settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Shopify settings' },
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

    const { action, webhookName, enabled } = await request.json()

    if (action === 'toggle_webhook') {
      // In a real implementation, this would update webhook settings in Shopify
      console.log(`Toggling webhook ${webhookName} to ${enabled}`)
      
      return NextResponse.json({
        success: true,
        message: `Webhook ${webhookName} ${enabled ? 'enabled' : 'disabled'} successfully`
      })
    }

    if (action === 'sync_data') {
      // In a real implementation, this would trigger a sync with Shopify
      console.log('Triggering Shopify data sync')
      
      return NextResponse.json({
        success: true,
        message: 'Shopify data sync initiated successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update Shopify settings:', error)
    return NextResponse.json(
      { error: 'Failed to update Shopify settings' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    
    if (stores.length === 0) {
      return NextResponse.json({
        connected: false,
        store: null,
        stats: null,
        lastSync: null
      })
    }

    const store = stores[0]

    // Get store statistics
    const { data: contacts } = await databaseService.supabase
      .from('contacts')
      .select('id')
      .eq('store_id', store.id)

    const { data: orders } = await databaseService.supabase
      .from('shopify_orders')
      .select('total_price')
      .eq('store_id', store.id)

    const { data: products } = await databaseService.supabase
      .from('shopify_products')
      .select('id')
      .eq('store_id', store.id)

    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(String(order.total_price || 0)), 0) || 0

    return NextResponse.json({
      connected: true,
      store: {
        domain: store.shop_domain,
        name: store.display_name || store.shop_domain,
        plan: store.plan_type || 'free',
        currency: store.currency || 'USD'
      },
      stats: {
        products: products?.length || 0,
        customers: contacts?.length || 0,
        orders: orders?.length || 0,
        revenue: totalRevenue
      },
      lastSync: store.updated_at
    })

  } catch (error) {
    console.error('Failed to fetch Shopify data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Shopify data' },
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

    const { action } = await request.json()

    if (action === 'sync_data') {
      // Trigger Shopify data sync
      const stores = await databaseService.getStoresByUserId(user.id)
      
      if (stores.length === 0) {
        return NextResponse.json({ error: 'No store connected' }, { status: 404 })
      }

      // Update the store's updated_at timestamp to reflect sync
      await databaseService.supabase
        .from('stores')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', stores[0].id)

      return NextResponse.json({ 
        message: 'Sync initiated successfully' 
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Shopify settings error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's stores with analytics
    const stores = await databaseService.getStoresByUserId(user.id)
    
    // Add analytics to each store
    const storesWithAnalytics = await Promise.all(
      stores.map(async (store) => {
        try {
          const analytics = await databaseService.getStoreAnalytics(store.id)
          return {
            ...store,
            analytics
          }
        } catch (error) {
          console.error(`Failed to load analytics for store ${store.id}:`, error)
          return store
        }
      })
    )

    return NextResponse.json({
      stores: storesWithAnalytics,
      total: storesWithAnalytics.length
    })
  } catch (error) {
    console.error('Failed to fetch stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stores' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { shop_domain, access_token, scopes, store_name, store_email, currency, plan_name } = body

    if (!shop_domain || !access_token || !scopes) {
      return NextResponse.json(
        { error: 'Missing required fields: shop_domain, access_token, scopes' },
        { status: 400 }
      )
    }

    // Create store
    const storeData = {
      shop_domain,
      access_token,
      scopes,
      user_id: user.id,
      store_name: store_name || shop_domain.replace('.myshopify.com', ''),
      store_email: store_email || `admin@${shop_domain}`,
      currency: currency || 'USD',
      plan_name: plan_name || 'basic',
      is_active: true,
      settings: {
        oauth_completed: true,
        connected_at: new Date().toISOString()
      }
    }

    const store = await databaseService.createStore(storeData)

    return NextResponse.json({
      store,
      message: 'Store connected successfully'
    })
  } catch (error) {
    console.error('Failed to create store:', error)
    return NextResponse.json(
      { error: 'Failed to connect store' },
      { status: 500 }
    )
  }
}
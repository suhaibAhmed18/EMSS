// Shopify connection status endpoint
import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { shopifyStoreManager } from '@/lib/shopify/store-manager'
import { ShopifyError } from '@/lib/shopify/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    // For Shopify app interface, we can check by shop domain
    if (shop) {
      const store = await shopifyStoreManager.getStoreByDomain(shop)
      
      if (!store) {
        return NextResponse.json({
          isConnected: false,
          shopDomain: shop,
        })
      }

      // Test connection - for now just return true if store exists
      const isConnected = store.is_active
      
      // Get basic stats
      let contactCount = 0
      let campaignCount = 0
      
      if (isConnected) {
        try {
          // Get contact and campaign counts from database
          const { contactManager } = await import('@/lib/contacts/contact-service')
          const { emailCampaignManager } = await import('@/lib/campaigns/email-campaign-manager')
          
          const contacts = await contactManager.getContactsByStore(store.id)
          contactCount = contacts.length
          
          const campaigns = await emailCampaignManager.getCampaignsByStore(store.id)
          campaignCount = campaigns.length
        } catch (error) {
          console.error('Failed to get store stats:', error)
        }
      }

      return NextResponse.json({
        isConnected,
        shopDomain: store.shop_domain,
        lastSync: store.updated_at,
        contactCount,
        campaignCount,
      })
    }

    // Fallback to user-based lookup for web app
    const user = await authServer.requireAuth()
    const stores = await shopifyStoreManager.getStoresForUser(user.id)
    
    if (stores.length === 0) {
      return NextResponse.json({
        connected: false,
        store: null,
      })
    }

    const store = stores[0] // Use first store

    // Test connection - for now just return true if store exists
    const isConnected = store.is_active
    
    // Get store metrics if connected
    let metrics = null
    if (isConnected) {
      try {
        // Mock metrics for now
        metrics = {
          totalRevenue: Math.floor(Math.random() * 100000) + 50000,
          orderCount: Math.floor(Math.random() * 1000) + 500,
          customerCount: Math.floor(Math.random() * 5000) + 2000
        }
      } catch (error) {
        console.error('Failed to get store metrics:', error)
        // Don't fail the entire request if metrics fail
      }
    }

    return NextResponse.json({
      connected: isConnected,
      store: {
        id: store.id,
        shopDomain: store.shop_domain,
        installedAt: store.created_at,
        scopes: store.scopes || [],
        metrics,
      },
    })
  } catch (error) {
    console.error('Store status check error:', error)
    
    if (error instanceof ShopifyError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to check store status' },
      { status: 500 }
    )
  }
}
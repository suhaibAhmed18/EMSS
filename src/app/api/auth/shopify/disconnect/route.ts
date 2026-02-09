// Shopify store disconnection endpoint
import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { shopifyStoreManager } from '@/lib/shopify/store-manager'
import { ShopifyError, APIError } from '@/lib/shopify/types'

export async function POST() {
  try {
    // Require authenticated user
    const user = await authServer.requireAuth()
    
    // Get user's stores
    const stores = await shopifyStoreManager.getStoresForUser(user.id)
    if (stores.length === 0) {
      return NextResponse.json(
        { error: 'No store connection found' },
        { status: 404 }
      )
    }

    const store = stores[0] // Use first store

    // Permanently delete store and all associated data
    await shopifyStoreManager.deleteStore(store.id)

    return NextResponse.json({ 
      success: true,
      message: 'Store and all associated data permanently deleted' 
    })
  } catch (error) {
    console.error('Store disconnection error:', error)
    
    if (error instanceof APIError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode || 500 }
      )
    }

    if (error instanceof ShopifyError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to disconnect store' },
      { status: 500 }
    )
  }
}
// Contacts sync API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { contactManager } from '@/lib/contacts/contact-service'
import { shopifyStoreManager } from '@/lib/shopify/store-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shop } = body
    
    let storeId: string
    
    if (shop) {
      // Shopify app request
      const store = await shopifyStoreManager.getStoreByDomain(shop)
      if (!store) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        )
      }
      storeId = store.id
    } else {
      // Web app request
      const user = await authServer.requireAuth()
      const stores = await shopifyStoreManager.getStoresForUser(user.id)
      if (stores.length === 0) {
        return NextResponse.json(
          { error: 'No store connected' },
          { status: 404 }
        )
      }
      const store = stores[0] // Use first store
      storeId = store.id
    }

    // Sync contacts from Shopify
    const syncResult = await contactManager.syncFromShopify(storeId)

    return NextResponse.json({
      success: true,
      imported: syncResult.imported,
      updated: syncResult.updated,
      total: syncResult.total
    })
  } catch (error) {
    console.error('Failed to sync contacts:', error)
    return NextResponse.json(
      { error: 'Failed to sync contacts' },
      { status: 500 }
    )
  }
}
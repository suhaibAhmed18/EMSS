// Shopify OAuth callback endpoint
import { NextRequest, NextResponse } from 'next/server'
import { shopifyOAuth } from '@/lib/shopify/oauth'
import { ShopifyClient } from '@/lib/shopify/client'
import { databaseService } from '@/lib/database/service'
import { OAuthError, ShopifyError } from '@/lib/shopify/types'

export async function GET(request: NextRequest) {
  console.log('🔄 Shopify OAuth callback called')
  
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract OAuth callback parameters
    const shop = searchParams.get('shop')
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const hmac = searchParams.get('hmac')
    const timestamp = searchParams.get('timestamp')

    console.log('📝 OAuth callback parameters:', {
      shop: shop ? 'Present' : 'Missing',
      code: code ? 'Present' : 'Missing',
      state: state ? 'Present' : 'Missing',
      hmac: hmac ? 'Present' : 'Missing',
      timestamp: timestamp ? 'Present' : 'Missing'
    })

    // Validate required parameters
    if (!shop || !code) {
      console.log('❌ Missing required OAuth parameters')
      return NextResponse.redirect(
        new URL('/stores/connect?error=oauth_failed&details=missing_parameters', request.url)
      )
    }

    // Verify state parameter and extract user ID
    if (!state) {
      console.log('❌ Missing state parameter')
      return NextResponse.redirect(
        new URL('/stores/connect?error=oauth_failed&details=missing_state', request.url)
      )
    }

    const stateData = shopifyOAuth.verifyState(state)
    if (!stateData) {
      console.log('❌ Invalid or expired state parameter')
      return NextResponse.redirect(
        new URL('/stores/connect?error=oauth_failed&details=invalid_state', request.url)
      )
    }

    console.log('👤 State verified for user:', stateData.userId)

    // Check if user already has a store connected (enforce one store limit)
    const existingStores = await databaseService.getStoresByUserId(stateData.userId)
    if (existingStores.length > 0) {
      console.log('⚠️ User already has a store connected')
      return NextResponse.redirect(
        new URL('/stores?error=limit_reached&details=only_one_store_allowed', request.url)
      )
    }

    // Exchange authorization code for access token
    console.log('🔑 Exchanging code for access token...')
    const tokenData = await shopifyOAuth.exchangeCodeForToken(shop, code)
    console.log('✅ Access token received, scopes:', tokenData.scope)

    // Create Shopify client to fetch store information
    const shopifyClient = new ShopifyClient(shop.replace('.myshopify.com', ''), tokenData.access_token)
    
    // Get store information
    console.log('🏪 Fetching store information...')
    const shopData = await shopifyClient.getShop() as any
    console.log('✅ Store data fetched:', shopData.shop?.name || 'Unknown')

    // Create or update store in database
    console.log('💾 Saving store to database...')
    const storeData = {
      shop_domain: shop,
      access_token: tokenData.access_token,
      scopes: tokenData.scope.split(','),
      user_id: stateData.userId,
      store_name: shopData.shop?.name || shop.replace('.myshopify.com', ''),
      store_email: shopData.shop?.email || `admin@${shop}`,
      currency: shopData.shop?.currency || 'USD',
      timezone: shopData.shop?.timezone || 'UTC',
      plan_name: shopData.shop?.plan_name || 'basic',
      is_active: true,
      settings: {
        oauth_completed: true,
        connected_at: new Date().toISOString(),
        real_shopify_connection: true,
        shopify_data: {
          id: shopData.shop?.id,
          domain: shopData.shop?.domain,
          country: shopData.shop?.country,
          province: shopData.shop?.province,
          city: shopData.shop?.city
        }
      }
    }

    // Check if store already exists
    const existingStore = existingStores.find(s => s.shop_domain === shop)

    let store
    if (existingStore) {
      console.log('🔄 Updating existing store...')
      store = await databaseService.updateStore(existingStore.id, storeData)
    } else {
      console.log('🆕 Creating new store...')
      store = await databaseService.createStore(storeData)
    }

    console.log('✅ Store saved successfully:', store.id)

    // Set up webhooks for real-time data sync
    console.log('🔗 Setting up webhooks...')
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
      await shopifyClient.subscribeToWebhooks(baseUrl)
      console.log('✅ Webhooks configured successfully')
    } catch (webhookError) {
      console.error('⚠️ Webhook setup failed (non-critical):', webhookError)
      // Don't fail the entire flow if webhooks fail
    }

    // Import initial customer data
    console.log('👥 Importing customer data...')
    try {
      await importShopifyCustomers(store.id, shopifyClient)
      console.log('✅ Customer data imported successfully')
    } catch (importError) {
      console.error('⚠️ Customer import failed (non-critical):', importError)
      // Don't fail the entire flow if import fails
    }

    // Redirect to success page
    const redirectUrl = new URL(`/dashboard`, request.url)
    redirectUrl.searchParams.set('connected', shop)
    redirectUrl.searchParams.set('status', 'success')
    redirectUrl.searchParams.set('message', 'Store connected successfully! Your Shopify data is being imported.')
    
    console.log('🎉 OAuth flow completed successfully, redirecting to dashboard')
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ Shopify OAuth callback error:', error)
    
    let errorCode = 'oauth_failed'
    let errorMessage = 'OAuth authentication failed'
    
    if (error instanceof OAuthError) {
      errorCode = 'oauth_error'
      errorMessage = error.message
    } else if (error instanceof ShopifyError) {
      errorCode = 'shopify_error'
      errorMessage = error.message
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.redirect(
      new URL(`/stores/connect?error=${errorCode}&details=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}

// Helper function to import customers from Shopify
async function importShopifyCustomers(storeId: string, shopifyClient: ShopifyClient) {
  try {
    console.log('📥 Starting customer import from Shopify...')
    
    // Get customers from Shopify (limit to first 250 for initial import)
    const { customers } = await shopifyClient.getCustomers(250)
    console.log(`📊 Found ${customers.length} customers to import`)

    let importedCount = 0
    for (const shopifyCustomer of customers) {
      try {
        const contactData = {
          store_id: storeId,
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
          segments: [], // Will be calculated based on behavior
          last_order_at: (shopifyCustomer as any).last_order_id ? new Date().toISOString() : undefined
        }

        await databaseService.createContact(contactData)
        importedCount++
      } catch (contactError) {
        console.error(`❌ Failed to import customer ${shopifyCustomer.email}:`, contactError)
        // Continue with other customers
      }
    }

    console.log(`✅ Successfully imported ${importedCount}/${customers.length} customers`)
    return importedCount
  } catch (error) {
    console.error('❌ Customer import failed:', error)
    throw error
  }
}
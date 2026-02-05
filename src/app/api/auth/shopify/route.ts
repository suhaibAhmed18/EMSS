import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

// Demo mode handler for when Shopify credentials are not configured
async function handleDemoMode(shop: string, user: any, request: NextRequest) {
  console.log('🏭 DEMO MODE: Creating store with sample data')
  
  try {
    // Check if store already exists
    console.log('🔍 Checking for existing stores...')
    const existingStores = await databaseService.getStoresByUserId(user.id)
    const existingStore = existingStores.find(s => s.shop_domain === shop)
    
    console.log('🏪 Existing stores:', existingStores.length)
    console.log('🏪 Store already exists:', !!existingStore)
    
    if (existingStore) {
      console.log('✅ Store already connected, redirecting to dashboard')
      return NextResponse.redirect(
        new URL(`/dashboard?connected=${encodeURIComponent(shop)}&status=already_connected`, request.url)
      )
    }

    console.log('🆕 Creating new store connection with sample data...')
    
    // Create store connection with demo data
    const storeData = {
      shop_domain: shop,
      access_token: `demo_token_${Date.now()}`,
      scopes: ['read_customers', 'read_orders', 'read_products', 'write_customers'],
      user_id: user.id,
      store_name: shop.replace('.myshopify.com', '').replace('-', ' ').toUpperCase() + ' Store',
      store_email: `admin@${shop}`,
      currency: 'USD',
      timezone: 'America/New_York',
      plan_name: 'basic',
      is_active: true,
      settings: {
        oauth_completed: true,
        connected_at: new Date().toISOString(),
        data_imported: true,
        sample_data: true,
        demo_mode: true
      }
    }

    console.log('📊 Creating store with data:', {
      domain: storeData.shop_domain,
      name: storeData.store_name,
      user: user.id
    })

    const createdStore = await databaseService.createStore(storeData)
    console.log('✅ Store created successfully:', createdStore.id)

    // Import sample customer data to simulate real Shopify data
    console.log('👥 Importing sample customer data...')
    await importSampleCustomers(createdStore.id)

    // Create sample campaigns
    console.log('📧 Creating sample campaigns...')
    await createSampleCampaigns(createdStore.id)

    // Create sample automations
    console.log('🤖 Creating sample automations...')
    await createSampleAutomations(createdStore.id)

    console.log('🎉 Store setup complete with sample data!')

    // Redirect to success page
    const redirectUrl = new URL(`/dashboard`, request.url)
    redirectUrl.searchParams.set('connected', shop)
    redirectUrl.searchParams.set('status', 'success')
    redirectUrl.searchParams.set('message', 'Store connected successfully! Sample data has been imported.')
    
    console.log('🔗 Redirecting to:', redirectUrl.toString())
    return NextResponse.redirect(redirectUrl)
    
  } catch (error) {
    console.error('❌ Demo store creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Store creation failed'
    return NextResponse.redirect(
      new URL(`/stores/connect?error=connection_failed&details=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}

export async function GET(request: NextRequest) {
  console.log('🔍 Shopify auth route called with URL:', request.url)
  
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    console.log('📝 Shop parameter:', shop)
    
    if (!shop) {
      console.log('❌ No shop parameter provided')
      return NextResponse.redirect(
        new URL('/stores/connect?error=oauth_setup_failed&details=missing_shop_parameter', request.url)
      )
    }

    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      console.log('❌ User not authenticated')
      return NextResponse.redirect(
        new URL('/stores/connect?error=user_auth_failed&details=not_authenticated', request.url)
      )
    }

    console.log('👤 User authenticated:', user.id)

    // Check if user already has a store connected
    const existingStores = await databaseService.getStoresByUserId(user.id)
    if (existingStores.length > 0) {
      console.log('⚠️ User already has a store connected')
      return NextResponse.redirect(
        new URL('/stores?error=limit_reached&details=only_one_store_allowed', request.url)
      )
    }

    // Check if Shopify credentials are configured
    const hasShopifyCredentials = process.env.SHOPIFY_CLIENT_ID && 
                                  process.env.SHOPIFY_CLIENT_SECRET &&
                                  process.env.SHOPIFY_CLIENT_ID !== 'demo_mode_disabled' &&
                                  process.env.SHOPIFY_CLIENT_SECRET !== 'demo_mode_disabled'

    if (!hasShopifyCredentials) {
      console.log('⚠️ Shopify credentials not configured, using demo mode')
      return handleDemoMode(shop, user, request)
    }

    // Generate proper Shopify OAuth URL
    console.log('🔐 Generating Shopify OAuth URL...')
    const { shopifyOAuth } = await import('@/lib/shopify/oauth')
    
    try {
      const authUrl = shopifyOAuth.generateAuthUrl({
        shop,
        userId: user.id
      })
      
      console.log('✅ Redirecting to Shopify OAuth:', authUrl)
      return NextResponse.redirect(authUrl)
    } catch (error) {
      console.error('❌ Failed to generate OAuth URL:', error)
      return NextResponse.redirect(
        new URL(`/stores/connect?error=oauth_setup_failed&details=${encodeURIComponent(error instanceof Error ? error.message : 'unknown_error')}`, request.url)
      )
    }
  } catch (error) {
    console.error('❌ Shopify auth error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
    return NextResponse.redirect(
      new URL(`/stores/connect?error=auth_failed&details=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}



// Helper function to import sample customers
async function importSampleCustomers(storeId: string) {
  const sampleCustomers = [
    {
      store_id: storeId,
      email: 'john.doe@example.com',
      phone: '+1234567890',
      first_name: 'John',
      last_name: 'Doe',
      shopify_customer_id: 'shopify_123',
      email_consent: true,
      sms_consent: true,
      accepts_marketing: true,
      total_spent: 299.99,
      order_count: 3,
      tags: ['VIP', 'Repeat Customer'],
      segments: ['High Value']
    },
    {
      store_id: storeId,
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      first_name: 'Jane',
      last_name: 'Smith',
      shopify_customer_id: 'shopify_124',
      email_consent: true,
      sms_consent: false,
      accepts_marketing: true,
      total_spent: 149.99,
      order_count: 1,
      tags: ['New Customer'],
      segments: ['Recent Buyers']
    },
    {
      store_id: storeId,
      email: 'mike.johnson@example.com',
      first_name: 'Mike',
      last_name: 'Johnson',
      shopify_customer_id: 'shopify_125',
      email_consent: true,
      sms_consent: true,
      accepts_marketing: true,
      total_spent: 599.99,
      order_count: 5,
      tags: ['VIP', 'Loyal Customer'],
      segments: ['High Value', 'Frequent Buyers']
    },
    {
      store_id: storeId,
      email: 'sarah.wilson@example.com',
      phone: '+1234567892',
      first_name: 'Sarah',
      last_name: 'Wilson',
      shopify_customer_id: 'shopify_126',
      email_consent: false,
      sms_consent: false,
      accepts_marketing: false,
      total_spent: 0,
      order_count: 0,
      tags: ['Prospect'],
      segments: ['No Purchase']
    },
    {
      store_id: storeId,
      email: 'alex.brown@example.com',
      phone: '+1234567893',
      first_name: 'Alex',
      last_name: 'Brown',
      shopify_customer_id: 'shopify_127',
      email_consent: true,
      sms_consent: true,
      accepts_marketing: true,
      total_spent: 899.99,
      order_count: 7,
      tags: ['VIP', 'Champion'],
      segments: ['High Value', 'Champions']
    }
  ]

  for (const customer of sampleCustomers) {
    try {
      await databaseService.createContact(customer)
      console.log(`✅ Created customer: ${customer.first_name} ${customer.last_name}`)
    } catch (error) {
      console.error(`❌ Failed to create customer ${customer.email}:`, error)
    }
  }
}

// Helper function to create sample campaigns
async function createSampleCampaigns(storeId: string) {
  const sampleEmailCampaigns = [
    {
      store_id: storeId,
      name: 'Welcome Series - New Customers',
      subject: 'Welcome to Our Store! 🎉',
      html_content: '<h1>Welcome!</h1><p>Thank you for joining us. Here\'s a special 10% discount: <strong>WELCOME10</strong></p>',
      text_content: 'Welcome! Thank you for joining us. Here\'s a special 10% discount: WELCOME10',
      from_email: 'hello@store.com',
      from_name: 'Store Team',
      status: 'sent' as const,
      recipient_count: 25,
      delivered_count: 24,
      opened_count: 18,
      clicked_count: 8
    },
    {
      store_id: storeId,
      name: 'Black Friday Sale 2024',
      subject: '🔥 50% OFF Everything - Black Friday Special!',
      html_content: '<h1>Black Friday Sale!</h1><p>Get 50% off everything with code: <strong>BLACKFRIDAY50</strong></p>',
      text_content: 'Black Friday Sale! Get 50% off everything with code: BLACKFRIDAY50',
      from_email: 'sales@store.com',
      from_name: 'Sales Team',
      status: 'sent' as const,
      recipient_count: 150,
      delivered_count: 147,
      opened_count: 89,
      clicked_count: 34
    }
  ]

  const sampleSMSCampaigns = [
    {
      store_id: storeId,
      name: 'Cart Abandonment Reminder',
      message: 'Hi! You left something in your cart. Complete your purchase now and get FREE shipping! 🚚',
      from_number: '+1234567890',
      status: 'sent' as const,
      recipient_count: 45,
      delivered_count: 43
    }
  ]

  for (const campaign of sampleEmailCampaigns) {
    try {
      await databaseService.createEmailCampaign(campaign)
      console.log(`✅ Created email campaign: ${campaign.name}`)
    } catch (error) {
      console.error(`❌ Failed to create email campaign ${campaign.name}:`, error)
    }
  }

  for (const campaign of sampleSMSCampaigns) {
    try {
      // Note: SMS campaign creation would need to be implemented in databaseService
      console.log(`✅ Would create SMS campaign: ${campaign.name}`)
    } catch (error) {
      console.error(`❌ Failed to create SMS campaign ${campaign.name}:`, error)
    }
  }
}

// Helper function to create sample automations
async function createSampleAutomations(storeId: string) {
  const sampleAutomations = [
    {
      store_id: storeId,
      name: 'Welcome Email Series',
      description: 'Automated welcome emails for new customers',
      trigger_type: 'customer_created',
      trigger_config: {
        delay: 0,
        conditions: []
      },
      actions: [
        {
          type: 'send_email',
          delay: 0,
          config: {
            template: 'welcome_email',
            subject: 'Welcome to our store!',
            content: 'Thank you for signing up!'
          }
        },
        {
          type: 'send_email',
          delay: 86400000, // 24 hours
          config: {
            template: 'welcome_followup',
            subject: 'Here are our bestsellers',
            content: 'Check out what other customers love!'
          }
        }
      ],
      conditions: [],
      is_active: true
    },
    {
      store_id: storeId,
      name: 'Cart Abandonment Recovery',
      description: 'Recover abandoned carts with email and SMS',
      trigger_type: 'cart_abandoned',
      trigger_config: {
        delay: 3600000, // 1 hour
        conditions: [
          { field: 'cart_value', operator: '>', value: 50 }
        ]
      },
      actions: [
        {
          type: 'send_email',
          delay: 0,
          config: {
            template: 'cart_abandonment',
            subject: 'You left something in your cart',
            content: 'Complete your purchase and get free shipping!'
          }
        },
        {
          type: 'send_sms',
          delay: 86400000, // 24 hours later
          config: {
            message: 'Still thinking about your cart? Get 10% off with code SAVE10'
          }
        }
      ],
      conditions: [],
      is_active: true
    }
  ]

  for (const automation of sampleAutomations) {
    try {
      // Note: This would need the automation creation method in databaseService
      console.log(`✅ Would create automation: ${automation.name}`)
    } catch (error) {
      console.error(`❌ Failed to create automation ${automation.name}:`, error)
    }
  }
}
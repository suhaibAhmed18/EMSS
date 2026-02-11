#!/usr/bin/env node

/**
 * Create Test Store Script
 * 
 * This script creates a test Shopify store for a user to fix the
 * "No stores connected" error when trying to add contacts.
 * 
 * Usage:
 *   node scripts/create-test-store.js <user-email>
 * 
 * Example:
 *   node scripts/create-test-store.js user@example.com
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestStore(userEmail) {
  try {
    console.log('🔍 Looking up user:', userEmail)
    
    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userEmail)
      console.log('\n💡 Available users:')
      const { data: users } = await supabase
        .from('users')
        .select('id, email, full_name')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (users && users.length > 0) {
        users.forEach(u => console.log(`   - ${u.email} (${u.full_name || 'No name'})`))
      }
      process.exit(1)
    }

    console.log('✅ Found user:', user.full_name || user.email)
    console.log('   User ID:', user.id)

    // Check existing stores
    const { data: existingStores } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)

    if (existingStores && existingStores.length > 0) {
      console.log('\n📊 Existing stores found:', existingStores.length)
      existingStores.forEach(store => {
        console.log(`   - ${store.store_name} (${store.shop_domain})`)
        console.log(`     Active: ${store.is_active}`)
      })

      // Activate inactive stores
      const inactiveStores = existingStores.filter(s => !s.is_active)
      if (inactiveStores.length > 0) {
        console.log('\n🔄 Activating inactive stores...')
        const { error: updateError } = await supabase
          .from('stores')
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('is_active', false)

        if (updateError) {
          console.error('❌ Failed to activate stores:', updateError.message)
        } else {
          console.log('✅ Activated', inactiveStores.length, 'store(s)')
        }
      }

      // Check if we should create a new test store
      const hasActiveStore = existingStores.some(s => s.is_active)
      if (hasActiveStore || inactiveStores.length > 0) {
        console.log('\n✅ User now has active store(s). Try adding contacts again.')
        return
      }
    }

    // Create new test store
    console.log('\n🏪 Creating test store...')
    const testStore = {
      user_id: user.id,
      store_name: 'Test Store',
      shop_domain: `test-store-${Date.now()}.myshopify.com`,
      access_token: `test_token_${Math.random().toString(36).substring(7)}`,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newStore, error: createError } = await supabase
      .from('stores')
      .insert(testStore)
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create store:', createError.message)
      process.exit(1)
    }

    console.log('✅ Test store created successfully!')
    console.log('   Store Name:', newStore.store_name)
    console.log('   Domain:', newStore.shop_domain)
    console.log('   Store ID:', newStore.id)
    console.log('\n✅ You can now add contacts!')

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Main execution
const userEmail = process.argv[2]

if (!userEmail) {
  console.log('Usage: node scripts/create-test-store.js <user-email>')
  console.log('Example: node scripts/create-test-store.js user@example.com')
  process.exit(1)
}

createTestStore(userEmail)

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Read .env.local file
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}

// Handle both \n and \r\n line endings
envContent.split(/\r?\n/).forEach(line => {
  // Skip comments and empty lines
  if (line.trim().startsWith('#') || !line.trim()) return
  
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    const value = match[2].trim()
    envVars[key] = value
  }
})

if (!envVars.NEXT_PUBLIC_SUPABASE_URL || !envVars.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', envVars.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', envVars.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
  process.exit(1)
}

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnose() {
  console.log('🔍 Diagnosing Contact Creation Issue...\n')

  // Check 1: Verify database connection
  console.log('1️⃣ Checking database connection...')
  try {
    const { data, error } = await supabase.from('stores').select('count').single()
    if (error) throw error
    console.log('✅ Database connection successful\n')
  } catch (error) {
    console.log('❌ Database connection failed:', error.message)
    return
  }

  // Check 2: Check if stores exist
  console.log('2️⃣ Checking for stores...')
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('id, display_name, shop_domain, user_id')
  
  if (storesError) {
    console.log('❌ Error fetching stores:', storesError.message)
    return
  }

  if (!stores || stores.length === 0) {
    console.log('❌ NO STORES FOUND')
    console.log('   This is likely the issue!')
    console.log('   Solution: Connect a Shopify store or create a test store\n')
    return
  }

  console.log(`✅ Found ${stores.length} store(s):`)
  stores.forEach(store => {
    console.log(`   - ${store.display_name || store.shop_domain} (${store.shop_domain})`)
    console.log(`     Store ID: ${store.id}`)
    console.log(`     User ID: ${store.user_id}`)
  })
  console.log()

  // Check 3: Verify users exist
  console.log('3️⃣ Checking for users...')
  const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.log('❌ Error fetching users:', usersError.message)
    return
  }

  if (!users || users.users.length === 0) {
    console.log('❌ NO USERS FOUND')
    console.log('   Solution: Create a user account\n')
    return
  }

  console.log(`✅ Found ${users.users.length} user(s):`)
  users.users.forEach(user => {
    console.log(`   - ${user.email}`)
    console.log(`     User ID: ${user.id}`)
  })
  console.log()

  // Check 4: Verify store-user relationships
  console.log('4️⃣ Checking store-user relationships...')
  let orphanedStores = []
  for (const store of stores) {
    const userExists = users.users.find(u => u.id === store.user_id)
    if (!userExists) {
      orphanedStores.push(store)
      console.log(`⚠️  Store "${store.store_name}" has invalid user_id: ${store.user_id}`)
    }
  }

  if (orphanedStores.length > 0) {
    console.log(`\n❌ Found ${orphanedStores.length} orphaned store(s)`)
    console.log('   Solution: Update store user_id to match an existing user\n')
  } else {
    console.log('✅ All stores have valid user associations\n')
  }

  // Check 5: Test contact creation
  console.log('5️⃣ Testing contact creation...')
  const testStore = stores[0]
  const testContact = {
    store_id: testStore.id,
    email: `test-${Date.now()}@example.com`,
    first_name: 'Test',
    last_name: 'User',
    email_consent: true,
    sms_consent: false,
    tags: [],
    segments: ['Test'],
    total_spent: 0,
    order_count: 0
  }

  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert(testContact)
    .select()
    .single()

  if (contactError) {
    console.log('❌ Contact creation failed:', contactError.message)
    console.log('   Error details:', contactError)
    return
  }

  console.log('✅ Contact creation successful!')
  console.log(`   Created: ${newContact.first_name} ${newContact.last_name} (${newContact.email})`)
  console.log(`   Contact ID: ${newContact.id}\n`)

  // Clean up test contact
  await supabase.from('contacts').delete().eq('id', newContact.id)
  console.log('🧹 Cleaned up test contact\n')

  // Summary
  console.log('📊 DIAGNOSIS SUMMARY')
  console.log('='.repeat(50))
  console.log(`Stores: ${stores.length}`)
  console.log(`Users: ${users.users.length}`)
  console.log(`Orphaned Stores: ${orphanedStores.length}`)
  console.log(`Contact Creation: ${contactError ? '❌ Failed' : '✅ Working'}`)
  console.log('='.repeat(50))

  if (orphanedStores.length === 0 && !contactError) {
    console.log('\n✅ Everything looks good!')
    console.log('   If you\'re still seeing errors, check:')
    console.log('   1. Browser console for detailed error messages')
    console.log('   2. Network tab to see the actual API response')
    console.log('   3. Make sure you\'re logged in with the correct user')
  }
}

diagnose().catch(console.error)

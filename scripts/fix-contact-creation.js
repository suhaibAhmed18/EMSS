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

async function fixContactCreation() {
  console.log('🔧 Fixing Contact Creation Issues...\n')

  // Step 1: Check for users
  console.log('1️⃣ Checking for users...')
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
  
  if (usersError) {
    console.log('❌ Error fetching users:', usersError.message)
    return
  }

  let users = usersData.users
  console.log(`Found ${users.length} user(s)`)

  // If no users, create one
  if (users.length === 0) {
    console.log('Creating a test user...')
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'Admin123!@#',
      email_confirm: true
    })

    if (createUserError) {
      console.log('❌ Failed to create user:', createUserError.message)
      return
    }

    users = [newUser.user]
    console.log('✅ Created user: admin@example.com')
  }

  const user = users[0]
  console.log(`Using user: ${user.email} (${user.id})\n`)

  // Step 2: Check for stores
  console.log('2️⃣ Checking for stores...')
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*')
  
  if (storesError) {
    console.log('❌ Error fetching stores:', storesError.message)
    return
  }

  console.log(`Found ${stores.length} store(s)`)

  // If no stores, create one
  if (stores.length === 0) {
    console.log('Creating a test store...')
    const { data: newStore, error: createStoreError } = await supabase
      .from('stores')
      .insert({
        user_id: user.id,
        display_name: 'Test Store',
        shop_domain: 'test-store.myshopify.com',
        access_token: 'test_token',
        scopes: ['read_customers', 'write_customers'],
        is_active: true
      })
      .select()
      .single()

    if (createStoreError) {
      console.log('❌ Failed to create store:', createStoreError.message)
      return
    }

    console.log('✅ Created test store')
    stores.push(newStore)
  }

  // Step 3: Fix orphaned stores
  console.log('\n3️⃣ Fixing orphaned stores...')
  let fixedCount = 0
  for (const store of stores) {
    const userExists = users.find(u => u.id === store.user_id)
    if (!userExists) {
      console.log(`Fixing store: ${store.display_name || store.shop_domain}`)
      const { error: updateError } = await supabase
        .from('stores')
        .update({ user_id: user.id })
        .eq('id', store.id)

      if (updateError) {
        console.log(`❌ Failed to update store: ${updateError.message}`)
      } else {
        console.log(`✅ Updated store user_id to ${user.id}`)
        fixedCount++
      }
    }
  }

  if (fixedCount > 0) {
    console.log(`\n✅ Fixed ${fixedCount} orphaned store(s)`)
  } else {
    console.log('✅ No orphaned stores found')
  }

  // Step 4: Test contact creation
  console.log('\n4️⃣ Testing contact creation...')
  const testContact = {
    store_id: stores[0].id,
    email: `test-${Date.now()}@example.com`,
    first_name: 'Test',
    last_name: 'Contact',
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
    console.log('❌ Contact creation test failed:', contactError.message)
    console.log('   Error details:', contactError)
    return
  }

  console.log('✅ Contact creation test successful!')
  console.log(`   Created: ${newContact.first_name} ${newContact.last_name}`)

  // Clean up test contact
  await supabase.from('contacts').delete().eq('id', newContact.id)
  console.log('🧹 Cleaned up test contact')

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('✅ ALL FIXES APPLIED SUCCESSFULLY!')
  console.log('='.repeat(50))
  console.log('\nYou can now:')
  console.log(`1. Login with: ${user.email}`)
  if (user.email === 'admin@example.com') {
    console.log('   Password: Admin123!@#')
  }
  console.log('2. Navigate to the Contacts page')
  console.log('3. Try adding a new contact')
  console.log('\nIf you still see errors, check the browser console for details.')
}

fixContactCreation().catch(console.error)

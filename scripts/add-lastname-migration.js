const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    console.log('🚀 Running lastname migration...')
    
    // First, check if the column already exists by trying to select it
    console.log('🔍 Checking if lastname column already exists...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('lastname')
      .limit(1)
    
    if (!testError) {
      console.log('✅ Column "lastname" already exists!')
      console.log('Migration already applied, nothing to do.')
      return
    }
    
    console.log('📝 Column does not exist, will need to be added manually.')
    console.log('\n⚠️  IMPORTANT: Please run the following SQL in your Supabase SQL Editor:')
    console.log('\n' + '='.repeat(60))
    console.log('-- Add lastname column to users table')
    console.log('ALTER TABLE users ADD COLUMN lastname VARCHAR(255);')
    console.log('')
    console.log('-- Create index for faster lastname lookups')
    console.log('CREATE INDEX idx_users_lastname ON users(lastname);')
    console.log('='.repeat(60))
    console.log('\nSteps:')
    console.log('1. Go to your Supabase Dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the SQL above')
    console.log('4. Click "Run" to execute')
    console.log('\nAlternatively, the migration file is located at:')
    console.log('supabase/migrations/003_add_lastname_to_users.sql')
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

runMigration()

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function runMigration() {
  try {
    // Get SQL file path from command line argument
    const sqlFilePath = process.argv[2]
    
    if (!sqlFilePath) {
      console.error('❌ Please provide a SQL file path')
      console.log('Usage: node scripts/run-migration.js <path-to-sql-file>')
      console.log('Example: node scripts/run-migration.js scripts/add-stripe-subscription-field.sql')
      process.exit(1)
    }
    
    const fullPath = path.resolve(sqlFilePath)
    
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ SQL file not found: ${fullPath}`)
      process.exit(1)
    }
    
    console.log(`🚀 Running migration: ${path.basename(sqlFilePath)}...`)
    
    // Read the migration file
    const migrationSQL = fs.readFileSync(fullPath, 'utf8')
    
    console.log('📄 SQL to execute:')
    console.log(migrationSQL)
    console.log('')
    
    // Execute the migration using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      console.error('❌ Migration failed:', error)
      process.exit(1)
    }
    
    console.log('✅ Migration completed successfully!')
    
  } catch (error) {
    console.error('❌ Migration error:', error)
    process.exit(1)
  }
}

runMigration()
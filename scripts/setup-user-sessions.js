const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables manually
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  line = line.trim()
  if (line && !line.startsWith('#')) {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      envVars[match[1].trim()] = match[2].trim()
    }
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Key:', supabaseServiceKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupUserSessions() {
  try {
    console.log('🔧 Setting up user_sessions table...')
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-user-sessions-table-now.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
        
        if (error) {
          // Try direct execution if RPC fails
          console.log('Trying direct execution...')
          const { error: directError } = await supabase.from('_sql').insert({ query: statement })
          
          if (directError) {
            console.error('⚠️  Statement failed (may already exist):', statement.substring(0, 100))
          }
        }
      }
    }
    
    console.log('✅ User sessions table setup complete!')
    
    // Verify the table exists
    const { data, error } = await supabase
      .from('user_sessions')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Table verification failed:', error.message)
      console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:')
      console.log(sql)
    } else {
      console.log('✅ Table verified successfully!')
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    console.log('\n📝 Please run the SQL file manually in Supabase SQL Editor:')
    console.log('   scripts/create-user-sessions-table-now.sql')
    process.exit(1)
  }
}

setupUserSessions()

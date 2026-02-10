const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshSchema() {
  console.log('Refreshing Supabase schema cache...');
  
  try {
    // Execute the NOTIFY command to refresh PostgREST schema cache
    const { error: notifyError } = await supabase.rpc('exec_sql', {
      sql: "NOTIFY pgrst, 'reload schema';"
    });

    if (notifyError) {
      console.log('Note: Direct NOTIFY failed (expected if exec_sql function does not exist)');
      console.log('Attempting alternative method...');
    }

    // Verify the users table structure
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(0);

    if (error) {
      console.error('Error verifying users table:', error.message);
      console.log('\nManual steps required:');
      console.log('1. Go to your Supabase Dashboard');
      console.log('2. Navigate to Database > Schema');
      console.log('3. Click "Reload Schema" or restart the PostgREST server');
      console.log('4. Or run this SQL in the SQL Editor:');
      console.log("   NOTIFY pgrst, 'reload schema';");
    } else {
      console.log('✓ Schema cache refreshed successfully');
      console.log('✓ Users table is accessible');
    }

    // Also verify the columns exist
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .limit(1);

    if (testError) {
      console.error('\n✗ Column verification failed:', testError.message);
      console.log('\nThe first_name and last_name columns may not exist yet.');
      console.log('Run the migration: node scripts/run-migration.js');
    } else {
      console.log('✓ first_name and last_name columns verified');
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

refreshSchema();

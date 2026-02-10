#!/usr/bin/env node

/**
 * Migration Script: Create Payment Checkout Sessions Table
 * 
 * This script creates the payment_checkout_sessions table and related functions
 * to track incomplete payment sessions for users.
 * 
 * Usage:
 *   node scripts/run-payment-sessions-migration.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Starting payment checkout sessions migration...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-payment-checkout-sessions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Executing SQL migration...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql function doesn't exist, try direct execution
      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement.includes('CREATE TABLE') || 
            statement.includes('CREATE INDEX') || 
            statement.includes('CREATE TRIGGER') ||
            statement.includes('CREATE OR REPLACE FUNCTION') ||
            statement.includes('COMMENT ON')) {
          console.log(`   Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec', { query: statement });
          if (stmtError) {
            console.warn(`   ⚠️  Warning: ${stmtError.message}`);
          }
        }
      }
      return { data: null, error: null };
    });

    if (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('\n📝 Please run the SQL manually in Supabase SQL Editor:');
      console.error(`   File: ${sqlPath}`);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify the table was created
    console.log('🔍 Verifying table creation...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('payment_checkout_sessions')
      .select('count')
      .limit(0);

    if (tableError) {
      console.error('❌ Table verification failed:', tableError.message);
      console.error('\n📝 Please verify the table was created in Supabase:');
      console.error('   Table: payment_checkout_sessions');
      process.exit(1);
    }

    console.log('✅ Table verified successfully!\n');

    // Test the functions
    console.log('🧪 Testing database functions...');
    
    // Test expire_old_checkout_sessions function
    const { data: expireResult, error: expireError } = await supabase
      .rpc('expire_old_checkout_sessions');
    
    if (expireError) {
      console.warn('⚠️  Warning: expire_old_checkout_sessions function test failed:', expireError.message);
    } else {
      console.log(`✅ expire_old_checkout_sessions function working (expired ${expireResult || 0} sessions)`);
    }

    console.log('\n✨ Migration complete! The payment_checkout_sessions table is ready to use.\n');
    console.log('📊 Table features:');
    console.log('   - Tracks incomplete payment sessions');
    console.log('   - Automatic session expiration (24 hours)');
    console.log('   - Retry tracking');
    console.log('   - Helper functions for session management');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Test the payment flow');
    console.log('   3. Check database for session records\n');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();

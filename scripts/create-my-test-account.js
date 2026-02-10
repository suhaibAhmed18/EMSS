#!/usr/bin/env node

/**
 * Create Test Account with Your Email
 * 
 * Creates a test account with suhaiby9800@gmail.com
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load environment variables
const fs = require('fs');
const path = require('path');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=');
        if (key && value) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    console.error('⚠️  Could not load .env.local file');
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Your account credentials
const TEST_EMAIL = 'suhaiby9800@gmail.com';
const TEST_PASSWORD = 'Test123456';
const TEST_FIRST_NAME = 'Suhaib';
const TEST_LAST_NAME = 'User';

// Hash password using SHA256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createTestUser() {
  console.log('🚀 Creating test account for: ' + TEST_EMAIL + '\n');

  try {
    // Delete existing user if exists
    console.log('🗑️  Removing existing account (if any)...');
    await supabase
      .from('users')
      .delete()
      .eq('email', TEST_EMAIL);

    // Create new test user
    console.log('👤 Creating new account...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: TEST_EMAIL,
        first_name: TEST_FIRST_NAME,
        last_name: TEST_LAST_NAME,
        name: `${TEST_FIRST_NAME} ${TEST_LAST_NAME}`,
        password_hash: hashPassword(TEST_PASSWORD),
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        subscription_status: 'active',
        subscription_plan: 'professional',
        subscription_start_date: new Date().toISOString(),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_customer_id: 'cus_test_' + Date.now(),
        stripe_subscription_id: 'sub_test_' + Date.now(),
        telnyx_phone_number: '+15551234567',
        payment_method: 'stripe',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    console.log('✅ Account created successfully!\n');

    console.log('='.repeat(60));
    console.log('✨ YOUR TEST ACCOUNT IS READY!');
    console.log('='.repeat(60));
    console.log('\n📋 Login Credentials:');
    console.log(`   Email:    ${TEST_EMAIL}`);
    console.log(`   Password: ${TEST_PASSWORD}`);
    console.log('\n🔗 Login URL:');
    console.log(`   http://localhost:3000/auth/login`);
    console.log('\n📊 Account Details:');
    console.log(`   Name:         ${TEST_FIRST_NAME} ${TEST_LAST_NAME}`);
    console.log(`   Plan:         Professional`);
    console.log(`   Status:       Active`);
    console.log(`   Email:        Verified ✓`);
    console.log(`   User ID:      ${user.id}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Go to http://localhost:3000/auth/login');
    console.log('   2. Enter:');
    console.log(`      Email: ${TEST_EMAIL}`);
    console.log(`      Password: ${TEST_PASSWORD}`);
    console.log('   3. Click "Sign in"');
    console.log('   4. You will be redirected to the dashboard!');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();

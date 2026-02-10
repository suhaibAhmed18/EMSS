#!/usr/bin/env node

/**
 * Create Test User Script
 * 
 * Creates a test account that can login to the dashboard
 * 
 * Usage:
 *   node scripts/create-test-user.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
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

// Test account credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456';
const TEST_FIRST_NAME = 'Test';
const TEST_LAST_NAME = 'User';

// Hash password using SHA256 (same as your auth system)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createTestUser() {
  console.log('🚀 Creating test account...\n');

  try {
    // Delete existing test user if exists
    console.log('🗑️  Removing existing test account (if any)...');
    await supabase
      .from('users')
      .delete()
      .eq('email', TEST_EMAIL);

    // Create new test user
    console.log('👤 Creating new test user...');
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
        stripe_customer_id: 'cus_test_123456',
        stripe_subscription_id: 'sub_test_123456',
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

    console.log('✅ Test user created successfully!');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email Verified: ${user.email_verified}`);
    console.log(`   Subscription Status: ${user.subscription_status}`);

    // Verify the user was created correctly
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, email, email_verified, subscription_status, subscription_plan')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.warn('⚠️  Warning: Could not verify user creation:', verifyError.message);
    } else {
      console.log('\n🔍 Verification Check:');
      console.log(`   Email Verified in DB: ${verifyUser.email_verified}`);
      console.log(`   Subscription Status: ${verifyUser.subscription_status}`);
      console.log(`   Subscription Plan: ${verifyUser.subscription_plan}`);
    }

    // Create SMS settings
    console.log('📱 Creating SMS settings...');
    const { error: smsError } = await supabase
      .from('sms_settings')
      .insert({
        user_id: user.id,
        keyword: 'JOIN',
        sender_name: 'TESTINGAPP',
        quiet_hours_enabled: false,
        quiet_hours_start: '00:00',
        quiet_hours_end: '00:00',
        daily_limit: 400,
        timezone: 'America/New_York',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (smsError && smsError.code !== '23505') { // Ignore duplicate key errors
      console.warn('⚠️  Warning: Could not create SMS settings:', smsError.message);
    } else {
      console.log('✅ SMS settings created');
    }

    // Create shared email address
    console.log('📧 Creating shared email address...');
    const { error: emailError } = await supabase
      .from('sender_email_addresses')
      .insert({
        user_id: user.id,
        email: 'Shared Sendra Email',
        status: 'Verified',
        verified_on: new Date().toISOString(),
        is_shared: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (emailError && emailError.code !== '23505') {
      console.warn('⚠️  Warning: Could not create email address:', emailError.message);
    } else {
      console.log('✅ Shared email address created');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✨ TEST ACCOUNT READY!');
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
    console.log(`   Phone:        ${user.telnyx_phone_number}`);
    console.log(`   User ID:      ${user.id}`);
    console.log('\n💡 Next Steps:');
    console.log('   1. Go to http://localhost:3000/auth/login');
    console.log('   2. Enter the credentials above');
    console.log('   3. You will be redirected to the dashboard');
    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error creating test account:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure the database tables exist');
    console.error('2. Run: scripts/create-settings-tables.sql');
    console.error('3. Check your .env.local file has correct credentials');
    process.exit(1);
  }
}

// Run the script
createTestUser();

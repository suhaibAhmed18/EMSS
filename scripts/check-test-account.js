#!/usr/bin/env node

/**
 * Check Test Account Script
 * 
 * Checks the status of the test account and diagnoses issues
 * 
 * Usage:
 *   node scripts/check-test-account.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_EMAIL = 'test@example.com';

async function checkTestAccount() {
  console.log('🔍 Checking test account status...\n');

  try {
    // Check if user exists
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', TEST_EMAIL)
      .single();

    if (error || !user) {
      console.log('❌ Test account not found!');
      console.log('\n💡 Solution: Create the test account');
      console.log('   Run: npm run create-test-user\n');
      return;
    }

    console.log('✅ Test account found!\n');
    console.log('📊 Account Details:');
    console.log('='.repeat(60));
    console.log(`Email:              ${user.email}`);
    console.log(`Name:               ${user.first_name} ${user.last_name}`);
    console.log(`User ID:            ${user.id}`);
    console.log(`Email Verified:     ${user.email_verified ? '✅ YES' : '❌ NO'}`);
    console.log(`Subscription:       ${user.subscription_status}`);
    console.log(`Plan:               ${user.subscription_plan}`);
    console.log(`Phone Number:       ${user.telnyx_phone_number || 'Not assigned'}`);
    console.log(`Created:            ${new Date(user.created_at).toLocaleString()}`);
    console.log('='.repeat(60));

    // Check for issues
    const issues = [];
    const fixes = [];

    if (!user.email_verified) {
      issues.push('❌ Email not verified');
      fixes.push('Run: node scripts/fix-test-account-verification.sql in Supabase');
    }

    if (user.subscription_status !== 'active') {
      issues.push(`❌ Subscription not active (${user.subscription_status})`);
      fixes.push('Run: npm run create-test-user (to recreate with active subscription)');
    }

    if (!user.telnyx_phone_number) {
      issues.push('⚠️  No phone number assigned');
      fixes.push('Phone number will be assigned on first login');
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Issues Found:');
      issues.forEach(issue => console.log(`   ${issue}`));
      
      console.log('\n🔧 How to Fix:');
      fixes.forEach((fix, i) => console.log(`   ${i + 1}. ${fix}`));
    } else {
      console.log('\n✅ Account is ready to use!');
      console.log('\n🔗 Login at: http://localhost:3000/auth/login');
      console.log('   Email:    test@example.com');
      console.log('   Password: Test123456');
    }

    // Check SMS settings
    const { data: smsSettings } = await supabase
      .from('sms_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (smsSettings) {
      console.log('\n📱 SMS Settings: ✅ Configured');
    } else {
      console.log('\n📱 SMS Settings: ⚠️  Not configured (will be created on first use)');
    }

    // Check email addresses
    const { data: emailAddresses } = await supabase
      .from('sender_email_addresses')
      .select('*')
      .eq('user_id', user.id);

    if (emailAddresses && emailAddresses.length > 0) {
      console.log(`📧 Email Addresses: ✅ ${emailAddresses.length} configured`);
    } else {
      console.log('📧 Email Addresses: ⚠️  None configured (will use shared email)');
    }

    console.log('\n' + '='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error checking account:', error);
  }
}

checkTestAccount();

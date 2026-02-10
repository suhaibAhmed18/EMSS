#!/usr/bin/env node

/**
 * Delete User Script
 * 
 * Usage: node scripts/delete-user.js email@example.com
 */

const { createClient } = require('@supabase/supabase-js');
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

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address:');
  console.error('   node scripts/delete-user.js email@example.com');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log(`🗑️  Deleting user: ${email}\n`);
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } else {
    console.log('✅ User deleted successfully!');
    console.log(`\nYou can now register again with: ${email}`);
  }
})();

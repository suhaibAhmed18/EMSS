# Test Account Setup

## Quick Start

Create a test account that can login to the dashboard in 2 ways:

### Option 1: Using Node.js Script (Recommended)

```bash
node scripts/create-test-user.js
```

This will:
- ✅ Create a test user with verified email
- ✅ Set up active Professional subscription
- ✅ Configure SMS settings
- ✅ Add shared email address
- ✅ Assign Telnyx phone number

### Option 2: Using SQL Script

1. Open Supabase SQL Editor
2. Copy contents of `scripts/create-test-account.sql`
3. Paste and execute

## Test Account Credentials

```
Email:    test@example.com
Password: Test123456
```

## Login

1. Go to: `http://localhost:3000/auth/login`
2. Enter credentials above
3. Click "Sign in"
4. You'll be redirected to `/dashboard`

## Account Details

- **Name**: Test User
- **Plan**: Professional
- **Status**: Active
- **Email Verified**: ✓ Yes
- **Phone Number**: +15551234567
- **Subscription**: Active until 1 year from creation

## What You Can Access

With this test account, you can:

✅ **Dashboard** - View analytics and overview
✅ **Contacts** - Manage customer contacts
✅ **Campaigns** - Create email and SMS campaigns
✅ **Automations** - Set up automated workflows
✅ **Analytics** - View campaign performance
✅ **Settings** - Configure all settings
  - Pricing and usage
  - Domains
  - Email addresses
  - SMS settings
  - Saved templates

## Troubleshooting

### "Invalid credentials" error

**Solution**: Make sure you ran the script successfully. Check the output for any errors.

### "Email verification required" error

**Solution**: The script sets `email_verified: true`. If you still see this, re-run the script.

### "Payment required" error

**Solution**: The script sets `subscription_status: 'active'`. Re-run the script to fix.

### Script fails with database error

**Solution**: Make sure all tables exist. Run these migrations first:
```bash
# In Supabase SQL Editor:
1. scripts/create-settings-tables.sql
2. scripts/create-test-account.sql
```

## Resetting the Test Account

To reset the test account, just run the script again:

```bash
node scripts/create-test-user.js
```

It will delete the old account and create a fresh one.

## Creating Additional Test Accounts

To create more test accounts, modify the script:

```javascript
// In scripts/create-test-user.js
const TEST_EMAIL = 'another@example.com';
const TEST_PASSWORD = 'AnotherPassword123';
const TEST_FIRST_NAME = 'Another';
const TEST_LAST_NAME = 'User';
```

Then run:
```bash
node scripts/create-test-user.js
```

## Security Note

⚠️ **Important**: This is a TEST account only!

- Do NOT use in production
- Password is intentionally simple for testing
- Delete test accounts before deploying to production

## Verification

After creating the account, verify it works:

```sql
-- Check user exists
SELECT email, email_verified, subscription_status, subscription_plan 
FROM users 
WHERE email = 'test@example.com';

-- Should return:
-- email: test@example.com
-- email_verified: true
-- subscription_status: active
-- subscription_plan: professional
```

## Quick Test Checklist

- [ ] Run `node scripts/create-test-user.js`
- [ ] See success message with credentials
- [ ] Go to `http://localhost:3000/auth/login`
- [ ] Enter `test@example.com` / `Test123456`
- [ ] Click "Sign in"
- [ ] Redirected to `/dashboard`
- [ ] Can navigate to all pages
- [ ] Can access `/settings`
- [ ] All settings tabs work

## Support

If you encounter issues:

1. Check the script output for errors
2. Verify database tables exist
3. Check `.env.local` has correct Supabase credentials
4. Try running the SQL script manually in Supabase
5. Check browser console for errors

## Example Output

When successful, you'll see:

```
🚀 Creating test account...

🗑️  Removing existing test account (if any)...
👤 Creating new test user...
✅ Test user created successfully!
   User ID: 12345678-1234-1234-1234-123456789abc
📱 Creating SMS settings...
✅ SMS settings created
📧 Creating shared email address...
✅ Shared email address created

============================================================
✨ TEST ACCOUNT READY!
============================================================

📋 Login Credentials:
   Email:    test@example.com
   Password: Test123456

🔗 Login URL:
   http://localhost:3000/auth/login

📊 Account Details:
   Name:         Test User
   Plan:         Professional
   Status:       Active
   Email:        Verified ✓
   Phone:        +15551234567
   User ID:      12345678-1234-1234-1234-123456789abc

💡 Next Steps:
   1. Go to http://localhost:3000/auth/login
   2. Enter the credentials above
   3. You will be redirected to the dashboard

============================================================
```

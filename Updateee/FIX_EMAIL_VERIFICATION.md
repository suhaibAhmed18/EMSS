# Fix "Please verify your email" Error

## Quick Fix (Choose One)

### Option 1: Check Account Status (Recommended)

```bash
npm run check-test-account
```

This will:
- ✅ Show account status
- ✅ Identify issues
- ✅ Suggest fixes

### Option 2: Recreate Account

```bash
npm run create-test-user
```

This will delete and recreate the account with:
- ✅ Email verified
- ✅ Active subscription
- ✅ All settings configured

### Option 3: Manual SQL Fix

Run in Supabase SQL Editor:

```sql
UPDATE users 
SET 
  email_verified = true,
  email_verified_at = NOW(),
  subscription_status = 'active'
WHERE email = 'test@example.com';
```

## Verify the Fix

After applying any fix:

1. **Check status:**
   ```bash
   npm run check-test-account
   ```

2. **Try logging in:**
   - Go to: http://localhost:3000/auth/login
   - Email: `test@example.com`
   - Password: `Test123456`

3. **Should see:** Dashboard (not verification error)

## Common Issues & Solutions

### Issue: "Please verify your email"

**Cause:** `email_verified` is `false` in database

**Fix:**
```bash
npm run create-test-user
```

### Issue: "Payment required"

**Cause:** `subscription_status` is not `'active'`

**Fix:**
```bash
npm run create-test-user
```

### Issue: Account doesn't exist

**Cause:** Test account was never created

**Fix:**
```bash
npm run create-test-user
```

### Issue: Wrong password

**Cause:** Password was changed or account corrupted

**Fix:**
```bash
npm run create-test-user
```

## Diagnostic Commands

### Check if account exists
```bash
npm run check-test-account
```

### View account in database
```sql
SELECT 
  email,
  email_verified,
  subscription_status,
  subscription_plan
FROM users 
WHERE email = 'test@example.com';
```

### Expected values
```
email_verified:       true
subscription_status:  active
subscription_plan:    professional
```

## Prevention

To avoid this issue in the future:

1. **Always use the script:**
   ```bash
   npm run create-test-user
   ```

2. **Don't manually modify the test account** in the database

3. **If you need to reset**, just run the script again

## Still Having Issues?

### Step 1: Check environment variables
```bash
# Make sure these are set in .env.local:
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Step 2: Check database tables exist
```sql
-- Run in Supabase SQL Editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'users';
```

### Step 3: Check server logs
```bash
# Start dev server with logs:
npm run dev

# Look for login errors in console
```

### Step 4: Clear browser data
1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Try logging in again

## Quick Test

After fixing, test the complete flow:

```bash
# 1. Check account
npm run check-test-account

# 2. Should show:
#    ✅ Email Verified: YES
#    ✅ Subscription: active
#    ✅ Account is ready to use!

# 3. Login
# Go to: http://localhost:3000/auth/login
# Email: test@example.com
# Password: Test123456

# 4. Should redirect to: /dashboard
```

## Files for Reference

- `scripts/create-test-user.js` - Creates test account
- `scripts/check-test-account.js` - Checks account status
- `scripts/fix-test-account-verification.sql` - Manual SQL fix
- `scripts/create-test-account.sql` - Alternative SQL creation

## Summary

**Most Common Fix:**
```bash
npm run create-test-user
```

This recreates the account with all correct settings and should resolve 99% of issues.

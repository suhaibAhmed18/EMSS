# Upgrade Plan Fix Summary

## Problem
The upgrade plan button in the Pricing and Usage settings page was not working properly.

## Root Causes Identified

1. **Invalid Stripe API Version**
   - Using future date `2026-01-28.clover` which doesn't exist
   - Stripe API calls would fail silently

2. **Insufficient Error Logging**
   - No visibility into where the upgrade flow was failing
   - Hard to diagnose issues

3. **Weak Error Handling**
   - Generic error messages didn't help identify the problem
   - No fallback mechanisms

## Fixes Applied

### 1. Fixed Stripe API Version
**File:** `src/lib/payments/stripe.ts`
```typescript
// Before:
apiVersion: '2026-01-28.clover'

// After:
apiVersion: '2024-12-18.acacia'
```

### 2. Added Comprehensive Logging
**Files:** 
- `src/components/SubscriptionUpgradeModal.tsx`
- `src/app/api/subscriptions/upgrade/route.ts`

**What was added:**
- User ID and plan selection logging
- API request/response logging
- Stripe session creation logging
- Redirect attempt logging
- Detailed error messages

### 3. Improved Error Handling
**File:** `src/components/SubscriptionUpgradeModal.tsx`

**Changes:**
- Show specific error messages to users
- Alert with detailed error information
- Better error recovery

### 4. Enhanced Redirect Logic
**File:** `src/components/SubscriptionUpgradeModal.tsx`

**Changes:**
- Primary method: Direct URL redirect (`window.location.href`)
- Fallback method: Stripe.js redirect
- More reliable across browsers

### 5. Created Diagnostic Tools

#### Test Endpoint
**File:** `src/app/api/test-upgrade/route.ts`

Access at: `http://localhost:3000/api/test-upgrade`

**Checks:**
- ✅ Environment variables
- ✅ Supabase connection
- ✅ User authentication
- ✅ User data in database
- ✅ Subscription plans exist
- ✅ Database function exists
- ✅ Stripe API connection

#### Test SQL Script
**File:** `scripts/test-upgrade-function.sql`

**Verifies:**
- Database function exists
- Subscription plans are configured
- User table structure is correct

## How to Test the Fix

### Step 1: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 2: Run Diagnostic Test
```bash
# Open in browser:
http://localhost:3000/api/test-upgrade
```

**Expected Output:**
```json
{
  "checks": {
    "env": { "hasStripeSecretKey": true, ... },
    "supabase": { "connected": true, ... },
    "stripe": { "connected": true, ... }
  },
  "summary": ["✅ All checks passed! Upgrade should work."]
}
```

### Step 3: Test Upgrade Flow
1. Login to your application
2. Navigate to Settings → Pricing and Usage
3. Click "Upgrade Plan" button
4. Open browser console (F12)
5. Select a plan
6. Click "Upgrade Now"
7. Check console logs for detailed flow

**Expected Console Output:**
```
Loading plans for user: [USER_ID]
Plans loaded: [Array of plans]
Starting upgrade to: Professional Price: 49
API response status: 200
API response data: { sessionId: "...", url: "..." }
Redirecting to Stripe URL: https://checkout.stripe.com/...
```

### Step 4: Verify Stripe Redirect
- Should redirect to Stripe checkout page
- Can use test card: 4242 4242 4242 4242
- After payment, redirects back to settings
- Shows success message

## Common Issues & Solutions

### Issue: "All checks passed" but upgrade still fails

**Solution:**
1. Check browser console for JavaScript errors
2. Verify Stripe publishable key is correct
3. Try clearing browser cache
4. Test in incognito/private window

### Issue: Database function not found

**Solution:**
```bash
# Run in Supabase SQL Editor:
\i scripts/add-subscription-upgrade.sql
```

### Issue: No subscription plans

**Solution:**
```sql
-- Run in Supabase SQL Editor:
INSERT INTO subscription_plans (name, description, price, features, is_active)
VALUES 
  ('Starter', 'Perfect for small businesses', 0, 
   '{"email_credits": 5000, "contacts": 1000, "features": ["5,000 emails/month", "1,000 contacts"]}'::jsonb, 
   true),
  ('Professional', 'For growing businesses', 49, 
   '{"email_credits": 50000, "contacts": 10000, "features": ["50,000 emails/month", "10,000 contacts", "Advanced automation"]}'::jsonb, 
   true),
  ('Enterprise', 'For large organizations', 99, 
   '{"email_credits": 500000, "contacts": 100000, "features": ["500,000 emails/month", "100,000 contacts", "Dedicated support"]}'::jsonb, 
   true);
```

### Issue: Stripe API errors

**Solution:**
1. Verify `.env.local` has correct keys:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```
2. Restart dev server after changing .env
3. Test Stripe connection:
   ```bash
   curl https://api.stripe.com/v1/customers \
     -u sk_test_YOUR_KEY:
   ```

## Files Changed

1. ✅ `src/lib/payments/stripe.ts` - Fixed API version
2. ✅ `src/components/SubscriptionUpgradeModal.tsx` - Added logging & improved error handling
3. ✅ `src/app/api/subscriptions/upgrade/route.ts` - Added detailed logging
4. ✅ `src/app/api/test-upgrade/route.ts` - NEW: Diagnostic endpoint
5. ✅ `scripts/test-upgrade-function.sql` - NEW: Database verification script
6. ✅ `UPGRADE_PLAN_TROUBLESHOOTING.md` - NEW: Comprehensive troubleshooting guide
7. ✅ `UPGRADE_PLAN_FIX_SUMMARY.md` - NEW: This file

## Testing Checklist

- [ ] Diagnostic endpoint returns all green checks
- [ ] Modal opens and shows plans
- [ ] Console shows detailed logs
- [ ] Can select a plan
- [ ] "Upgrade Now" redirects to Stripe
- [ ] Can complete test payment
- [ ] Returns to settings with success message
- [ ] Plan is updated in database

## Next Steps

1. **Test the fix** using the steps above
2. **Check console logs** for any remaining errors
3. **Run diagnostic endpoint** to verify all systems
4. **Report back** with results

If issues persist, the console logs and diagnostic output will help identify the exact problem.

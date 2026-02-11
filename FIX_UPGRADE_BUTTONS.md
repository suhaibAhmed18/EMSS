# Fix Upgrade Buttons - Step by Step Guide

## Problem
The "Upgrade Plan" buttons on http://localhost:3000/settings (Pricing and usage section) are not working.

## Solution Overview
I've implemented a robust solution with fallback mechanisms and better error handling. Follow these steps to fix the issue.

---

## Step 1: Check Current Setup

Open your browser and navigate to:
```
http://localhost:3000/api/debug/subscription-setup
```

This will show you what's missing. Look for the `summary.issues` array.

---

## Step 2: Run Database Migrations

### Option A: If you see "No subscription plans found"

Run this in Supabase SQL Editor:
```sql
-- File: scripts/ensure-subscription-plans.sql
```

This will create the Starter, Professional, and Enterprise plans.

### Option B: If you see "RPC function not available"

Run this in Supabase SQL Editor:
```sql
-- File: scripts/create-upgrade-function.sql
```

This creates the `get_available_upgrades` function.

**Note:** Even if the RPC function is missing, the upgrade modal will still work using the fallback method!

### Option C: Run Complete Setup (Recommended)

If you want to set up everything at once:
```sql
-- File: scripts/setup-complete-subscription-system.sql
```

This includes:
- Subscription plans table
- All subscription-related functions
- Payment tracking
- Upgrade/downgrade logic

---

## Step 3: Verify Environment Variables

Check your `.env.local` file has:
```env
# Stripe Keys (required for payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Supabase (should already be set)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Resend (for email/domain verification)
RESEND_API_KEY=re_...
```

---

## Step 4: Test the Fix

1. **Open Browser Console** (F12 or Right-click > Inspect > Console)

2. **Navigate to Settings**
   ```
   http://localhost:3000/settings
   ```

3. **Click "Pricing and usage" tab**

4. **Click "Upgrade Plan" button**

5. **Watch the Console**
   You should see:
   ```
   Opening upgrade modal, userId: [your-user-id]
   Loading plans for user: [your-user-id]
   Plans loaded via RPC: [array of plans]
   ```
   
   OR if RPC function is missing:
   ```
   RPC function not available, using fallback
   Loading plans directly from table
   Transformed plans: [array of plans]
   ```

6. **Modal Should Open**
   - Shows 3 plans: Starter, Professional, Enterprise
   - Current plan is marked with green badge
   - Can click on any plan to see upgrade details

7. **Click a Plan**
   - Shows comparison: Current Plan vs Upgrading To
   - Shows all features you'll get
   - "Upgrade Now" button appears

8. **Click "Upgrade Now"**
   - Should redirect to Stripe checkout page
   - If it fails, check console for error messages

---

## Step 5: Troubleshooting

### Issue: Modal doesn't open at all

**Check Console for:**
- "No userId available" → User not logged in, log in first
- No logs at all → Button click not registering

**Fix:**
- Make sure you're logged in
- Clear browser cache and reload
- Check if JavaScript errors are blocking execution

### Issue: Modal opens but shows "Loading plans..." forever

**Check Console for:**
- "Error loading plans" → Database connection issue
- "Failed to load subscription plans" → No plans in database

**Fix:**
1. Run diagnostic: `http://localhost:3000/api/debug/subscription-setup`
2. If no plans found, run: `scripts/ensure-subscription-plans.sql`
3. Refresh the page and try again

### Issue: Plans load but "Upgrade Now" doesn't work

**Check Console for:**
- "Failed to process upgrade" → API error
- "Stripe not initialized" → Missing Stripe keys

**Fix:**
1. Verify Stripe keys in `.env.local`
2. Restart your dev server: `npm run dev`
3. Check `/api/subscriptions/upgrade` endpoint exists

### Issue: Redirects to Stripe but payment fails

**Check:**
- Using test mode Stripe keys (sk_test_... and pk_test_...)
- Stripe webhook is configured (for production)
- User has valid email address

---

## What Was Fixed

### 1. Added Fallback Plan Loading
The modal now has two ways to load plans:
- **Primary:** Uses `get_available_upgrades` RPC function (faster, more efficient)
- **Fallback:** Queries `subscription_plans` table directly (works even if function is missing)

### 2. Better Error Handling
- All errors are logged to console
- User-friendly error messages
- Graceful degradation if features are missing

### 3. Enhanced Logging
Every step logs to console:
- Modal opening
- User ID check
- Plan loading progress
- API calls
- Errors

### 4. Validation Checks
- Validates user is logged in before opening modal
- Checks if plans exist before displaying
- Verifies Stripe keys before payment

---

## Quick Test Commands

### Test in Supabase SQL Editor:
```sql
-- 1. Check if plans exist
SELECT * FROM subscription_plans;

-- 2. Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_available_upgrades';

-- 3. Test function (replace with your user ID)
SELECT * FROM get_available_upgrades('your-user-id-here');

-- 4. Check your user data
SELECT id, email, subscription_plan, subscription_status 
FROM users 
WHERE email = 'your-email@example.com';
```

### Test in Browser Console:
```javascript
// Check if Supabase is connected
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

// Check if Stripe is loaded
console.log('Stripe key:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10))
```

---

## Files Modified

1. ✅ `src/components/SubscriptionUpgradeModal.tsx` - Added fallback loading
2. ✅ `src/components/settings/PricingAndUsage.tsx` - Added validation
3. ✅ `scripts/create-upgrade-function.sql` - Database function
4. ✅ `scripts/ensure-subscription-plans.sql` - Plan setup
5. ✅ `scripts/test-upgrade-setup.sql` - Verification script
6. ✅ `src/app/api/debug/subscription-setup/route.ts` - Diagnostic endpoint

---

## Success Criteria

✅ Upgrade modal opens when clicking "Upgrade Plan"
✅ Plans display in a grid (Starter, Professional, Enterprise)
✅ Current plan shows green "Current Plan" badge
✅ Clicking a plan shows upgrade confirmation view
✅ Comparison shows current vs new plan features
✅ "Upgrade Now" button redirects to Stripe checkout
✅ Console shows clear logging at each step
✅ Works even if RPC function is missing (fallback)

---

## Need Help?

1. Run diagnostic: `http://localhost:3000/api/debug/subscription-setup`
2. Check browser console for errors
3. Verify database has plans: `SELECT * FROM subscription_plans;`
4. Check environment variables are set
5. Restart dev server after changing .env.local

The upgrade buttons should now work! The system is resilient and will work even if some database functions are missing.

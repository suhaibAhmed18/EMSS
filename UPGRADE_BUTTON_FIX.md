# Upgrade Button Fix

## Issue
The upgrade plan buttons on the pricing page weren't working.

## Root Causes Identified

1. **Missing Database Function**: The `get_available_upgrades` RPC function may not be created in the database
2. **No Fallback Logic**: If the RPC function fails, there was no alternative way to load plans
3. **Missing Error Handling**: Errors weren't being logged properly for debugging

## Fixes Applied

### 1. Added Fallback Plan Loading
Modified `SubscriptionUpgradeModal.tsx` to:
- Try loading plans via RPC function first
- If RPC fails, fall back to direct table queries
- Load plans directly from `subscription_plans` table
- Manually calculate plan comparisons

### 2. Enhanced Error Logging
Added console logging to:
- Track when upgrade modal opens
- Log user ID availability
- Show plan loading progress
- Display any errors that occur

### 3. Created Database Function
Created `scripts/create-upgrade-function.sql` with the `get_available_upgrades` function.

### 4. Created Test Script
Created `scripts/test-upgrade-setup.sql` to verify database setup.

## Setup Instructions

### Step 1: Run Database Migration
Execute in Supabase SQL Editor:
```sql
-- Run the upgrade function creation
-- File: scripts/create-upgrade-function.sql
```

Or if you already have the complete subscription system:
```sql
-- File: scripts/setup-complete-subscription-system.sql
```

### Step 2: Verify Setup
Run the test script in Supabase SQL Editor:
```sql
-- File: scripts/test-upgrade-setup.sql
```

This will check:
- ✅ subscription_plans table exists and has data
- ✅ get_available_upgrades function exists
- ✅ users table has subscription fields
- ✅ Plans have proper features structure

### Step 3: Test in Browser
1. Open browser console (F12)
2. Navigate to Settings > Pricing and usage
3. Click "Upgrade Plan" button
4. Check console for logs:
   - "Opening upgrade modal, userId: ..."
   - "Loading plans for user: ..."
   - "Plans loaded via RPC: ..." or "Loading plans directly from table"

## Expected Behavior

### When Button is Clicked:
1. Console shows: "Opening upgrade modal, userId: [user-id]"
2. Modal opens with loading spinner
3. Console shows: "Loading plans for user: [user-id]"
4. Plans load and display in grid
5. Clicking a plan shows upgrade confirmation view

### If RPC Function Missing:
1. Console shows: "RPC function not available, using fallback"
2. Console shows: "Loading plans directly from table"
3. Plans still load successfully using direct queries

## Troubleshooting

### Modal Doesn't Open
- Check console for "No userId available" error
- Verify user is logged in
- Check Supabase auth session

### Plans Don't Load
1. Check if subscription_plans table has data:
   ```sql
   SELECT * FROM subscription_plans;
   ```

2. If empty, insert plans:
   ```sql
   -- Run scripts/setup-subscription-plans.sql
   ```

3. Check if function exists:
   ```sql
   SELECT routine_name FROM information_schema.routines 
   WHERE routine_name = 'get_available_upgrades';
   ```

4. If missing, run:
   ```sql
   -- Run scripts/create-upgrade-function.sql
   ```

### "Upgrade Now" Button Doesn't Work
- Check console for API errors
- Verify Stripe keys in .env.local:
  ```
  STRIPE_SECRET_KEY=sk_...
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
  ```
- Check `/api/subscriptions/upgrade` endpoint exists

## Testing Checklist

- [ ] Upgrade modal opens when clicking "Upgrade Plan"
- [ ] Plans display in grid format
- [ ] Current plan is marked with "Current Plan" badge
- [ ] Clicking a plan shows upgrade confirmation
- [ ] Plan comparison shows current vs new plan
- [ ] "Upgrade Now" button redirects to Stripe
- [ ] Console shows proper logging at each step
- [ ] Fallback works if RPC function is missing

## Files Modified

1. `src/components/SubscriptionUpgradeModal.tsx`
   - Added fallback plan loading
   - Enhanced error handling
   - Added console logging

2. `src/components/settings/PricingAndUsage.tsx`
   - Added userId validation
   - Enhanced error logging

3. `scripts/create-upgrade-function.sql` (new)
   - Database function for getting upgrade options

4. `scripts/test-upgrade-setup.sql` (new)
   - Test script to verify setup

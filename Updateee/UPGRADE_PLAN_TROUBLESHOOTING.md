# Upgrade Plan Troubleshooting Guide

## Issue: Upgrade Plan Not Working in Pricing and Usage Settings

### Changes Made

1. **Added Comprehensive Logging**
   - Added console logs to track the upgrade flow
   - Logs user ID, plan selection, API calls, and Stripe redirect
   - Check browser console (F12) for detailed error messages

2. **Fixed Stripe API Version**
   - Changed from `2026-01-28.clover` (invalid future date) to `2024-12-18.acacia`
   - Location: `src/lib/payments/stripe.ts`

3. **Improved Error Handling**
   - Better error messages in modal and API
   - Shows specific error details to help diagnose issues
   - Added fallback redirect methods

4. **Enhanced Redirect Logic**
   - Primary: Direct URL redirect (`window.location.href`)
   - Fallback: Stripe.js redirect (`stripe.redirectToCheckout`)
   - More reliable across different browsers

### How to Test

1. **Open Browser Console** (F12 → Console tab)

2. **Navigate to Settings**
   ```
   http://localhost:3000/settings
   ```

3. **Click "Upgrade Plan" button**
   - Should open modal with available plans
   - Check console for: "Loading plans for user: [USER_ID]"
   - Check console for: "Plans loaded: [ARRAY]"

4. **Select a Plan**
   - Click on any plan card
   - Should show plan details view

5. **Click "Upgrade Now"**
   - Check console for:
     - "Starting upgrade to: [PLAN_NAME]"
     - "API response status: [STATUS]"
     - "API response data: [DATA]"
     - "Redirecting to Stripe..."

### Common Issues & Solutions

#### Issue 1: Modal Opens But No Plans Show
**Symptoms:** Loading spinner forever, or empty modal

**Possible Causes:**
- Database function `get_available_upgrades` doesn't exist
- No subscription plans in database
- User not authenticated

**Solution:**
```sql
-- Run in Supabase SQL Editor
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'get_available_upgrades';

-- Check if plans exist
SELECT * FROM subscription_plans WHERE is_active = true;

-- If missing, run:
\i scripts/add-subscription-upgrade.sql
\i scripts/setup-subscription-plans.sql
```

#### Issue 2: "Upgrade Now" Button Does Nothing
**Symptoms:** Button click has no effect, no redirect

**Check Console For:**
- Authentication errors (401)
- Plan not found errors (404)
- Stripe API errors (500)

**Possible Causes:**
1. **Stripe Keys Not Set**
   ```bash
   # Check .env.local has:
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

2. **Invalid Stripe API Version**
   - Fixed in this update
   - Restart dev server after changes

3. **Plan Name Mismatch**
   - Check plan names in database match exactly
   - Case-sensitive: "Professional" vs "professional"

#### Issue 3: Stripe Redirect Fails
**Symptoms:** Error after clicking "Upgrade Now"

**Check:**
1. **Stripe Publishable Key**
   ```javascript
   // Should see in console:
   console.log(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   // Should start with: pk_test_ or pk_live_
   ```

2. **Session Creation**
   - Check API logs for "Stripe session created: [SESSION_ID]"
   - If missing, Stripe API call failed

3. **Network Tab**
   - Open F12 → Network tab
   - Look for `/api/subscriptions/upgrade` request
   - Check response body for errors

#### Issue 4: Database Errors
**Symptoms:** "User not found" or "Plan not found"

**Solution:**
```sql
-- Verify user exists
SELECT id, email, subscription_plan FROM users WHERE id = 'YOUR_USER_ID';

-- Verify plans exist
SELECT id, name, price, is_active FROM subscription_plans;

-- If plans missing, insert them:
INSERT INTO subscription_plans (name, description, price, features, is_active)
VALUES 
  ('Starter', 'Perfect for small businesses', 0, '{"email_credits": 5000, "contacts": 1000}'::jsonb, true),
  ('Professional', 'For growing businesses', 49, '{"email_credits": 50000, "contacts": 10000}'::jsonb, true),
  ('Enterprise', 'For large organizations', 99, '{"email_credits": 500000, "contacts": 100000}'::jsonb, true);
```

### Testing Checklist

- [ ] Browser console shows no errors
- [ ] Modal opens and displays plans
- [ ] Can select a plan
- [ ] "Upgrade Now" button is clickable
- [ ] API call succeeds (status 200)
- [ ] Redirects to Stripe checkout page
- [ ] Can complete test payment
- [ ] Returns to settings page with success message

### Debug Commands

```bash
# Restart dev server (important after .env changes)
npm run dev

# Check environment variables are loaded
# Add to any API route temporarily:
console.log('Stripe Key:', process.env.STRIPE_SECRET_KEY?.substring(0, 10))
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

# Test Stripe connection
node -e "const Stripe = require('stripe'); const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); stripe.customers.list({limit: 1}).then(console.log).catch(console.error)"
```

### Files Modified

1. `src/components/SubscriptionUpgradeModal.tsx`
   - Added detailed logging
   - Improved error handling
   - Enhanced redirect logic

2. `src/app/api/subscriptions/upgrade/route.ts`
   - Added step-by-step logging
   - Better error messages
   - Detailed error responses

3. `src/lib/payments/stripe.ts`
   - Fixed API version to `2024-12-18.acacia`

### Next Steps If Still Not Working

1. **Check Browser Console**
   - Copy all error messages
   - Look for red errors

2. **Check Server Logs**
   - Terminal where `npm run dev` is running
   - Look for API errors

3. **Test Database Function**
   ```sql
   -- Run in Supabase SQL Editor with your user ID
   SELECT * FROM get_available_upgrades('your-user-id-here');
   ```

4. **Verify Stripe Dashboard**
   - Go to https://dashboard.stripe.com/test/apikeys
   - Verify keys are correct
   - Check if test mode is enabled

5. **Test Stripe Directly**
   ```bash
   # Install Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhooks/stripe-upgrade
   ```

### Support

If issue persists, provide:
1. Browser console logs (full output)
2. Server terminal logs
3. Network tab screenshot of failed request
4. Database query results from test script

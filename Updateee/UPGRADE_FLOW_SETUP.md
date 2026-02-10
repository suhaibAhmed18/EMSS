# Subscription Upgrade Flow - Setup & Testing Guide

## Quick Start

Your subscription upgrade system is now ready! Here's how to test it:

## Prerequisites

1. **Environment Variables**
   Make sure your `.env.local` has these Stripe keys:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Database Setup**
   Run these SQL scripts in Supabase SQL Editor:
   ```bash
   scripts/setup-subscription-plans.sql
   scripts/add-subscription-upgrade.sql
   ```

## Testing the Upgrade Flow

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Set Up Stripe Webhook (in a new terminal)
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Copy the webhook secret and add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

### Step 3: Access the Upgrade Modal

**Option A: Via Settings Page**
1. Navigate to `http://localhost:3000/settings`
2. Click on "Pricing and Usage" tab
3. Click the "Upgrade Plan" button

**Option B: Direct Integration**
```tsx
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal'

function YourComponent() {
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('your-user-id')

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Upgrade Plan
      </button>
      
      <SubscriptionUpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={userId}
      />
    </>
  )
}
```

### Step 4: Test the Flow

1. **View Plans**
   - Modal opens showing all available plans
   - Current plan is highlighted with a badge
   - Price differences are displayed

2. **Select a Plan**
   - Click on any plan card (except your current plan)
   - Modal shows detailed view with features

3. **Confirm Upgrade**
   - Click "Upgrade Now"
   - You'll be redirected to Stripe Checkout

4. **Complete Payment**
   Use Stripe test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

5. **Verify Success**
   - After payment, you're redirected back to settings
   - Success message appears
   - Your plan is updated in the database

## What Happens Behind the Scenes

### 1. User Clicks "Upgrade Plan"
```
User → Settings Page → Opens SubscriptionUpgradeModal
```

### 2. Modal Loads Plans
```
Modal → Supabase RPC → get_available_upgrades(user_id)
Returns: All plans with current plan marked
```

### 3. User Selects Plan
```
User clicks plan → Modal shows confirmation view
```

### 4. User Confirms
```
Modal → POST /api/subscriptions/upgrade
API → Creates Stripe Checkout Session
API → Returns session ID
Modal → Redirects to Stripe Checkout
```

### 5. Payment Processing
```
User completes payment on Stripe
Stripe → Webhook → POST /api/webhooks/stripe
Webhook → Updates user subscription in database
Webhook → Provisions Telnyx number (if needed)
Stripe → Redirects user back to app
```

### 6. Success
```
User lands on /settings?upgraded=true&plan=Professional
App shows success message
User's plan is now updated
```

## API Endpoints

### Get Available Plans
```bash
curl http://localhost:3000/api/subscriptions/plans
```

### Create Upgrade Checkout
```bash
curl -X POST http://localhost:3000/api/subscriptions/upgrade \
  -H "Content-Type: application/json" \
  -d '{
    "planName": "Professional",
    "planPrice": 20.00
  }'
```

## Database Queries

### Check User's Current Plan
```sql
SELECT 
  id, 
  email, 
  subscription_plan, 
  subscription_status,
  subscription_start_date
FROM users 
WHERE email = 'your-email@example.com';
```

### View Available Plans
```sql
SELECT * FROM subscription_plans WHERE is_active = true;
```

### Get Upgrade Options for User
```sql
SELECT * FROM get_available_upgrades('user-uuid-here');
```

## Troubleshooting

### Modal Doesn't Open
- Check that `userId` is being passed correctly
- Verify user is authenticated
- Check browser console for errors

### Plans Don't Load
- Verify database function exists: `get_available_upgrades`
- Check Supabase connection
- Ensure subscription_plans table has data

### Stripe Redirect Fails
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set
- Check that API returns valid `sessionId`
- Ensure Stripe keys are for the same account

### Webhook Not Firing
- Make sure `stripe listen` is running
- Verify `STRIPE_WEBHOOK_SECRET` matches CLI output
- Check webhook endpoint is accessible

### Payment Succeeds but Plan Not Updated
- Check webhook logs in terminal
- Verify webhook handler is updating database
- Check for errors in `/api/webhooks/stripe`

## Features

### Current Features ✅
- View all available plans
- See current plan with badge
- Display price differences
- Show plan features
- Stripe checkout integration
- Automatic subscription activation
- Success/error handling
- Mobile responsive design

### Coming Soon 🚀
- Proration for mid-cycle upgrades
- Downgrade support
- Annual billing option
- Plan comparison tool
- Usage alerts
- Trial periods

## File Structure

```
components/
  └── SubscriptionUpgradeModal.tsx    # Main modal component

src/
  ├── app/
  │   ├── api/
  │   │   ├── subscriptions/
  │   │   │   ├── plans/route.ts      # Get all plans
  │   │   │   ├── upgrade/route.ts    # Create upgrade checkout
  │   │   │   └── checkout/route.ts   # General checkout
  │   │   └── webhooks/
  │   │       └── stripe/route.ts     # Handle Stripe events
  │   └── settings/
  │       └── page.tsx                # Settings page
  └── components/
      └── settings/
          └── PricingAndUsage.tsx     # Pricing component

scripts/
  ├── setup-subscription-plans.sql    # Create plans table
  └── add-subscription-upgrade.sql    # Add upgrade functions

docs/
  ├── SUBSCRIPTION_UPGRADE_FLOW.md    # Detailed documentation
  └── UPGRADE_FLOW_SETUP.md          # This file
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Review Stripe webhook logs
3. Verify database schema is up to date
4. Ensure all environment variables are set
5. Check Supabase logs for database errors

## Next Steps

1. **Customize Plans**: Edit `scripts/setup-subscription-plans.sql` to match your pricing
2. **Add Features**: Extend the modal with additional functionality
3. **Style Updates**: Customize the modal design to match your brand
4. **Add Analytics**: Track upgrade conversions
5. **Email Notifications**: Send confirmation emails after upgrades

## Production Checklist

Before deploying to production:

- [ ] Replace test Stripe keys with production keys
- [ ] Set up production webhook endpoint
- [ ] Configure proper success/cancel URLs
- [ ] Add error tracking (Sentry, etc.)
- [ ] Test with real payment methods
- [ ] Set up monitoring for failed payments
- [ ] Add email notifications
- [ ] Review security settings
- [ ] Test on mobile devices
- [ ] Add analytics tracking

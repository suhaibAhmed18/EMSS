# Subscription Upgrade System Guide

## Overview
This system allows users to view all available plans and upgrade anytime with immediate payment. When upgrading, users pay for the new plan and their subscription is extended by 1 month.

## Features
- ✅ View current plan and all available plans
- ✅ Upgrade to higher-tier plans anytime
- ✅ Immediate payment processing via Stripe
- ✅ Prorated credit calculation (optional)
- ✅ Subscription extended by 1 month on upgrade
- ✅ Downgrade scheduling (takes effect at next billing)
- ✅ Upgrade history tracking

## Database Setup

### 1. Run the Upgrade SQL Script
```bash
# Execute in Supabase SQL Editor
scripts/add-subscription-upgrade.sql
```

This adds:
- Upgrade tracking fields
- Prorated cost calculation
- Upgrade processing functions
- Downgrade scheduling
- Upgrade history view

## How It Works

### Upgrade Flow
1. **User opens upgrade modal** → Shows all plans with current plan highlighted
2. **User selects plan** → Shows plan details and features
3. **User clicks "Upgrade Now"** → Redirects to Stripe Checkout
4. **Payment succeeds** → Webhook processes upgrade
5. **Subscription updated** → Plan changed + extended by 1 month

### Pricing Options

#### Option 1: Simple Full Price (Recommended)
User pays full price of new plan, subscription extends by 1 month.

**Example:**
- Current: Starter ($10/mo) - 15 days remaining
- Upgrade to: Professional ($20/mo)
- **Charge: $20** → Subscription extended by 1 month from current expiry

#### Option 2: Prorated Credit
User gets credit for unused time on current plan.

**Example:**
- Current: Starter ($10/mo) - 15 days remaining
- Prorated credit: $10 × (15/30) = $5
- Upgrade to: Professional ($20/mo)
- **Charge: $20 - $5 = $15** → Subscription extended by 1 month

## Key Functions

### 1. Get Available Upgrades
```sql
-- Get all plans with comparison to current plan
SELECT * FROM get_available_upgrades('user-uuid-here');

-- Returns:
-- plan_id, plan_name, plan_description, plan_price
-- current_plan_price, price_difference
-- features, is_current_plan, can_upgrade
```

### 2. Calculate Upgrade Cost (Optional - for prorated pricing)
```sql
-- Calculate prorated upgrade cost
SELECT * FROM calculate_upgrade_cost('user-uuid-here', 'enterprise');

-- Returns:
-- current_plan, new_plan
-- current_plan_price, new_plan_price
-- days_remaining, prorated_credit
-- upgrade_cost, new_expiry_date
```

### 3. Upgrade Subscription (Called by Webhook)
```sql
-- Process upgrade after payment
SELECT * FROM upgrade_subscription(
  'user-uuid-here',
  'enterprise',
  'payment-id-123'
);

-- Returns:
-- success, message
-- previous_plan, new_plan
-- new_expiry_date, next_billing_date
```

### 4. Schedule Downgrade (No Immediate Payment)
```sql
-- Schedule downgrade for next billing cycle
SELECT * FROM schedule_downgrade('user-uuid-here', 'starter');

-- User keeps current plan until expiry
-- Then automatically switches to new plan
```

### 5. View Upgrade History
```sql
-- See all upgrades and scheduled changes
SELECT * FROM subscription_upgrade_history;
```

## React Component Usage

### Basic Implementation
```tsx
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal';

function Dashboard() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <button onClick={() => setShowUpgradeModal(true)}>
        Upgrade Plan
      </button>

      <SubscriptionUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        userId={user.id}
      />
    </>
  );
}
```

### Show Upgrade Button Based on Plan
```tsx
function SubscriptionCard() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);

  useEffect(() => {
    async function loadStatus() {
      const { data } = await supabase.rpc('get_subscription_status', {
        p_user_id: user.id
      });
      setStatus(data[0]);
    }
    loadStatus();
  }, []);

  return (
    <div>
      <h3>Current Plan: {status?.plan_name}</h3>
      <p>Days Remaining: {status?.days_remaining}</p>
      
      {status?.plan_name !== 'Enterprise' && (
        <button onClick={() => setShowUpgradeModal(true)}>
          Upgrade to {status?.plan_name === 'Starter' ? 'Professional' : 'Enterprise'}
        </button>
      )}
    </div>
  );
}
```

## API Routes

### Create Upgrade Checkout
```typescript
// POST /api/create-upgrade-checkout
{
  userId: string;
  planName: string;
  planPrice: number;
}

// Returns:
{
  sessionId: string; // Stripe Checkout Session ID
}
```

### Stripe Webhook
```typescript
// POST /api/webhooks/stripe-upgrade
// Handles:
// - checkout.session.completed (upgrade payment)
// - invoice.payment_succeeded (recurring payment)
// - customer.subscription.updated
// - customer.subscription.deleted
```

## Environment Variables

Add to `.env.local`:
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Stripe Setup

### 1. Create Products and Prices
```bash
# In Stripe Dashboard:
# 1. Go to Products
# 2. Create products for each plan:
#    - Starter ($10/month)
#    - Professional ($20/month)
#    - Enterprise ($30/month)
# 3. Set recurring billing to "monthly"
```

### 2. Configure Webhook
```bash
# In Stripe Dashboard:
# 1. Go to Developers > Webhooks
# 2. Add endpoint: https://yourdomain.com/api/webhooks/stripe-upgrade
# 3. Select events:
#    - checkout.session.completed
#    - invoice.payment_succeeded
#    - customer.subscription.updated
#    - customer.subscription.deleted
# 4. Copy webhook secret to STRIPE_WEBHOOK_SECRET
```

### 3. Test Webhook Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe-upgrade

# Copy webhook secret from output
# Use test card: 4242 4242 4242 4242
```

## Upgrade Scenarios

### Scenario 1: Starter → Professional
```
Current Plan: Starter ($10/mo)
Days Remaining: 20 days
New Plan: Professional ($20/mo)

Payment: $20
Result: Professional plan for 1 month (extends current expiry by 1 month)
```

### Scenario 2: Professional → Enterprise
```
Current Plan: Professional ($20/mo)
Days Remaining: 5 days
New Plan: Enterprise ($30/mo)

Payment: $30
Result: Enterprise plan for 1 month (extends current expiry by 1 month)
```

### Scenario 3: Downgrade (Enterprise → Starter)
```
Current Plan: Enterprise ($30/mo)
Days Remaining: 25 days
New Plan: Starter ($10/mo)

Payment: $0 (scheduled for next billing)
Result: Keeps Enterprise until expiry, then switches to Starter
```

## Downgrade Handling

### Schedule Downgrade
```typescript
async function scheduleDowngrade(userId: string, newPlan: string) {
  const { data } = await supabase.rpc('schedule_downgrade', {
    p_user_id: userId,
    p_new_plan_name: newPlan
  });

  console.log(data[0].message);
  // "Downgrade to starter scheduled for 2024-03-15"
}
```

### Process Scheduled Downgrades (Cron Job)
```typescript
// Run daily via cron job
async function processDowngrades() {
  const { data } = await supabase.rpc('process_scheduled_downgrades');
  
  console.log(`Processed ${data[0].processed_count} downgrades`);
}
```

### Cancel Scheduled Downgrade
```typescript
async function cancelDowngrade(userId: string) {
  const { data } = await supabase.rpc('cancel_scheduled_downgrade', {
    p_user_id: userId
  });

  console.log(data[0].message);
  // "Scheduled downgrade cancelled"
}
```

## UI/UX Best Practices

### 1. Show Current Plan Clearly
```tsx
<div className="border-2 border-emerald-500">
  <span className="bg-emerald-500 text-white">Current Plan</span>
  <h3>Professional</h3>
  <p>$20/month</p>
</div>
```

### 2. Highlight Upgrade Benefits
```tsx
<div className="text-emerald-400">
  ✓ 10x more SMS credits
  ✓ Advanced analytics
  ✓ Priority support
</div>
```

### 3. Show Price Difference
```tsx
{plan.price_difference > 0 && (
  <p className="text-emerald-400">
    +${plan.price_difference} more per month
  </p>
)}
```

### 4. Clear Call-to-Action
```tsx
<button className="bg-emerald-600 hover:bg-emerald-700">
  {plan.can_upgrade ? 'Upgrade Now' : 'Downgrade'}
</button>
```

### 5. Confirmation Before Upgrade
```tsx
<div className="bg-blue-900/20 border border-blue-800">
  <p>You'll be redirected to Stripe to complete your upgrade securely</p>
</div>
```

## Testing

### Test Upgrade Flow
```typescript
// 1. Create test user with Starter plan
const { data: user } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
});

// 2. Set up subscription
await supabase.rpc('extend_subscription', {
  p_user_id: user.id,
  p_plan_name: 'starter'
});

// 3. Test upgrade
// - Open upgrade modal
// - Select Professional plan
// - Use Stripe test card: 4242 4242 4242 4242
// - Verify subscription updated

// 4. Check result
const { data: status } = await supabase.rpc('get_subscription_status', {
  p_user_id: user.id
});

console.log(status[0]);
// Should show: plan_name: 'professional', is_active: true
```

## Monitoring

### Track Upgrades
```sql
-- See recent upgrades
SELECT * FROM subscription_upgrade_history
WHERE upgrade_date > NOW() - INTERVAL '7 days'
ORDER BY upgrade_date DESC;
```

### Monitor Revenue
```sql
-- Calculate upgrade revenue
SELECT 
  DATE_TRUNC('month', upgrade_date) as month,
  COUNT(*) as upgrade_count,
  SUM(sp.price) as revenue
FROM users u
JOIN subscription_plans sp ON LOWER(sp.name) = LOWER(u.subscription_plan)
WHERE u.upgrade_date IS NOT NULL
GROUP BY month
ORDER BY month DESC;
```

## Troubleshooting

### Upgrade not processing
- Check Stripe webhook is configured correctly
- Verify webhook secret matches
- Check Supabase logs for errors
- Ensure user ID is in session metadata

### Wrong plan after upgrade
- Check webhook handler is calling `upgrade_subscription()`
- Verify plan name matches exactly (case-insensitive)
- Check for multiple webhook deliveries

### Payment succeeded but subscription not updated
- Check webhook endpoint is accessible
- Verify Supabase service role key has permissions
- Check for errors in webhook logs

## Summary

Your upgrade system is now ready with:
- ✅ Modal showing all plans with current plan highlighted
- ✅ Instant upgrade with Stripe payment
- ✅ Subscription extended by 1 month on upgrade
- ✅ Downgrade scheduling for next billing
- ✅ Upgrade history tracking
- ✅ Webhook handling for automatic processing

Users can upgrade anytime and pay immediately to get the new plan!

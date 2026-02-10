# Monthly Subscription System Guide

## Overview
This system implements monthly recurring subscriptions where users pay every month and their plan validity extends by 1 month with each payment.

## Database Setup

### 1. Run the SQL Script
```bash
# Execute in Supabase SQL Editor
scripts/add-subscription-expiry.sql
```

This adds:
- `subscription_start_date` - When the subscription started
- `subscription_expiry_date` - When the subscription expires (valid until)
- `last_payment_date` - Last successful payment date
- `next_billing_date` - When next payment is due
- `auto_renew` - Whether to auto-renew on expiry

## How It Works

### Payment Flow
1. **User subscribes** → Payment processed → `extend_subscription()` called
2. **Subscription extended** → Expiry date set to +1 month from now (or from current expiry if still valid)
3. **Next billing date** → Set to the new expiry date
4. **Status updated** → `subscription_status = 'active'`

### Monthly Renewal
- When user pays again, `extend_subscription()` adds another month
- If subscription expired, it starts fresh from payment date
- If still active, it extends from current expiry date (no time lost)

## Key Functions

### 1. Extend Subscription (Call on Payment Success)
```sql
-- Extend subscription by 1 month
SELECT * FROM extend_subscription(
  'user-uuid-here',  -- User ID
  'professional'      -- Plan name (optional)
);

-- Returns:
-- success: true/false
-- message: Status message
-- new_expiry_date: When subscription now expires
-- next_billing_date: When next payment is due
```

### 2. Check Subscription Status
```sql
-- Check if subscription is valid
SELECT * FROM get_subscription_status('user-uuid-here');

-- Returns:
-- is_active: true if subscription is currently valid
-- plan_name: Current plan
-- status: active/expired/cancelled
-- days_remaining: Days until expiry
-- expiry_date: When it expires
-- next_billing_date: Next payment due date
```

### 3. Check Expired Subscriptions (Run Daily)
```sql
-- Mark expired subscriptions (run via cron job)
SELECT * FROM check_expired_subscriptions();

-- Returns count of subscriptions marked as expired
```

### 4. Cancel Subscription
```sql
-- Cancel subscription (remains active until expiry)
SELECT * FROM cancel_subscription('user-uuid-here');

-- Sets status to 'cancelled' and auto_renew to false
-- User keeps access until expiry_date
```

### 5. View Expiring Soon
```sql
-- See subscriptions expiring in next 7 days
SELECT * FROM subscriptions_expiring_soon;
```

## Integration with Your App

### On Payment Success (Stripe/PayPal Webhook)
```typescript
// In your payment webhook handler
async function handlePaymentSuccess(userId: string, planName: string) {
  const { data, error } = await supabase.rpc('extend_subscription', {
    p_user_id: userId,
    p_plan_name: planName
  });

  if (data[0].success) {
    console.log('Subscription extended until:', data[0].new_expiry_date);
    console.log('Next billing:', data[0].next_billing_date);
    
    // Send confirmation email
    await sendSubscriptionConfirmationEmail(userId, data[0]);
  }
}
```

### Check Subscription Before Actions
```typescript
// Before allowing SMS/email campaigns
async function checkUserAccess(userId: string) {
  const { data } = await supabase.rpc('get_subscription_status', {
    p_user_id: userId
  });

  if (!data[0].is_active) {
    throw new Error('Subscription expired. Please renew to continue.');
  }

  return data[0];
}
```

### Daily Cron Job (Check Expired)
```typescript
// Run this daily via cron job or scheduled function
async function checkExpiredSubscriptions() {
  const { data } = await supabase.rpc('check_expired_subscriptions');
  
  console.log(`Marked ${data[0].expired_count} subscriptions as expired`);
  
  // Send expiry notification emails
  // Disable features for expired users
}
```

### Show Subscription Info to User
```typescript
// In user dashboard
async function getSubscriptionInfo(userId: string) {
  const { data } = await supabase.rpc('get_subscription_status', {
    p_user_id: userId
  });

  return {
    isActive: data[0].is_active,
    plan: data[0].plan_name,
    daysRemaining: data[0].days_remaining,
    expiryDate: data[0].expiry_date,
    nextBillingDate: data[0].next_billing_date
  };
}
```

## Subscription States

### Active
- `subscription_status = 'active'`
- `subscription_expiry_date > NOW()`
- User has full access to features

### Expired
- `subscription_status = 'expired'`
- `subscription_expiry_date < NOW()`
- User cannot use features until renewal

### Cancelled
- `subscription_status = 'cancelled'`
- `auto_renew = false`
- User keeps access until expiry_date
- No automatic renewal

### Pending
- `subscription_status = 'pending'`
- Initial state before first payment
- Limited or no access

## Stripe Integration Example

### Create Subscription
```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createSubscription(userId: string, planName: string) {
  // Create Stripe subscription
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    metadata: { userId, planName }
  });

  // Extend subscription in database
  await supabase.rpc('extend_subscription', {
    p_user_id: userId,
    p_plan_name: planName
  });

  // Save Stripe subscription ID
  await supabase
    .from('users')
    .update({ stripe_subscription_id: subscription.id })
    .eq('id', userId);
}
```

### Webhook Handler
```typescript
async function handleStripeWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      const userId = invoice.metadata.userId;
      const planName = invoice.metadata.planName;
      
      // Extend subscription by 1 month
      await supabase.rpc('extend_subscription', {
        p_user_id: userId,
        p_plan_name: planName
      });
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      const userId = subscription.metadata.userId;
      
      // Cancel subscription
      await supabase.rpc('cancel_subscription', {
        p_user_id: userId
      });
      break;
  }
}
```

## Notifications

### Expiry Reminders
```typescript
// Send reminder 7 days before expiry
async function sendExpiryReminders() {
  const { data: expiring } = await supabase
    .from('subscriptions_expiring_soon')
    .select('*');

  for (const user of expiring) {
    await sendEmail({
      to: user.email,
      subject: `Your subscription expires in ${user.days_until_expiry} days`,
      body: `Renew now to continue using our service.`
    });
  }
}
```

## Testing

### Test Subscription Extension
```sql
-- Create test user with subscription
INSERT INTO users (email, subscription_plan, subscription_status)
VALUES ('test@example.com', 'starter', 'pending');

-- Extend subscription (simulate payment)
SELECT * FROM extend_subscription(
  (SELECT id FROM users WHERE email = 'test@example.com'),
  'starter'
);

-- Check status
SELECT * FROM get_subscription_status(
  (SELECT id FROM users WHERE email = 'test@example.com')
);

-- Should show:
-- is_active: true
-- days_remaining: ~30
-- expiry_date: ~1 month from now
```

## Best Practices

1. **Always call `extend_subscription()` on successful payment**
2. **Run `check_expired_subscriptions()` daily via cron**
3. **Check `is_active` before allowing feature access**
4. **Send reminders 7, 3, and 1 day before expiry**
5. **Allow grace period (1-3 days) before hard blocking**
6. **Log all subscription changes for audit trail**
7. **Handle failed payments gracefully**
8. **Provide easy renewal process**

## Troubleshooting

### Subscription not extending
- Check if `extend_subscription()` is being called
- Verify user ID is correct
- Check for database errors in logs

### Wrong expiry date
- Ensure timezone is consistent (use UTC)
- Check if multiple payments are being processed

### User still has access after expiry
- Run `check_expired_subscriptions()`
- Verify your access control checks `is_active`

## Summary

Your monthly subscription system is now set up with:
- ✅ Automatic 1-month extension on payment
- ✅ Expiry date tracking
- ✅ Next billing date calculation
- ✅ Subscription status management
- ✅ Cancellation handling
- ✅ Expiry checking functions
- ✅ Easy integration with Stripe/PayPal

Users pay monthly, and each payment extends their access by exactly 1 month!

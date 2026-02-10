# Payment System - Quick Start

Get the payment system running in 5 minutes!

## Step 1: Database Migration (30 seconds)

```bash
node scripts/run-migration.js scripts/add-stripe-subscription-field.sql
```

## Step 2: Get Stripe Keys (2 minutes)

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your keys
3. Update `.env.local`:

```env
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

## Step 3: Test Locally (2 minutes)

### Option A: Without Webhooks (Quick Test)

```bash
npm run dev
```

Visit http://localhost:3000/pricing and test with:
- Card: `4242 4242 4242 4242`
- Expiry: Any future date
- CVC: Any 3 digits

**Note**: Without webhooks, you'll need to manually update the database after payment.

### Option B: With Webhooks (Full Test)

Terminal 1:
```bash
npm run dev
```

Terminal 2:
```bash
# Install Stripe CLI first: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Copy the webhook secret from Terminal 2 and add to `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Now test the full flow!

## Step 4: Verify It Works

1. Go to http://localhost:3000/pricing
2. Select a plan
3. Register with test email
4. Complete payment with test card
5. Check your email for verification
6. Verify email
7. Login at http://localhost:3000/auth/login
8. Access dashboard!

## Troubleshooting

### "Payment required" error on login?
Check database:
```sql
SELECT email, subscription_status, email_verified 
FROM users 
WHERE email = 'your-test-email@example.com';
```

Should show:
- `subscription_status`: 'active'
- `email_verified`: true

### Webhook not working?
- Make sure Stripe CLI is running
- Check webhook secret matches
- Look for errors in terminal

### Email not received?
- Check spam folder
- Verify RESEND_API_KEY in `.env.local`
- Check console logs for email errors

## Production Deployment

Before going live:

1. **Switch to live Stripe keys**
   ```env
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

2. **Set up production webhook**
   - Go to Stripe Dashboard > Webhooks
   - Add endpoint: `https://yourdomain.com/api/payments/webhook`
   - Select events: checkout.session.completed, customer.subscription.*
   - Copy webhook secret

3. **Update app URL**
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. **Test with real card** (use small amount first!)

## What's Included

✅ Pricing page without dashboard sidebar
✅ User registration with plan selection
✅ Stripe Checkout integration
✅ Webhook payment processing
✅ Email verification
✅ Login enforcement (payment + email required)
✅ Automatic Telnyx phone number assignment
✅ Subscription management

## Next Steps

- Customize pricing plans in `src/app/pricing/page.tsx`
- Add subscription management UI
- Implement billing portal
- Add more payment methods
- Set up automated invoicing

## Need Help?

See detailed guides:
- `PAYMENT_SETUP_GUIDE.md` - Complete setup instructions
- `PAYMENT_FLOW.md` - Flow diagrams and API reference

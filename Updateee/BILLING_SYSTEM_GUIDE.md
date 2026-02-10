# Billing & Subscription System Guide

## Overview
This platform now requires paid subscriptions for all users. Each paying user receives:
- Access to the marketing platform
- A dedicated Telnyx phone number for SMS campaigns
- Credits for SMS and email campaigns based on their plan

## Payment Methods Supported
- **Credit/Debit Cards** (Visa, Mastercard, Amex, etc.) via Stripe
- **PayPal** (Coming soon)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Update your `.env.local` file with the following:

```env
# Stripe Configuration (Required)
STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_SECRET_KEY=sk_live_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Telnyx Configuration (Required)
TELNYX_API_KEY=your_telnyx_api_key_here
```

### 3. Run Database Migrations

```bash
# Apply the subscription and billing migration
psql -h your-db-host -U your-user -d your-database -f supabase/migrations/009_subscriptions_and_billing.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

### 4. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 5. Test the System

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `/billing/plans` to see subscription plans
3. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

## Database Schema

### New Tables

#### `subscription_plans`
- Stores available subscription plans
- Default plans: Starter ($29.99), Professional ($79.99), Enterprise ($199.99)

#### `payments`
- Records all payment transactions
- Links to users and stores payment provider details

#### `telnyx_numbers`
- Tracks Telnyx phone numbers assigned to users
- Manages number lifecycle (active, released)

### Updated `users` Table
New columns:
- `subscription_status`: active, inactive, cancelled, past_due
- `subscription_plan`: Plan name
- `subscription_start_date`: When subscription started
- `subscription_end_date`: When subscription ends/renews
- `stripe_customer_id`: Stripe customer ID
- `paypal_subscription_id`: PayPal subscription ID (future)
- `telnyx_phone_number`: Assigned phone number
- `telnyx_phone_number_id`: Telnyx number ID
- `payment_method`: stripe, paypal, etc.

## User Flow

### New User Registration
1. User registers account → `/auth/register`
2. Redirected to choose plan → `/billing/plans`
3. Selects plan and payment method
4. Completes payment via Stripe
5. Webhook processes payment:
   - Activates subscription
   - Provisions Telnyx number
   - Grants platform access
6. Redirected to success page → `/billing/success`
7. Can access dashboard → `/dashboard`

### Existing Users
- Users without active subscription are redirected to `/billing/plans`
- Must subscribe to access protected routes

## API Endpoints

### Subscription Management
- `GET /api/subscriptions/plans` - List available plans
- `POST /api/subscriptions/checkout` - Create checkout session
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

### Protected Routes
All routes under:
- `/dashboard`
- `/contacts`
- `/campaigns`
- `/automations`
- `/analytics`
- `/settings`

Require active subscription (`subscription_status = 'active'`)

## Telnyx Number Provisioning

When a user subscribes:
1. System searches for available Telnyx numbers
2. Purchases the first available number
3. Stores number in `telnyx_numbers` table
4. Updates user record with phone number
5. Number is ready for SMS campaigns

## Subscription Plans

### Starter - $29.99/month
- 500 SMS credits
- 5,000 Email credits
- 1,000 Contacts
- 5 Automations
- Dedicated phone number

### Professional - $79.99/month
- 2,000 SMS credits
- 20,000 Email credits
- 10,000 Contacts
- 20 Automations
- Dedicated phone number

### Enterprise - $199.99/month
- 10,000 SMS credits
- 100,000 Email credits
- Unlimited Contacts
- Unlimited Automations
- Dedicated phone number

## Testing

### Test Stripe Integration
```bash
# Use Stripe CLI to forward webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test events
stripe trigger checkout.session.completed
```

### Test Telnyx Integration
- Use Telnyx test credentials
- Numbers are provisioned in test mode

## Security Considerations

1. **Webhook Verification**: All Stripe webhooks are verified using signature
2. **Subscription Checks**: Middleware validates subscription on every protected route
3. **Payment Data**: Never store card details (handled by Stripe)
4. **RLS Policies**: Database enforces row-level security

## Troubleshooting

### User can't access dashboard after payment
- Check `subscription_status` in users table
- Verify webhook was received and processed
- Check Stripe dashboard for subscription status

### Telnyx number not assigned
- Verify `TELNYX_API_KEY` is correct
- Check Telnyx account has available numbers
- Review webhook logs for errors

### Payment fails
- Verify Stripe keys are correct (live vs test)
- Check Stripe dashboard for declined payments
- Ensure webhook endpoint is accessible

## Future Enhancements

- [ ] PayPal integration
- [ ] Annual billing with discount
- [ ] Usage-based billing for overages
- [ ] Plan upgrades/downgrades
- [ ] Billing portal for invoice management
- [ ] Multiple payment methods per user
- [ ] Proration for mid-cycle changes

## Support

For issues or questions:
1. Check Stripe dashboard for payment issues
2. Review application logs for errors
3. Verify environment variables are set correctly
4. Test with Stripe test mode first

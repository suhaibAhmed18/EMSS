# Payment System Setup Guide

This guide explains how to set up the complete payment system for MarketingPro, including Stripe integration and payment enforcement.

## Overview

The payment system ensures users must:
1. Select a pricing plan
2. Register an account
3. Complete payment via Stripe
4. Verify their email
5. Only then can they login and access the dashboard

## Features Implemented

### 1. Pricing Page (`/pricing`)
- Public page (no sidebar)
- Three pricing tiers: Starter ($10), Professional ($20), Enterprise ($30)
- Redirects to registration with selected plan

### 2. Registration Flow
- User registers with email, password, and name
- Account is created but marked as inactive
- User is redirected to payment page

### 3. Payment Processing
- **Stripe Checkout Integration**: Secure, PCI-compliant payment processing
- Users are redirected to Stripe's hosted checkout page
- Supports recurring monthly subscriptions
- Webhook handles payment confirmation

### 4. Payment Verification
- After successful payment, user is redirected to success page
- Verification email is sent automatically
- User must verify email before login

### 5. Login Enforcement
- Login checks for:
  - Valid credentials
  - Email verification status
  - Active subscription (payment completed)
- Users without payment are blocked with clear error message

## Setup Instructions

### Step 1: Database Migration

Run the migration to add Stripe subscription field:

```bash
# Using the run-migration script
node scripts/run-migration.js scripts/add-stripe-subscription-field.sql
```

Or manually in Supabase SQL Editor:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);
```

### Step 2: Stripe Account Setup

1. **Create a Stripe Account**
   - Go to https://stripe.com
   - Sign up for an account
   - Complete account verification

2. **Get API Keys**
   - Go to Developers > API keys
   - Copy your Publishable key and Secret key
   - For testing, use test mode keys (they start with `pk_test_` and `sk_test_`)

3. **Set up Webhook**
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - URL: `https://your-domain.com/api/payments/webhook`
   - For local testing: Use Stripe CLI or ngrok
   - Select events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the webhook signing secret

### Step 3: Environment Variables

Update your `.env.local` file:

```env
# Stripe Configuration
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_actual_webhook_secret

# App URL (important for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL
```

### Step 4: Local Testing with Stripe CLI (Optional)

For local webhook testing:

```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/payments/webhook

# This will give you a webhook signing secret starting with whsec_
# Add it to your .env.local
```

### Step 5: Test the Payment Flow

1. **Start your development server**
   ```bash
   npm run dev
   ```

2. **Test the complete flow**
   - Go to http://localhost:3000/pricing
   - Select a plan
   - Register with test email
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete payment
   - Check email for verification link
   - Verify email
   - Login to dashboard

3. **Test card numbers**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires authentication: `4000 0025 0000 3155`

## API Endpoints

### Payment Endpoints

1. **POST `/api/payments/create-checkout`**
   - Creates Stripe Checkout session
   - Parameters: `userId`, `email`, `plan`, `amount`
   - Returns: `sessionId`, `url`

2. **POST `/api/payments/webhook`**
   - Handles Stripe webhook events
   - Processes payment confirmations
   - Updates user subscription status
   - Sends verification emails

3. **POST `/api/payments/verify-session`**
   - Verifies payment session after redirect
   - Parameters: `sessionId`
   - Returns: Session details

### Auth Endpoints

1. **POST `/api/auth/login`**
   - Validates credentials
   - Checks email verification
   - **NEW**: Checks payment status
   - Returns error if payment not completed

## Database Schema

The `users` table includes these payment-related fields:

```sql
subscription_status VARCHAR(50)      -- 'active', 'inactive', 'cancelled', 'past_due'
subscription_plan VARCHAR(50)        -- 'starter', 'professional', 'enterprise'
payment_id VARCHAR(255)              -- Stripe checkout session ID
stripe_customer_id VARCHAR(255)      -- Stripe customer ID
stripe_subscription_id VARCHAR(255)  -- Stripe subscription ID (NEW)
```

## Webhook Events Handled

1. **checkout.session.completed**
   - Payment successful
   - Updates user subscription to 'active'
   - Stores Stripe customer and subscription IDs
   - Sends verification email

2. **customer.subscription.updated**
   - Subscription status changed
   - Updates user subscription status

3. **customer.subscription.deleted**
   - Subscription cancelled
   - Marks user as 'cancelled'

4. **invoice.payment_failed**
   - Payment failed
   - Marks user as 'past_due'

## Security Considerations

1. **Webhook Signature Verification**
   - All webhooks verify Stripe signature
   - Prevents unauthorized requests

2. **PCI Compliance**
   - No card data stored in your database
   - Stripe handles all sensitive data

3. **Session Validation**
   - Payment success page verifies session with Stripe
   - Prevents fake success redirects

4. **Login Enforcement**
   - Multiple checks before allowing access
   - Clear error messages for users

## Production Deployment

### Before Going Live

1. **Switch to Live Mode**
   - Get live API keys from Stripe
   - Update environment variables
   - Test with real (small amount) transactions

2. **Update Webhook URL**
   - Point to production domain
   - Update in Stripe dashboard

3. **Configure Domain**
   - Update `NEXT_PUBLIC_APP_URL` to production URL
   - Ensure HTTPS is enabled

4. **Test Complete Flow**
   - Test all payment scenarios
   - Verify email delivery
   - Check webhook processing

### Monitoring

1. **Stripe Dashboard**
   - Monitor payments
   - Check for failed payments
   - Review customer subscriptions

2. **Application Logs**
   - Check webhook processing logs
   - Monitor email delivery
   - Track user registration flow

## Troubleshooting

### Payment Not Processing

1. Check Stripe API keys are correct
2. Verify webhook secret is set
3. Check webhook endpoint is accessible
4. Review Stripe dashboard for errors

### Webhook Not Receiving Events

1. Verify webhook URL is correct
2. Check webhook signing secret
3. For local testing, use Stripe CLI
4. Check server logs for errors

### Users Can't Login After Payment

1. Check subscription_status in database
2. Verify webhook processed successfully
3. Check email verification status
4. Review login API logs

### Email Not Sending

1. Verify RESEND_API_KEY is set
2. Check email service logs
3. Verify email addresses are valid
4. Check spam folder

## Development vs Production

### Development Mode
- Uses Stripe test mode
- Test cards work
- Webhooks via Stripe CLI
- No real charges

### Production Mode
- Uses Stripe live mode
- Real cards only
- Webhooks via HTTPS
- Real charges processed

## Support

For issues:
1. Check Stripe dashboard for payment details
2. Review application logs
3. Check database for user status
4. Verify environment variables

## Next Steps

After setup:
1. Customize pricing plans
2. Add more payment methods (PayPal, etc.)
3. Implement subscription management
4. Add billing portal
5. Set up automated invoicing

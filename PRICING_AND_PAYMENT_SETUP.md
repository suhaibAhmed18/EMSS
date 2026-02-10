# Pricing and Payment System Setup Guide

## Overview

This guide explains the complete pricing-first registration flow with payment integration and Telnyx phone number assignment.

## User Flow

1. **Pricing Selection** (`/pricing`)
   - User views three pricing tiers: Starter ($10), Professional ($20), Enterprise ($30)
   - User selects a plan and is redirected to registration

2. **Registration** (`/auth/register?plan=<plan>`)
   - User enters name, email, and password
   - Account is created with `subscription_status: 'pending'`
   - User is redirected to payment page

3. **Payment** (`/auth/payment`)
   - User enters payment details (Visa, Mastercard, or PayPal)
   - Payment is processed through Stripe
   - On success:
     - `subscription_status` updated to `'active'`
     - Verification email is sent
     - User redirected to success page

4. **Email Verification** (`/auth/payment-success`)
   - User receives verification email
   - User clicks verification link
   - Email is verified (`email_verified: true`)

5. **Login** (`/auth/login`)
   - User logs in with verified email
   - Telnyx phone number is automatically assigned
   - User can start sending SMS campaigns

## Database Schema

Run the migration script to add required fields:

```bash
# Using Supabase SQL Editor or psql
psql -h <host> -U <user> -d <database> -f scripts/add-subscription-fields.sql
```

### New Fields Added to `users` Table:

- `subscription_plan` (VARCHAR): 'starter', 'professional', or 'enterprise'
- `subscription_status` (VARCHAR): 'pending', 'active', 'cancelled', or 'expired'
- `payment_id` (VARCHAR): Stripe or PayPal payment ID
- `telnyx_phone_number` (VARCHAR): Assigned phone number for SMS

## Environment Variables

Add these to your `.env.local`:

```env
# Stripe Configuration (Required for payments)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Telnyx Configuration (Required for SMS)
TELNYX_API_KEY=your_telnyx_api_key_here
TELNYX_CONNECTION_ID=your_connection_id
TELNYX_MESSAGING_PROFILE_ID=your_messaging_profile_id

# Email Configuration (Already configured)
RESEND_API_KEY=re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB
EMAIL_FROM_ADDRESS=onboarding@resend.dev
```

## Setup Instructions

### 1. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from https://dashboard.stripe.com/apikeys
3. Add keys to `.env.local`
4. Test with Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### 2. Telnyx Setup

1. Create a Telnyx account at https://telnyx.com
2. Get your API key from https://portal.telnyx.com/
3. Create a messaging profile
4. Add credentials to `.env.local`

### 3. Database Migration

Run the SQL migration:

```sql
-- In Supabase SQL Editor
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS telnyx_phone_number VARCHAR(20);

CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_telnyx_phone ON users(telnyx_phone_number);
```

## API Endpoints

### Payment Processing
- **POST** `/api/payments/process`
  - Processes payment and activates subscription
  - Sends verification email

### Telnyx Phone Number
- **POST** `/api/telnyx/assign-number`
  - Assigns a Telnyx phone number to the user
  - Requires active subscription and verified email

- **GET** `/api/telnyx/assign-number`
  - Retrieves user's assigned phone number

## Components

### New Pages
- `/pricing` - Pricing selection page
- `/auth/payment` - Payment processing page
- `/auth/payment-success` - Success confirmation page

### New Components
- `PhoneNumberCard` - Displays assigned phone number in dashboard

## Testing the Flow

### Development Mode

The system works in development mode without real Stripe/Telnyx credentials:

1. Visit http://localhost:3000/pricing
2. Select any plan
3. Fill in registration form
4. Enter dummy card details:
   - Card: 4242 4242 4242 4242
   - Expiry: 12/25
   - CVV: 123
5. Payment will be simulated
6. Check console for verification email link
7. Click verification link
8. Login to see assigned phone number

### Production Mode

1. Configure real Stripe and Telnyx credentials
2. Test with Stripe test mode first
3. Verify email delivery works
4. Test phone number assignment
5. Switch to live mode when ready

## Payment Methods Supported

- **Credit/Debit Cards**: Visa, Mastercard (via Stripe)
- **PayPal**: Integrated through Stripe or direct PayPal API

## Security Features

- Passwords hashed with SHA-256
- Email verification required before login
- Payment processed through secure Stripe API
- Session cookies with httpOnly flag
- HTTPS required in production

## Pricing Tiers

### Starter - $10/month
- Up to 1,000 contacts
- 5,000 emails per month
- 500 SMS per month
- Basic analytics
- Email support
- Telnyx phone number included

### Professional - $20/month (Most Popular)
- Up to 10,000 contacts
- 50,000 emails per month
- 5,000 SMS per month
- Advanced analytics
- Priority email support
- Telnyx phone number included
- Automation workflows
- A/B testing

### Enterprise - $30/month
- Unlimited contacts
- Unlimited emails
- 50,000 SMS per month
- Premium analytics & reporting
- 24/7 priority support
- Multiple Telnyx phone numbers
- Advanced automation
- Custom integrations
- Dedicated account manager

## Troubleshooting

### Payment Fails
- Check Stripe API keys are correct
- Verify card details are valid
- Check Stripe dashboard for errors

### Phone Number Not Assigned
- Verify email is confirmed
- Check subscription status is 'active'
- Verify Telnyx API key is valid
- Check Telnyx account has available numbers

### Verification Email Not Received
- Check spam folder
- Verify Resend API key is valid
- Use resend verification button
- Check email service logs

## Next Steps

1. Run database migration
2. Configure Stripe and Telnyx credentials
3. Test the complete flow
4. Customize pricing tiers if needed
5. Add webhook handlers for subscription management
6. Implement subscription cancellation
7. Add usage tracking and limits

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify all environment variables are set
- Test in development mode first
- Review Stripe/Telnyx documentation

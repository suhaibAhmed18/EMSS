# Testing Guide: Registration → Payment → Login Flow

This guide will help you test the complete user registration, payment, and login flow.

## Prerequisites

Before testing, ensure you have:

1. ✅ Supabase project set up
2. ✅ Stripe account (test mode)
3. ✅ Environment variables configured (.env.local)
4. ✅ Database migrations run
5. ✅ Development server running

## Setup Steps

### 1. Database Setup

Run the subscription plans setup script in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor
# Copy and paste the contents of: scripts/setup-subscription-plans.sql
# Click "Run"
```

Verify plans were created:
```sql
SELECT name, price, features FROM subscription_plans ORDER BY price;
```

### 2. Environment Configuration

Copy and configure your environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:
- Stripe keys (test mode)
- Supabase credentials
- Generate secure secrets:
  ```bash
  openssl rand -base64 32
  ```

### 3. Stripe Webhook Setup (Local Development)

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases
```

Start webhook forwarding:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Copy the webhook signing secret (starts with `whsec_`) to your `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Test Scenarios

### Scenario 1: Complete Happy Path

**Goal:** Test the full registration → payment → verification → login flow

#### Step 1: Select a Plan
1. Navigate to http://localhost:3000/pricing
2. Click "Get Started" on the **Professional** plan ($20/month)
3. Verify redirect to `/auth/register?plan=professional`

#### Step 2: Register Account
1. Fill in the registration form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Password: `TestPass123`
   - Confirm Password: `TestPass123`
2. Click "Create account"
3. Verify redirect to `/auth/payment` with user details in URL

#### Step 3: Complete Payment
1. Verify payment page shows:
   - Selected plan: Professional
   - Price: $20/month
   - Email: test@example.com
2. Click "Continue to Payment"
3. On Stripe Checkout page, use test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - Name: `Test User`
   - Country: `United States`
   - ZIP: `12345`
4. Click "Pay"
5. Verify redirect to `/auth/payment-success`

#### Step 4: Check Webhook Processing
In your terminal running `stripe listen`, you should see:
```
✅ checkout.session.completed
```

In your Next.js console, you should see:
```
✅ Payment successful for user <uuid>, plan: professional
✅ Verification email sent to: test@example.com
```

#### Step 5: Verify Email
Since we're in development mode without real email:
1. Check your Next.js console for the verification link:
   ```
   📧 EMAIL WOULD BE SENT (Resend not configured):
   To: test@example.com
   Subject: Verify Your Email Address - MarketingPro
   ```
2. Copy the verification URL from the console
3. Open it in your browser
4. Verify redirect to `/auth/login?verified=true`

#### Step 6: Login
1. On the login page, enter:
   - Email: `test@example.com`
   - Password: `TestPass123`
2. Click "Sign in"
3. Verify redirect to `/dashboard`
4. Check console for Telnyx phone number assignment:
   ```
   ✅ Telnyx number +1234567890 assigned to user <uuid> on login
   ```

### Scenario 2: Login Before Email Verification

**Goal:** Verify that unverified users cannot login

#### Steps:
1. Complete registration and payment (Steps 1-4 from Scenario 1)
2. **Skip** email verification
3. Go directly to `/auth/login`
4. Enter credentials:
   - Email: `test@example.com`
   - Password: `TestPass123`
5. Click "Sign in"

**Expected Result:**
- ❌ Login fails
- Error message: "Email verification required. Please check your email and verify your account before logging in."
- "Resend verification email" button appears
- User remains on login page

### Scenario 3: Login Before Payment

**Goal:** Verify that users without payment cannot login

#### Steps:
1. Register account (Step 2 from Scenario 1)
2. **Skip** payment step (close payment page)
3. Go directly to `/auth/login`
4. Enter credentials
5. Click "Sign in"

**Expected Result:**
- ❌ Login fails
- Error message: "Payment required. Please complete your payment to access your account."
- "Go to Pricing" link appears
- User remains on login page

### Scenario 4: Resend Verification Email

**Goal:** Test the resend verification functionality

#### Steps:
1. Complete registration and payment
2. On login page, try to login (will fail - not verified)
3. Click "Resend verification email"
4. Check console for new verification email
5. Use the new verification link
6. Login successfully

**Expected Result:**
- ✅ New verification email sent
- ✅ Success message displayed
- ✅ Can verify and login

### Scenario 5: Different Plans

**Goal:** Test all three pricing tiers

#### Test Each Plan:
1. **Starter Plan ($10)**
   - Register with `starter@example.com`
   - Complete payment with test card
   - Verify features in dashboard

2. **Professional Plan ($20)**
   - Register with `professional@example.com`
   - Complete payment with test card
   - Verify features in dashboard

3. **Enterprise Plan ($30)**
   - Register with `enterprise@example.com`
   - Complete payment with test card
   - Verify features in dashboard

### Scenario 6: Payment Failure

**Goal:** Test failed payment handling

#### Steps:
1. Navigate to pricing and select a plan
2. Complete registration
3. On Stripe Checkout, use **decline card**:
   - Card: `4000 0000 0000 0002`
   - Expiry: Any future date
   - CVC: Any 3 digits
4. Click "Pay"

**Expected Result:**
- ❌ Payment declined by Stripe
- User returned to payment page
- Can retry with valid card

### Scenario 7: Cancelled Payment

**Goal:** Test payment cancellation

#### Steps:
1. Navigate to pricing and select a plan
2. Complete registration
3. On Stripe Checkout page, click "Back" or close the window
4. Verify redirect to payment page with `cancelled=true` parameter

**Expected Result:**
- User returned to payment page
- Can retry payment
- Account remains in 'pending' status

## Database Verification

After completing tests, verify database state:

### Check User Record
```sql
SELECT 
  email,
  email_verified,
  subscription_status,
  subscription_plan,
  stripe_customer_id,
  telnyx_phone_number
FROM users
WHERE email = 'test@example.com';
```

**Expected:**
- `email_verified`: `true`
- `subscription_status`: `active`
- `subscription_plan`: `professional`
- `stripe_customer_id`: `cus_...`
- `telnyx_phone_number`: `+1...`

### Check Stripe Data
```sql
SELECT 
  stripe_customer_id,
  stripe_subscription_id,
  payment_id
FROM users
WHERE email = 'test@example.com';
```

All fields should be populated.

## Stripe Dashboard Verification

1. Go to https://dashboard.stripe.com/test/customers
2. Find customer by email: `test@example.com`
3. Verify:
   - Customer created
   - Subscription active
   - Payment successful
   - Metadata contains `userId` and `planId`

## Common Issues & Solutions

### Issue: Webhook not receiving events

**Solution:**
```bash
# Restart Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/webhook

# Copy new webhook secret to .env.local
# Restart Next.js dev server
```

### Issue: Email verification link not working

**Solution:**
- Check console for verification URL
- Ensure `NEXT_PUBLIC_APP_URL` is set correctly
- Verify token hasn't expired (24 hours)

### Issue: Login fails after verification

**Solution:**
```sql
-- Check user status
SELECT email_verified, subscription_status 
FROM users 
WHERE email = 'test@example.com';

-- Manually verify if needed (for testing only!)
UPDATE users 
SET email_verified = true, subscription_status = 'active'
WHERE email = 'test@example.com';
```

### Issue: Telnyx number not assigned

**Solution:**
- Check `TELNYX_API_KEY` is set
- Verify Telnyx account has available numbers
- Check console logs for errors
- Number assigned on first successful login

### Issue: Payment webhook not processing

**Solution:**
1. Check Stripe CLI is running
2. Verify webhook secret matches
3. Check Next.js console for errors
4. Test webhook manually:
   ```bash
   stripe trigger checkout.session.completed
   ```

## Performance Testing

### Load Test Registration
```bash
# Install k6
brew install k6

# Create test script
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export default function () {
  const payload = JSON.stringify({
    firstName: 'Load',
    lastName: 'Test',
    email: `test${__VU}@example.com`,
    password: 'TestPass123',
    plan: 'professional'
  });

  const res = http.post('http://localhost:3000/api/auth/register', payload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
EOF

# Run test
k6 run --vus 10 --duration 30s load-test.js
```

## Security Testing

### Test SQL Injection
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com'\'' OR 1=1--",
    "password": "TestPass123",
    "plan": "professional"
  }'
```

**Expected:** Request should be safely handled, no SQL injection.

### Test XSS
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "<script>alert(\"XSS\")</script>",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123",
    "plan": "professional"
  }'
```

**Expected:** Script tags should be escaped/sanitized.

## Cleanup After Testing

```sql
-- Delete test users
DELETE FROM users WHERE email LIKE '%@example.com';

-- Or delete specific test user
DELETE FROM users WHERE email = 'test@example.com';
```

## Production Checklist

Before deploying to production:

- [ ] Replace all test Stripe keys with production keys
- [ ] Set up production Stripe webhook endpoint
- [ ] Configure real email service (Resend API key)
- [ ] Set up Telnyx with real phone numbers
- [ ] Generate new secure secrets for production
- [ ] Enable rate limiting
- [ ] Set up monitoring and error tracking
- [ ] Configure backup and disaster recovery
- [ ] Test with real payment methods
- [ ] Verify email deliverability
- [ ] Test on multiple devices and browsers
- [ ] Perform security audit
- [ ] Set up SSL/TLS certificates
- [ ] Configure CDN for static assets
- [ ] Enable database backups
- [ ] Set up log aggregation

## Support

If you encounter issues:
1. Check the console logs (both browser and server)
2. Review the Stripe Dashboard for payment issues
3. Check Supabase logs for database errors
4. Verify all environment variables are set correctly
5. Ensure database migrations have been run
6. Test with Stripe test cards first
7. Check webhook events in Stripe Dashboard

## Next Steps

After successful testing:
1. Deploy to staging environment
2. Test with real payment methods (small amounts)
3. Invite beta users
4. Monitor error rates and performance
5. Collect user feedback
6. Iterate and improve

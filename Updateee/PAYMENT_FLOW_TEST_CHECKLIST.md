# Payment Flow Test Checklist

## Test Case 1: Complete Flow (Happy Path)
- [ ] Navigate to `/pricing`
- [ ] Select "Professional" plan
- [ ] Click "Get Started"
- [ ] Fill registration form with valid data
- [ ] Submit registration
- [ ] Verify redirect to `/auth/payment?email=...&plan=professional&userId=...`
- [ ] Complete Stripe payment (use test card: 4242 4242 4242 4242)
- [ ] Verify redirect to `/auth/payment-success`
- [ ] Check email for verification link
- [ ] Click verification link
- [ ] Navigate to `/auth/login`
- [ ] Enter credentials
- [ ] Verify redirect to `/dashboard`
- [ ] Verify Telnyx phone number assigned

## Test Case 2: Incomplete Payment → Return Later
- [ ] Register new account
- [ ] Get redirected to payment page
- [ ] **Close browser WITHOUT completing payment**
- [ ] Open browser again
- [ ] Navigate to `/auth/login`
- [ ] Enter credentials (email + password)
- [ ] **Verify automatic redirect to payment page with correct params**
- [ ] Verify URL contains: `email`, `plan`, `userId`
- [ ] Complete payment
- [ ] Verify email
- [ ] Login successfully
- [ ] Access dashboard

## Test Case 3: Payment Cancelled
- [ ] Register new account
- [ ] Get redirected to payment page
- [ ] Click "Continue to Payment"
- [ ] On Stripe checkout, click "Back" or close window
- [ ] Verify return to payment page with `cancelled=true` param
- [ ] Verify yellow warning message shows: "Payment Cancelled"
- [ ] Complete payment successfully
- [ ] Continue with verification

## Test Case 4: Email Not Verified
- [ ] Register and complete payment
- [ ] Do NOT verify email
- [ ] Try to login
- [ ] Verify error: "Email verification required"
- [ ] Click "Resend verification email"
- [ ] Check email inbox
- [ ] Verify email
- [ ] Login successfully

## Test Case 5: Invalid Credentials
- [ ] Navigate to `/auth/login`
- [ ] Enter wrong password
- [ ] Verify error: "Invalid credentials"
- [ ] Verify remaining attempts shown
- [ ] Try 5 times with wrong password
- [ ] Verify rate limit error after 5 attempts
- [ ] Wait 15 minutes or test with different email

## Test Case 6: Direct Payment Page Access
- [ ] Try to access `/auth/payment` without params
- [ ] Verify redirect to `/pricing`
- [ ] Try with missing `userId` param
- [ ] Verify redirect to `/pricing`

## Test Case 7: Multiple Login Attempts with Pending Payment
- [ ] Register account (don't pay)
- [ ] Try to login → redirected to payment
- [ ] Close browser
- [ ] Try to login again → redirected to payment
- [ ] Verify same payment URL each time
- [ ] Complete payment
- [ ] Login successfully

## Test Case 8: Webhook Processing
- [ ] Complete payment
- [ ] Check server logs for webhook event
- [ ] Verify log: "✅ Payment successful for user {userId}, plan: {plan}"
- [ ] Check database: `subscription_status` = 'active'
- [ ] Check database: `stripe_customer_id` populated
- [ ] Check database: `stripe_subscription_id` populated
- [ ] Verify verification email sent

## Test Case 9: Session Management
- [ ] Login successfully
- [ ] Check browser cookies for `session-token`
- [ ] Verify cookie is HTTP-only
- [ ] Verify cookie expires in 7 days
- [ ] Close browser and reopen
- [ ] Navigate to `/dashboard`
- [ ] Verify still logged in (session persists)

## Test Case 10: Plan Selection Persistence
- [ ] Register with "Starter" plan
- [ ] Don't complete payment
- [ ] Login later
- [ ] Verify redirect shows "Starter" plan
- [ ] Complete payment
- [ ] Verify charged for Starter plan ($10/month)

## Database Verification Queries

### Check User Subscription Status
```sql
SELECT 
  id, 
  email, 
  subscription_status, 
  subscription_plan,
  email_verified,
  stripe_customer_id,
  telnyx_phone_number
FROM users 
WHERE email = 'test@example.com';
```

### Check Payment Records
```sql
SELECT * FROM payments 
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

## Stripe Test Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires Authentication**: 4000 0025 0000 3155

## Expected API Responses

### Login with Pending Payment
```json
{
  "error": "Payment required. Please complete your payment to access your account.",
  "needsPayment": true,
  "email": "user@example.com",
  "userId": "uuid-here",
  "plan": "professional"
}
```

### Login with Unverified Email
```json
{
  "error": "Email verification required. Please check your email and verify your account before logging in.",
  "needsVerification": true,
  "email": "user@example.com"
}
```

### Successful Login
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "emailVerified": true
  },
  "phoneNumber": "+1234567890",
  "subscription": {
    "status": "active",
    "plan": "professional"
  },
  "needsVerification": false
}
```

## Environment Setup for Testing

### Required Environment Variables
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
TELNYX_API_KEY=...
EMAIL_SERVICE_API_KEY=...
```

### Start Stripe Webhook Listener
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### Start Development Server
```bash
npm run dev
```

## Common Issues & Solutions

### Issue: Redirect loop on login
**Solution**: Check subscription_status in database, ensure it's 'active' after payment

### Issue: Payment webhook not firing
**Solution**: Ensure Stripe CLI is running and webhook secret is correct

### Issue: Email verification link not working
**Solution**: Check email service configuration and token generation

### Issue: Telnyx number not assigned
**Solution**: Check Telnyx API key and available numbers in pool

### Issue: Session not persisting
**Solution**: Check cookie settings, ensure httpOnly and sameSite are correct

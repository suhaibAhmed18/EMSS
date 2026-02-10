# Payment Flow - Quick Reference

## User Journey

```
1. User visits /pricing
   ↓
2. Selects a plan (Starter/Professional/Enterprise)
   ↓
3. Redirected to /auth/register?plan=selected_plan
   ↓
4. Fills registration form (name, email, password)
   ↓
5. Account created (status: inactive, no subscription)
   ↓
6. Redirected to /auth/payment?email=...&plan=...&userId=...
   ↓
7. Clicks "Continue to Payment"
   ↓
8. Redirected to Stripe Checkout (secure payment page)
   ↓
9. Enters card details and completes payment
   ↓
10. Stripe processes payment
    ↓
11. Webhook receives checkout.session.completed event
    ↓
12. System updates user:
    - subscription_status = 'active'
    - subscription_plan = selected plan
    - stripe_customer_id = Stripe customer ID
    - stripe_subscription_id = Stripe subscription ID
    ↓
13. Verification email sent automatically
    ↓
14. User redirected to /auth/payment-success
    ↓
15. User clicks verification link in email
    ↓
16. Email verified (emailVerified = true)
    ↓
17. User can now login at /auth/login
    ↓
18. Login checks:
    - Valid credentials ✓
    - Email verified ✓
    - Subscription active ✓
    ↓
19. User redirected to /dashboard
```

## Login Validation Flow

```
User attempts login
  ↓
Check credentials
  ├─ Invalid → Return error
  └─ Valid → Continue
      ↓
Check email verification
  ├─ Not verified → Return error + resend option
  └─ Verified → Continue
      ↓
Check subscription status
  ├─ Not active → Return error + link to pricing
  └─ Active → Continue
      ↓
Assign Telnyx phone number (if not assigned)
  ↓
Create session
  ↓
Redirect to dashboard
```

## Payment States

### User Subscription Status

- **inactive**: Default state, no payment made
- **active**: Payment successful, can access dashboard
- **past_due**: Payment failed, access may be restricted
- **cancelled**: Subscription cancelled by user

### Required for Dashboard Access

1. ✓ Account exists
2. ✓ Email verified
3. ✓ Subscription status = 'active'
4. ✓ Valid session

## API Calls

### Registration
```javascript
POST /api/auth/register
Body: { name, email, password, plan }
Response: { user: { id, email, name } }
```

### Create Checkout
```javascript
POST /api/payments/create-checkout
Body: { userId, email, plan, amount }
Response: { sessionId, url }
```

### Webhook (Stripe → Server)
```javascript
POST /api/payments/webhook
Headers: { stripe-signature }
Body: Stripe event object
```

### Verify Session
```javascript
POST /api/payments/verify-session
Body: { sessionId }
Response: { success, session }
```

### Login
```javascript
POST /api/auth/login
Body: { email, password }
Response: 
  - Success: { user, phoneNumber }
  - Email not verified: { error, needsVerification: true }
  - Payment required: { error, needsPayment: true }
```

## Stripe Test Cards

### Successful Payment
```
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### Payment Declined
```
Card: 4000 0000 0000 0002
```

### Requires Authentication
```
Card: 4000 0025 0000 3155
```

## Environment Variables Required

```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=onboarding@resend.dev
```

## Database Updates

### On Registration
```sql
INSERT INTO users (
  name, email, password_hash, 
  subscription_status, subscription_plan
) VALUES (
  'John Doe', 'john@example.com', 'hashed_password',
  'inactive', 'starter'
);
```

### On Payment Success (via webhook)
```sql
UPDATE users SET
  subscription_status = 'active',
  subscription_plan = 'starter',
  payment_id = 'cs_test_...',
  stripe_customer_id = 'cus_...',
  stripe_subscription_id = 'sub_...'
WHERE id = 'user_id';
```

### On Email Verification
```sql
UPDATE users SET
  email_verified = true,
  email_verified_at = NOW()
WHERE id = 'user_id';
```

## Quick Testing Checklist

- [ ] Can access /pricing without login
- [ ] Can select a plan and register
- [ ] Registration creates inactive user
- [ ] Payment page loads with correct plan
- [ ] Stripe checkout opens
- [ ] Test card payment succeeds
- [ ] Webhook processes payment
- [ ] User subscription becomes active
- [ ] Verification email received
- [ ] Email verification works
- [ ] Login blocked before verification
- [ ] Login blocked without payment
- [ ] Login succeeds after both
- [ ] Dashboard accessible after login

## Common Issues

### "Payment required" on login
- Check subscription_status in database
- Verify webhook processed successfully
- Check Stripe dashboard for payment

### Webhook not firing
- Verify webhook URL is accessible
- Check webhook signing secret
- Use Stripe CLI for local testing

### Email not received
- Check spam folder
- Verify RESEND_API_KEY
- Check email service logs

### Can't access dashboard
- Verify email is verified
- Check subscription is active
- Clear browser cookies and retry

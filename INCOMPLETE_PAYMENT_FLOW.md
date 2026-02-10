# Incomplete Payment Flow Implementation

## Overview
This document describes the complete flow for handling users who register but don't complete payment, allowing them to return later and complete the transaction. **All checkout sessions are now tracked in the database** for better monitoring and analytics.

## Database Tracking

### Payment Checkout Sessions Table
All incomplete payment attempts are stored in the `payment_checkout_sessions` table:

```sql
CREATE TABLE payment_checkout_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  subscription_plan VARCHAR(50) NOT NULL,
  plan_price DECIMAL(10, 2) NOT NULL,
  payment_provider VARCHAR(50) NOT NULL,
  stripe_session_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  metadata JSONB
);
```

### Session Status Values
- `pending`: Checkout initiated but not completed
- `completed`: Payment successful
- `expired`: Session expired (24 hours)
- `cancelled`: User cancelled payment
- `failed`: Payment failed

### Helper Functions
- `get_or_create_checkout_session()`: Creates or retrieves existing session
- `complete_checkout_session()`: Marks session as completed
- `expire_old_checkout_sessions()`: Expires sessions older than 24 hours
- `get_latest_checkout_session()`: Gets user's most recent session

## User Flow

### Scenario 1: New User Registration → Payment
1. User visits `/pricing` and selects a plan
2. User clicks "Get Started" → redirected to `/auth/register?plan={plan}`
3. User fills registration form (firstName, lastName, email, password)
4. On submit:
   - API creates user account with `subscription_status: 'pending'`
   - User redirected to `/auth/payment?email={email}&plan={plan}&userId={userId}`
5. User completes Stripe payment
6. Stripe webhook updates user to `subscription_status: 'active'`
7. Verification email sent to user
8. User redirected to `/auth/payment-success`
9. User verifies email via link
10. User logs in → redirected to `/dashboard`
11. Telnyx phone number auto-assigned on first login

### Scenario 2: User Leaves Before Payment → Returns Later
1. User registers but closes browser before completing payment
2. User returns later and goes to `/auth/login`
3. User enters credentials
4. Login API checks:
   - ✅ Credentials valid
   - ✅ Email verified (if not, shows verification required)
   - ❌ Subscription status is NOT 'active'
5. API returns:
   ```json
   {
     "error": "Payment required. Please complete your payment to access your account.",
     "needsPayment": true,
     "email": "user@example.com",
     "userId": "uuid",
     "plan": "professional"
   }
   ```
6. Login page automatically redirects to:
   `/auth/payment?email={email}&plan={plan}&userId={userId}`
7. User completes payment
8. Flow continues from step 6 in Scenario 1

## Technical Implementation

### 1. Login API (`src/app/api/auth/login/route.ts`)
```typescript
// Check subscription status after authentication
if (!userData?.subscription_status || userData.subscription_status !== 'active') {
  return NextResponse.json(
    { 
      error: 'Payment required. Please complete your payment to access your account.',
      needsPayment: true,
      email: user.email,
      userId: user.id,
      plan: userData?.subscription_plan || 'starter'
    },
    { status: 403 }
  )
}
```

### 2. Login Page (`src/app/auth/login/page.tsx`)
```typescript
// Handle payment required response
else if (response.status === 403 && data.needsPayment) {
  // Payment required - redirect to payment page
  const paymentUrl = `/auth/payment?email=${encodeURIComponent(data.email || email)}&plan=${data.plan || 'starter'}&userId=${data.userId}`;
  console.log("🔄 Redirecting to payment page:", paymentUrl);
  router.push(paymentUrl);
  return;
}
```

### 3. Payment Page (`src/app/auth/payment/page.tsx`)
- Accepts URL parameters: `email`, `plan`, `userId`
- Creates database checkout session record
- Creates Stripe Checkout session
- Links database session with Stripe session ID
- Redirects to Stripe for payment
- Success URL: `/auth/payment-success?session_id={CHECKOUT_SESSION_ID}&email={email}`
- Cancel URL: `/auth/payment?email={email}&plan={plan}&userId={userId}&cancelled=true`

### 4. Create Checkout API (`src/app/api/payments/create-checkout/route.ts`)
```typescript
// Create database session first
const { data: dbSession } = await supabase
  .rpc('get_or_create_checkout_session', {
    p_user_id: userId,
    p_email: email,
    p_plan: plan,
    p_price: amount,
    p_provider: 'stripe'
  })

// Create Stripe session
const session = await stripe.checkout.sessions.create({
  // ... stripe config
  metadata: {
    userId,
    plan,
    checkoutSessionId: dbSession
  }
})

// Update database with Stripe session ID
await supabase
  .from('payment_checkout_sessions')
  .update({ stripe_session_id: session.id })
  .eq('id', dbSession)
```

### 5. Stripe Webhook (`src/app/api/payments/webhook/route.ts`)
```typescript
case 'checkout.session.completed': {
  // Update user subscription to active
  await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_plan: plan,
      payment_id: session.id,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
    })
    .eq('id', userId)
  
  // Mark checkout session as completed in database
  await supabase
    .rpc('complete_checkout_session', {
      p_session_id: checkoutSessionId,
      p_stripe_session_id: session.id,
      p_stripe_customer_id: session.customer as string
    })
  
  // Send verification email
  const verificationToken = tokenService.createVerificationToken(email)
  await emailService.sendVerificationEmail(email, verificationToken)
}
```

### 6. Payment Success Page (`src/app/auth/payment-success/page.tsx`)
- Verifies payment session with Stripe
- Shows success message
- Instructs user to verify email
- Provides link to login page

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  subscription_status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'active', 'cancelled', 'past_due'
  subscription_plan VARCHAR(50) DEFAULT 'starter',    -- 'starter', 'professional', 'enterprise'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  payment_id VARCHAR(255),
  telnyx_phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Subscription Status Values
- `pending`: User registered but hasn't completed payment
- `active`: Payment completed and subscription active
- `cancelled`: User cancelled subscription
- `past_due`: Payment failed, subscription at risk
- `inactive`: Subscription expired or deactivated

## Security Considerations
1. **Rate Limiting**: Login attempts limited to 5 per 15 minutes
2. **Session Management**: HTTP-only cookies with 7-day expiration
3. **Email Verification**: Required before dashboard access
4. **Payment Verification**: Webhook signature verification for Stripe events
5. **Secure Redirects**: All payment URLs use HTTPS in production

## Testing the Flow

### Test Incomplete Payment Flow
1. Register new account at `/auth/register?plan=professional`
2. Close browser before completing payment
3. Go to `/auth/login`
4. Enter credentials
5. Verify redirect to `/auth/payment` with correct parameters
6. Complete payment
7. Verify email
8. Login successfully
9. Verify dashboard access

### Test Stripe Webhook Locally
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

## Environment Variables Required
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/session` - Check current session
- `POST /api/auth/resend-verification` - Resend verification email

### Payments
- `POST /api/payments/create-checkout` - Create Stripe checkout session
- `POST /api/payments/verify-session` - Verify payment completion
- `POST /api/payments/webhook` - Stripe webhook handler

## Error Handling

### Login Errors
- **401**: Invalid credentials
- **403 + needsVerification**: Email not verified
- **403 + needsPayment**: Payment required (redirects to payment page)
- **429**: Rate limit exceeded

### Payment Errors
- Missing parameters → Redirect to `/pricing`
- Stripe checkout creation fails → Show error message
- Payment cancelled → Return to payment page with `cancelled=true` param

## Future Enhancements
1. Add payment retry logic for failed payments
2. Implement subscription upgrade/downgrade flow
3. Add grace period for expired subscriptions
4. Send reminder emails for incomplete payments
5. Add payment history page in dashboard

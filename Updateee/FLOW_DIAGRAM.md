# Visual Flow Diagram: Registration → Payment → Login

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER REGISTRATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   STEP 1:    │
│   PRICING    │
└──────┬───────┘
       │
       │ User visits /pricing
       │ Views 3 plans: Starter ($10), Professional ($20), Enterprise ($30)
       │ Clicks "Get Started" on desired plan
       │
       ▼
┌──────────────────────┐
│      STEP 2:         │
│   REGISTRATION       │
└──────┬───────────────┘
       │
       │ URL: /auth/register?plan=professional
       │ 
       │ Form Fields:
       │ ├─ First Name
       │ ├─ Last Name
       │ ├─ Email
       │ ├─ Password
       │ └─ Confirm Password
       │
       │ POST /api/auth/register
       │ {
       │   firstName: "John",
       │   lastName: "Doe",
       │   email: "john@example.com",
       │   password: "SecurePass123",
       │   plan: "professional"
       │ }
       │
       │ ✅ Account Created
       │ ├─ User ID: uuid
       │ ├─ Email: john@example.com
       │ ├─ subscription_status: 'pending'
       │ └─ subscription_plan: 'professional'
       │
       ▼
┌──────────────────────┐
│      STEP 3:         │
│      PAYMENT         │
└──────┬───────────────┘
       │
       │ URL: /auth/payment?email=john@example.com&plan=professional&userId=uuid
       │
       │ Order Summary:
       │ ├─ Plan: Professional
       │ ├─ Price: $20/month
       │ └─ Email: john@example.com
       │
       │ User clicks "Continue to Payment"
       │
       │ POST /api/payments/create-checkout
       │ {
       │   userId: "uuid",
       │   email: "john@example.com",
       │   plan: "professional",
       │   amount: 20
       │ }
       │
       │ ✅ Stripe Checkout Session Created
       │ └─ Redirect to: https://checkout.stripe.com/...
       │
       ▼
┌──────────────────────┐
│      STEP 4:         │
│  STRIPE CHECKOUT     │
└──────┬───────────────┘
       │
       │ User enters payment details:
       │ ├─ Card: 4242 4242 4242 4242
       │ ├─ Expiry: 12/25
       │ ├─ CVC: 123
       │ └─ ZIP: 12345
       │
       │ Stripe processes payment
       │
       │ ✅ Payment Successful
       │ └─ Redirect to: /auth/payment-success?session_id=cs_...
       │
       ▼
┌──────────────────────┐
│      STEP 5:         │
│  WEBHOOK PROCESSING  │
└──────┬───────────────┘
       │
       │ Stripe sends webhook event:
       │ POST /api/payments/webhook
       │ Event: checkout.session.completed
       │
       │ Webhook Handler:
       │ ├─ Verify signature
       │ ├─ Extract metadata (userId, plan)
       │ ├─ Update user record:
       │ │  ├─ subscription_status: 'active'
       │ │  ├─ stripe_customer_id: 'cus_...'
       │ │  └─ stripe_subscription_id: 'sub_...'
       │ └─ Send verification email
       │
       │ ✅ Account Activated
       │ ✅ Verification Email Sent
       │
       ▼
┌──────────────────────┐
│      STEP 6:         │
│ EMAIL VERIFICATION   │
└──────┬───────────────┘
       │
       │ User receives email:
       │ Subject: "Verify Your Email Address - MarketingPro"
       │ 
       │ Email contains:
       │ └─ Verification link: /auth/verify?token=abc123...
       │
       │ User clicks link
       │
       │ GET /api/auth/verify?token=abc123...
       │
       │ Verification Handler:
       │ ├─ Validate token
       │ ├─ Check expiry (24 hours)
       │ ├─ Update user:
       │ │  ├─ email_verified: true
       │ │  └─ email_verified_at: NOW()
       │ └─ Redirect to login
       │
       │ ✅ Email Verified
       │ └─ Redirect to: /auth/login?verified=true
       │
       ▼
┌──────────────────────┐
│      STEP 7:         │
│       LOGIN          │
└──────┬───────────────┘
       │
       │ URL: /auth/login?verified=true
       │ 
       │ Success message displayed:
       │ "Email verified successfully! You can now sign in."
       │
       │ User enters credentials:
       │ ├─ Email: john@example.com
       │ └─ Password: SecurePass123
       │
       │ POST /api/auth/login
       │ {
       │   email: "john@example.com",
       │   password: "SecurePass123"
       │ }
       │
       │ Login Handler Checks:
       │ ├─ ✅ Valid credentials?
       │ ├─ ✅ Email verified? (email_verified = true)
       │ ├─ ✅ Payment completed? (subscription_status = 'active')
       │ └─ ✅ Rate limit not exceeded?
       │
       │ All checks passed!
       │
       │ Actions:
       │ ├─ Assign Telnyx phone number
       │ ├─ Create session token
       │ ├─ Set HTTP-only cookie
       │ └─ Update last login timestamp
       │
       │ ✅ Login Successful
       │ └─ Redirect to: /dashboard
       │
       ▼
┌──────────────────────┐
│      STEP 8:         │
│     DASHBOARD        │
└──────────────────────┘
       │
       │ User is now logged in!
       │
       │ Dashboard shows:
       │ ├─ Welcome message
       │ ├─ Subscription plan: Professional
       │ ├─ Telnyx phone number: +1234567890
       │ ├─ Available features
       │ └─ Quick actions
       │
       │ ✅ User can now:
       │ ├─ Send SMS campaigns
       │ ├─ Send email campaigns
       │ ├─ Manage contacts
       │ ├─ Create automations
       │ └─ View analytics
       │
       └─ 🎉 SUCCESS!
```

## Security Checkpoints

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SECURITY LAYERS                                  │
└─────────────────────────────────────────────────────────────────────────┘

Registration:
├─ Input validation
├─ Email format check
├─ Password strength check
├─ Duplicate email prevention
└─ SHA-256 password hashing

Payment:
├─ Stripe PCI compliance
├─ Webhook signature verification
├─ Metadata validation
├─ Payment status check
└─ Subscription activation

Email Verification:
├─ Token generation
├─ 24-hour expiry
├─ One-time use
├─ Secure token validation
└─ Email verification flag

Login:
├─ Rate limiting (5 attempts/15 min)
├─ Credential validation
├─ Email verification check
├─ Payment verification check
├─ Session creation
└─ HTTP-only cookie
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ERROR SCENARIOS                                  │
└─────────────────────────────────────────────────────────────────────────┘

Login Attempt
     │
     ├─ Email not verified?
     │  └─ ❌ Error: "Email verification required"
     │     └─ Show "Resend verification email" button
     │
     ├─ Payment not completed?
     │  └─ ❌ Error: "Payment required"
     │     └─ Show "Go to Pricing" link
     │
     ├─ Invalid credentials?
     │  └─ ❌ Error: "Invalid credentials"
     │     └─ Show remaining attempts
     │
     ├─ Rate limit exceeded?
     │  └─ ❌ Error: "Too many attempts"
     │     └─ Show lockout duration (15 min)
     │
     └─ All checks passed?
        └─ ✅ Login successful
           └─ Redirect to dashboard
```

## Database State Changes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE STATE TRANSITIONS                            │
└─────────────────────────────────────────────────────────────────────────┘

Registration:
users {
  id: uuid
  email: "john@example.com"
  password_hash: "sha256..."
  email_verified: FALSE          ◄─── Not verified yet
  subscription_status: 'pending' ◄─── Awaiting payment
  subscription_plan: 'professional'
  created_at: NOW()
}

After Payment (Webhook):
users {
  id: uuid
  email: "john@example.com"
  password_hash: "sha256..."
  email_verified: FALSE          ◄─── Still not verified
  subscription_status: 'active'  ◄─── Payment completed!
  subscription_plan: 'professional'
  stripe_customer_id: 'cus_...'  ◄─── Added
  stripe_subscription_id: 'sub_...' ◄─── Added
  payment_id: 'cs_...'           ◄─── Added
  created_at: NOW()
}

After Email Verification:
users {
  id: uuid
  email: "john@example.com"
  password_hash: "sha256..."
  email_verified: TRUE           ◄─── Verified!
  email_verified_at: NOW()       ◄─── Added
  subscription_status: 'active'
  subscription_plan: 'professional'
  stripe_customer_id: 'cus_...'
  stripe_subscription_id: 'sub_...'
  payment_id: 'cs_...'
  created_at: NOW()
}

After First Login:
users {
  id: uuid
  email: "john@example.com"
  password_hash: "sha256..."
  email_verified: TRUE
  email_verified_at: NOW()
  subscription_status: 'active'
  subscription_plan: 'professional'
  stripe_customer_id: 'cus_...'
  stripe_subscription_id: 'sub_...'
  payment_id: 'cs_...'
  telnyx_phone_number: '+1234567890' ◄─── Added
  created_at: NOW()
  updated_at: NOW()              ◄─── Updated
}
```

## API Call Sequence

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         API CALL FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

1. GET /pricing
   └─ Response: Pricing plans HTML

2. GET /api/subscriptions/plans
   └─ Response: { plans: [...] }

3. POST /api/auth/register
   ├─ Request: { firstName, lastName, email, password, plan }
   └─ Response: { user: {...}, needsVerification: true }

4. POST /api/payments/create-checkout
   ├─ Request: { userId, email, plan, amount }
   └─ Response: { sessionId, url }

5. [User completes payment on Stripe]

6. POST /api/payments/webhook (from Stripe)
   ├─ Event: checkout.session.completed
   └─ Action: Update user, send verification email

7. GET /api/auth/verify?token=...
   └─ Action: Verify email, redirect to login

8. POST /api/auth/login
   ├─ Request: { email, password }
   └─ Response: { user: {...}, phoneNumber, subscription: {...} }

9. GET /dashboard
   └─ Response: Dashboard HTML (protected route)
```

## Session Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                                   │
└─────────────────────────────────────────────────────────────────────────┘

Login Success:
├─ Generate session token: "session-{userId}"
├─ Set HTTP-only cookie:
│  ├─ Name: "session-token"
│  ├─ Value: "session-{userId}"
│  ├─ HttpOnly: true
│  ├─ Secure: true (production)
│  ├─ SameSite: "lax"
│  ├─ MaxAge: 7 days
│  └─ Path: "/"
└─ Store in browser cookies

Protected Route Access:
├─ Middleware checks cookie
├─ Extract userId from token
├─ Validate user exists
├─ Check subscription status
└─ Allow/deny access

Logout:
├─ Delete session cookie
└─ Redirect to login
```

## Webhook Event Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      STRIPE WEBHOOK EVENTS                               │
└─────────────────────────────────────────────────────────────────────────┘

checkout.session.completed:
├─ Extract metadata (userId, plan)
├─ Update subscription_status: 'active'
├─ Save Stripe IDs
└─ Send verification email

customer.subscription.updated:
├─ Extract userId from metadata
├─ Update subscription_status
└─ Log event

customer.subscription.deleted:
├─ Extract userId from metadata
├─ Update subscription_status: 'cancelled'
└─ Log event

invoice.payment_failed:
├─ Extract userId from metadata
├─ Update subscription_status: 'past_due'
└─ Send notification email
```

---

**This visual diagram shows the complete flow from pricing selection to dashboard access with all security checkpoints and database state changes.**

# Payment Flow Diagram

## Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEW USER REGISTRATION                            │
└─────────────────────────────────────────────────────────────────────────┘

    /pricing
       │
       ├─> Select Plan (Starter/Professional/Enterprise)
       │
       ▼
    /auth/register?plan=professional
       │
       ├─> Fill Form (firstName, lastName, email, password)
       │
       ▼
    POST /api/auth/register
       │
       ├─> Create User (subscription_status: 'pending')
       │
       ▼
    /auth/payment?email=...&plan=...&userId=...
       │
       ├─> Select Payment Method (Stripe/PayPal)
       │
       ▼
    POST /api/payments/create-checkout
       │
       ├─> Create Stripe Checkout Session
       │
       ▼
    Stripe Checkout Page
       │
       ├─────────────┬─────────────┐
       │             │             │
       ▼             ▼             ▼
   Complete      Cancel        Close
       │             │             │
       │             │             └─> Browser Closed
       │             │                      │
       │             │                      │
       │             ▼                      │
       │    /auth/payment?                 │
       │    cancelled=true                 │
       │             │                      │
       │             └──────────────────────┘
       │                      │
       ▼                      │
   Stripe Webhook            │
   (checkout.session.        │
    completed)                │
       │                      │
       ├─> Update User:       │
       │   - subscription_    │
       │     status: 'active' │
       │   - stripe_customer_ │
       │     id               │
       │   - stripe_          │
       │     subscription_id  │
       │                      │
       ├─> Send Verification │
       │   Email              │
       │                      │
       ▼                      │
   /auth/payment-success     │
       │                      │
       ├─> Verify Payment     │
       │   Session            │
       │                      │
       ├─> Show Success       │
       │   Message            │
       │                      │
       ▼                      │
   User Checks Email         │
       │                      │
       ├─> Click              │
       │   Verification Link  │
       │                      │
       ▼                      │
   /auth/verify-email?       │
   token=...                 │
       │                      │
       ├─> Update User:       │
       │   email_verified:    │
       │   true               │
       │                      │
       ▼                      │
   /auth/login               │
       │                      │
       ├─> Enter Credentials  │
       │                      │
       ▼                      │
   POST /api/auth/login      │
       │                      │
       ├─> Check:             │
       │   ✓ Credentials      │
       │   ✓ Email Verified   │
       │   ✓ Subscription     │
       │     Active           │
       │                      │
       ├─> Assign Telnyx     │
       │   Phone Number       │
       │                      │
       ▼                      │
   /dashboard                │
       │                      │
       └─> SUCCESS! ✓         │
                              │
┌──────────────────────────────┘
│
│  INCOMPLETE PAYMENT SCENARIO
│
└─> User Closes Browser Before Payment
       │
       │ (Days/Hours Later)
       │
       ▼
    /auth/login
       │
       ├─> Enter Credentials
       │
       ▼
    POST /api/auth/login
       │
       ├─> Check:
       │   ✓ Credentials Valid
       │   ✓ Email Verified (or show verification required)
       │   ✗ Subscription Status: 'pending'
       │
       ├─> Return Response:
       │   {
       │     "needsPayment": true,
       │     "email": "...",
       │     "userId": "...",
       │     "plan": "..."
       │   }
       │
       ▼
    Auto-Redirect to:
    /auth/payment?email=...&plan=...&userId=...
       │
       └─> Continue from Payment Flow Above
```

## State Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION STATUS FLOW                      │
└─────────────────────────────────────────────────────────────────┘

    [Registration]
         │
         ▼
    ┌─────────┐
    │ pending │ ◄──────────────┐
    └─────────┘                │
         │                     │
         │ Payment             │ Payment
         │ Completed           │ Cancelled
         │                     │
         ▼                     │
    ┌─────────┐          ┌─────────┐
    │ active  │ ────────>│cancelled│
    └─────────┘ Cancel   └─────────┘
         │      Sub
         │
         │ Payment
         │ Failed
         │
         ▼
    ┌─────────┐
    │past_due │
    └─────────┘
         │
         │ Grace
         │ Period
         │ Expired
         │
         ▼
    ┌─────────┐
    │inactive │
    └─────────┘
```

## Login Decision Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW DECISIONS                        │
└─────────────────────────────────────────────────────────────────┘

    POST /api/auth/login
         │
         ├─> Credentials Valid?
         │   │
         │   ├─> NO ──> Return 401 "Invalid credentials"
         │   │
         │   └─> YES
         │       │
         │       ├─> Email Verified?
         │       │   │
         │       │   ├─> NO ──> Return 403 "Email verification required"
         │       │   │           + needsVerification: true
         │       │   │
         │       │   └─> YES
         │       │       │
         │       │       ├─> Subscription Active?
         │       │       │   │
         │       │       │   ├─> NO ──> Return 403 "Payment required"
         │       │       │   │           + needsPayment: true
         │       │       │   │           + userId, email, plan
         │       │       │   │           │
         │       │       │   │           └─> Frontend Redirects to:
         │       │       │   │               /auth/payment?...
         │       │       │   │
         │       │       │   └─> YES
         │       │       │       │
         │       │       │       ├─> Assign Telnyx Number
         │       │       │       │   (if not already assigned)
         │       │       │       │
         │       │       │       ├─> Set Session Cookie
         │       │       │       │
         │       │       │       └─> Return 200 Success
         │       │       │           + user data
         │       │       │           + subscription info
         │       │       │           │
         │       │       │           └─> Frontend Redirects to:
         │       │       │               /dashboard
         │       │       │
         │       │       └─> Rate Limited?
         │       │           │
         │       │           └─> YES ──> Return 429 "Too many attempts"
         │       │
         │       └─> [Continue with checks above]
         │
         └─> [Process login]
```

## API Response Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    API RESPONSE HANDLING                         │
└─────────────────────────────────────────────────────────────────┘

Login Response Codes:

┌─────────┬──────────────────────────┬─────────────────────────┐
│  Code   │       Condition          │      Frontend Action    │
├─────────┼──────────────────────────┼─────────────────────────┤
│  200    │ Login Successful         │ Redirect to /dashboard  │
├─────────┼──────────────────────────┼─────────────────────────┤
│  401    │ Invalid Credentials      │ Show error message      │
├─────────┼──────────────────────────┼─────────────────────────┤
│  403    │ Email Not Verified       │ Show verification       │
│         │ needsVerification: true  │ required message +      │
│         │                          │ resend email button     │
├─────────┼──────────────────────────┼─────────────────────────┤
│  403    │ Payment Required         │ Auto-redirect to        │
│         │ needsPayment: true       │ /auth/payment with      │
│         │                          │ user data in URL        │
├─────────┼──────────────────────────┼─────────────────────────┤
│  429    │ Rate Limited             │ Show "Too many          │
│         │                          │ attempts" error         │
└─────────┴──────────────────────────┴─────────────────────────┘
```

## Database State Changes

```
┌─────────────────────────────────────────────────────────────────┐
│                  DATABASE STATE TIMELINE                         │
└─────────────────────────────────────────────────────────────────┘

Time    Event                   Database State
────────────────────────────────────────────────────────────────
T0      User Registers          users {
                                  email: "user@example.com"
                                  subscription_status: "pending"
                                  subscription_plan: "professional"
                                  email_verified: false
                                  stripe_customer_id: null
                                }

T1      Payment Completed       users {
        (Webhook Fired)           email: "user@example.com"
                                  subscription_status: "active" ✓
                                  subscription_plan: "professional"
                                  email_verified: false
                                  stripe_customer_id: "cus_xxx" ✓
                                  stripe_subscription_id: "sub_xxx" ✓
                                  payment_id: "cs_xxx" ✓
                                }

T2      Email Verified          users {
                                  email: "user@example.com"
                                  subscription_status: "active"
                                  subscription_plan: "professional"
                                  email_verified: true ✓
                                  stripe_customer_id: "cus_xxx"
                                  stripe_subscription_id: "sub_xxx"
                                  payment_id: "cs_xxx"
                                }

T3      First Login             users {
                                  email: "user@example.com"
                                  subscription_status: "active"
                                  subscription_plan: "professional"
                                  email_verified: true
                                  stripe_customer_id: "cus_xxx"
                                  stripe_subscription_id: "sub_xxx"
                                  payment_id: "cs_xxx"
                                  telnyx_phone_number: "+1234567890" ✓
                                }
```

## Key Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL INTEGRATIONS                         │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐         ┌──────────┐         ┌──────────┐
│  Stripe  │◄───────►│   App    │◄───────►│  Telnyx  │
└──────────┘         └──────────┘         └──────────┘
     │                    │                     │
     │                    │                     │
     ├─ Checkout         ├─ User Auth          ├─ SMS Number
     │  Session          │                     │  Assignment
     │                    │                     │
     ├─ Payment          ├─ Session            ├─ SMS Sending
     │  Processing       │  Management         │
     │                    │                     │
     └─ Webhooks         └─ Database           └─ Number Pool
        (Events)            (Supabase)             Management

┌──────────┐
│  Email   │
│ Service  │
└──────────┘
     │
     ├─ Verification
     │  Emails
     │
     ├─ Welcome
     │  Emails
     │
     └─ Payment
        Receipts
```

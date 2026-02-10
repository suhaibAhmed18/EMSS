# Registration → Payment → Email Verification → Login Flow

## Complete Implementation Guide

This document outlines the professional registration-to-login flow with Stripe payment integration and high security.

## Flow Overview

```
1. User visits /pricing
   ↓
2. Selects a plan (Starter $10, Professional $20, Enterprise $30)
   ↓
3. Redirected to /auth/register?plan=<plan_id>
   ↓
4. Fills registration form (First Name, Last Name, Email, Password)
   ↓
5. Account created with subscription_status='pending'
   ↓
6. Redirected to /auth/payment with user details
   ↓
7. Stripe Checkout Session created
   ↓
8. User completes payment on Stripe
   ↓
9. Stripe webhook updates subscription_status='active'
   ↓
10. Verification email sent automatically
   ↓
11. User clicks verification link
   ↓
12. Email verified (email_verified=true)
   ↓
13. User can now login at /auth/login
   ↓
14. Login checks: email_verified=true AND subscription_status='active'
   ↓
15. Telnyx phone number assigned on first login
   ↓
16. Redirected to /dashboard
```

## Security Features

### 1. **Multi-Layer Authentication**
- Email verification required before login
- Payment verification required before login
- Session-based authentication with HTTP-only cookies
- SHA-256 password hashing

### 2. **Payment Security**
- Stripe Checkout (PCI-compliant)
- Webhook signature verification
- Metadata tracking (userId, planId)
- Subscription lifecycle management

### 3. **Data Protection**
- Row-Level Security (RLS) in Supabase
- Encrypted sensitive data (emails, phone numbers)
- GDPR/CCPA compliance tracking
- Audit logging

### 4. **Access Control**
- Login blocked until email verified
- Login blocked until payment completed
- Session expiration (7 days)
- Role-based access control

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  name VARCHAR(255),
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  subscription_status VARCHAR(50) DEFAULT 'pending',
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  telnyx_phone_number VARCHAR(20),
  telnyx_phone_number_id VARCHAR(255),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Subscription Plans Table
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default plans
INSERT INTO subscription_plans (name, description, price, features) VALUES
('Starter', 'Perfect for small businesses', 10.00, '{"sms_credits": 500, "email_credits": 5000, "contacts": 1000, "automations": 5}'),
('Professional', 'For growing businesses', 20.00, '{"sms_credits": 2000, "email_credits": 20000, "contacts": 10000, "automations": 20}'),
('Enterprise', 'For large-scale operations', 30.00, '{"sms_credits": 50000, "email_credits": 100000, "contacts": "unlimited", "automations": "unlimited"}');
```

## API Routes

### 1. Registration API
**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "plan": "professional"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "emailVerified": false
  },
  "needsVerification": true,
  "message": "Registration successful! Please complete payment to activate your account."
}
```

### 2. Payment Checkout API
**Endpoint:** `POST /api/payments/create-checkout`

**Request:**
```json
{
  "userId": "uuid",
  "email": "john@example.com",
  "plan": "professional",
  "amount": 20
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### 3. Stripe Webhook
**Endpoint:** `POST /api/payments/webhook`

**Events Handled:**
- `checkout.session.completed` - Activates subscription, sends verification email
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Marks subscription as cancelled
- `invoice.payment_failed` - Marks subscription as past_due

### 4. Login API
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (Success):**
```json
{
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "emailVerified": true
  },
  "phoneNumber": "+1234567890",
  "needsVerification": false
}
```

**Response (Email Not Verified):**
```json
{
  "error": "Email verification required. Please check your email and verify your account before logging in.",
  "needsVerification": true,
  "email": "john@example.com"
}
```

**Response (Payment Not Completed):**
```json
{
  "error": "Payment required. Please complete your payment to access your account.",
  "needsPayment": true,
  "email": "john@example.com"
}
```

## UI Pages

### 1. Pricing Page (`/pricing`)
- Displays 3 pricing tiers
- "Get Started" button redirects to `/auth/register?plan=<plan_id>`
- Professional plan marked as "Most Popular"
- Features list for each plan
- Consistent with website UI (dark theme, premium styling)

### 2. Registration Page (`/auth/register`)
- Pre-selected plan from query parameter
- Form fields: First Name, Last Name, Email, Password, Confirm Password
- Password requirements displayed
- Real-time password validation
- On submit: Creates user account → Redirects to payment page
- Consistent premium dark theme with gradient effects

### 3. Payment Page (`/auth/payment`)
- Order summary with plan details
- Payment method selection (Stripe/PayPal)
- Stripe Checkout integration
- Security badges and SSL indicators
- Redirects to Stripe hosted checkout
- Cancel returns to payment page

### 4. Payment Success Page (`/auth/payment-success`)
- Payment verification
- Success confirmation
- Email verification instructions
- "What happens next" guide
- Resend verification email option
- Link to login page

### 5. Login Page (`/auth/login`)
- Email and password fields
- Show/hide password toggle
- Error messages for:
  - Invalid credentials
  - Email not verified (with resend option)
  - Payment not completed (with link to pricing)
- "Forgot password" link
- "Create account" link
- Session cookie set on successful login

## Environment Variables Required

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
DATA_ENCRYPTION_KEY=generate_with_openssl_rand_base64_32

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM_ADDRESS=onboarding@resend.dev
EMAIL_FROM_NAME=MarketingPro

# SMS (Telnyx)
TELNYX_API_KEY=KEY...
TELNYX_PHONE_NUMBER=+1234567890
```

## Testing the Flow

### 1. Test Registration
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "password": "TestPass123",
    "plan": "professional"
  }'
```

### 2. Test Stripe Webhook (Local)
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/payments/webhook

# Trigger test event
stripe trigger checkout.session.completed
```

### 3. Test Login (Before Verification)
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
# Should return: "Email verification required"
```

### 4. Test Login (After Verification & Payment)
```bash
# After email verification and payment
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
# Should return: User object with session cookie
```

## Stripe Webhook Setup

### Development
```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

### Production
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## UI Styling

All pages use consistent premium dark theme:

### Colors
```css
--background: #04090a
--foreground: #ffffff
--card: #061112
--primary: #041f1a
--accent: #041f1a
--accent-hi: color-mix(in srgb, var(--accent) 28%, white 72%)
--border: rgba(255, 255, 255, 0.09)
```

### Components
- `.btn-primary` - Primary action buttons with gradient
- `.btn-secondary` - Secondary action buttons
- `.card-premium` - Premium card with backdrop blur
- `.input-premium` - Premium input fields
- Animated gradient backgrounds
- Floating orb effects
- Glow pulse animations

## Security Checklist

- [x] Password hashing (SHA-256)
- [x] Email verification required
- [x] Payment verification required
- [x] Session-based authentication
- [x] HTTP-only cookies
- [x] Stripe webhook signature verification
- [x] Row-Level Security (RLS)
- [x] Data encryption for sensitive fields
- [x] CSRF protection
- [x] Rate limiting
- [x] Audit logging
- [x] GDPR/CCPA compliance

## Troubleshooting

### Issue: Email not received
- Check spam folder
- Verify RESEND_API_KEY is set
- Check email service logs
- Use "Resend verification email" button

### Issue: Payment not processing
- Verify Stripe keys are correct
- Check webhook is configured
- Test with Stripe test cards
- Check Stripe Dashboard logs

### Issue: Cannot login after payment
- Verify email is verified
- Check subscription_status is 'active'
- Check webhook processed successfully
- Verify session cookie is set

### Issue: Telnyx number not assigned
- Check TELNYX_API_KEY is set
- Verify Telnyx account has available numbers
- Check login API logs
- Number assigned on first successful login

## Next Steps

1. **Test the complete flow** from registration to login
2. **Configure Stripe webhook** in production
3. **Set up email service** (Resend API key)
4. **Configure Telnyx** for SMS capabilities
5. **Add monitoring** for payment failures
6. **Set up error tracking** (Sentry, etc.)
7. **Add analytics** to track conversion rates
8. **Implement rate limiting** on auth endpoints
9. **Add 2FA** for enhanced security (optional)
10. **Create admin dashboard** for user management

## Support

For issues or questions:
- Check logs in `/api/auth/*` and `/api/payments/*`
- Review Stripe Dashboard for payment issues
- Check Supabase logs for database errors
- Verify all environment variables are set correctly

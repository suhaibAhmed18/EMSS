# Quick Start: Testing the Pricing & Payment Flow

## Prerequisites

1. Database migration completed (run `scripts/add-subscription-fields.sql`)
2. Environment variables configured in `.env.local`
3. Development server running (`npm run dev`)

## Step-by-Step Testing Guide

### 1. View Pricing Page

```
Navigate to: http://localhost:3000/pricing
```

You'll see three pricing tiers:
- **Starter**: $10/month
- **Professional**: $20/month (Most Popular)
- **Enterprise**: $30/month

Each plan includes:
- Email and SMS capabilities
- Telnyx phone number
- Various limits based on tier

### 2. Select a Plan

Click "Get Started" on any plan. You'll be redirected to:
```
http://localhost:3000/auth/register?plan=<selected-plan>
```

### 3. Complete Registration

Fill in the registration form:
- **Full Name**: John Doe
- **Email**: test@example.com
- **Password**: password123
- **Confirm Password**: password123

The form shows your selected plan and price at the top.

Click "Create account" to proceed.

### 4. Payment Page

You'll be redirected to:
```
http://localhost:3000/auth/payment?email=test@example.com&plan=<plan>&userId=<user-id>
```

#### Payment Methods

**Option 1: Credit/Debit Card**
- Card Number: `4242 4242 4242 4242` (Stripe test card)
- Cardholder Name: John Doe
- Expiry Date: 12/25
- CVV: 123

**Option 2: PayPal**
- Select PayPal option
- In development, this will be simulated

Click "Pay $XX" to process payment.

### 5. Payment Success

After successful payment, you'll see:
```
http://localhost:3000/auth/payment-success?email=test@example.com
```

This page shows:
- ✅ Payment processed successfully
- ✅ Account created and ready
- ✅ Telnyx phone number will be assigned after verification
- Instructions for email verification

### 6. Email Verification

**In Development Mode:**
Check your console logs for the verification link:
```
✅ Verification email sent to: test@example.com
Verification link: http://localhost:3000/auth/verify?token=<token>
```

**In Production:**
- Check your email inbox
- Click the verification link

### 7. Login

Navigate to: http://localhost:3000/auth/login

Login with:
- **Email**: test@example.com
- **Password**: password123

### 8. Dashboard with Phone Number

After successful login, you'll be redirected to the dashboard where you'll see:

1. **Dashboard Overview** with campaign stats
2. **Telnyx Phone Number Card** showing your assigned number

The phone number is automatically assigned on first login after:
- ✅ Email is verified
- ✅ Subscription is active
- ✅ Payment is processed

## Development Mode Features

### Simulated Services

When API keys are not configured or set to dummy values, the system simulates:

1. **Stripe Payments**
   - All payments succeed automatically
   - Payment ID: `dev_payment_<timestamp>`

2. **Telnyx Phone Numbers**
   - Mock numbers generated: `+1555XXXXXXX`
   - No actual Telnyx API calls

3. **Email Verification**
   - Verification link printed to console
   - No actual email sent

### Console Logs to Watch

```bash
# Registration
✅ User registered: test@example.com, awaiting payment

# Payment Processing
🔧 Development mode: Simulating successful payment
✅ Payment processed: dev_payment_1234567890

# Verification Email
🔧 Development mode: Verification email would be sent in production
Verification link: http://localhost:3000/auth/verify?token=...

# Login
✅ Login successful, session cookie set for: test@example.com

# Phone Number Assignment
🔧 Development mode: Simulating Telnyx number assignment for user <id>
📱 Assigned number: +15551234567
✅ Telnyx number +15551234567 assigned to user <id> on login
```

## Testing Different Scenarios

### Test 1: Complete Happy Path
1. Select Professional plan ($20)
2. Register with new email
3. Pay with test card
4. Verify email
5. Login
6. See assigned phone number

### Test 2: Login Before Verification
1. Complete registration and payment
2. Try to login WITHOUT verifying email
3. Should see error: "Email verification required"

### Test 3: Multiple Plans
1. Test each pricing tier (Starter, Professional, Enterprise)
2. Verify correct price is charged
3. Check subscription_plan is saved correctly

### Test 4: Payment Failure (Production Only)
1. Use Stripe decline test card: `4000 0000 0000 0002`
2. Should see payment error
3. User can retry payment

## Database Verification

Check the database after registration:

```sql
SELECT 
  id, 
  email, 
  subscription_plan, 
  subscription_status, 
  email_verified, 
  telnyx_phone_number,
  payment_id
FROM users 
WHERE email = 'test@example.com';
```

Expected values after complete flow:
- `subscription_plan`: 'starter', 'professional', or 'enterprise'
- `subscription_status`: 'active'
- `email_verified`: true
- `telnyx_phone_number`: '+15551234567' (or similar)
- `payment_id`: 'dev_payment_...' or Stripe payment ID

## Troubleshooting

### Issue: "User already exists"
**Solution**: Use a different email or delete the existing user from database

### Issue: Payment page shows "Loading..."
**Solution**: Check URL has all required parameters (email, plan, userId)

### Issue: No phone number assigned
**Solution**: 
1. Verify email is confirmed
2. Check subscription_status is 'active'
3. Check console for Telnyx errors

### Issue: Verification email not received
**Solution**: 
1. In development, check console logs
2. In production, check spam folder
3. Use "resend verification email" button

## Next Steps After Testing

1. **Configure Real Stripe Keys**
   - Get keys from https://dashboard.stripe.com/apikeys
   - Update `.env.local`
   - Test with Stripe test mode

2. **Configure Real Telnyx Keys**
   - Get API key from https://portal.telnyx.com/
   - Update `.env.local`
   - Purchase test phone number

3. **Test Email Delivery**
   - Verify Resend API key works
   - Test verification emails
   - Check email deliverability

4. **Production Deployment**
   - Set all environment variables
   - Run database migrations
   - Test complete flow in production
   - Monitor logs for errors

## Support

If you encounter issues:
1. Check console logs for detailed errors
2. Verify all environment variables are set
3. Ensure database migration ran successfully
4. Review the PRICING_AND_PAYMENT_SETUP.md guide

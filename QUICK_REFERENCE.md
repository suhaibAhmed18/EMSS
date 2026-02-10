# Quick Reference: Incomplete Payment Flow

## TL;DR
Users who register but don't complete payment are automatically redirected to the payment page when they try to login later.

## Key URLs

| URL | Purpose |
|-----|---------|
| `/auth/register?plan=professional` | Registration with plan selection |
| `/auth/payment?email=...&plan=...&userId=...` | Payment page |
| `/auth/payment-success` | Payment confirmation |
| `/auth/login` | Login page |
| `/dashboard` | Main dashboard (requires active subscription) |

## User Flow

```
Register → Payment Page → (User Leaves) → Login Later → Auto-Redirect to Payment → Complete Payment → Verify Email → Login → Dashboard
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new user account |
| `/api/auth/login` | POST | Authenticate user |
| `/api/payments/create-checkout` | POST | Create Stripe session |
| `/api/payments/webhook` | POST | Handle Stripe events |
| `/api/payments/verify-session` | POST | Verify payment completion |

## Subscription Status Values

| Status | Meaning |
|--------|---------|
| `pending` | Registered but not paid |
| `active` | Payment completed, full access |
| `cancelled` | User cancelled subscription |
| `past_due` | Payment failed |
| `inactive` | Subscription expired |

## Login Response Codes

| Code | Condition | Action |
|------|-----------|--------|
| 200 | Success | Redirect to dashboard |
| 401 | Invalid credentials | Show error |
| 403 + `needsVerification` | Email not verified | Show verification message |
| 403 + `needsPayment` | Payment required | Auto-redirect to payment |
| 429 | Rate limited | Show "too many attempts" |

## Testing Commands

```bash
# Start development server
npm run dev

# Start Stripe webhook listener
stripe listen --forward-to localhost:3000/api/payments/webhook

# Test payment with Stripe test card
Card: 4242 4242 4242 4242
Expiry: Any future date
CVC: Any 3 digits
```

## Database Quick Check

```sql
-- Check user subscription status
SELECT email, subscription_status, subscription_plan, email_verified 
FROM users 
WHERE email = 'test@example.com';

-- Find users with pending payments
SELECT email, created_at 
FROM users 
WHERE subscription_status = 'pending';
```

## Environment Variables

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Common Scenarios

### Scenario 1: New User (Complete Flow)
1. Register → 2. Pay → 3. Verify Email → 4. Login → 5. Dashboard

### Scenario 2: Incomplete Payment
1. Register → 2. Leave → 3. Login → 4. Auto-redirect to Payment → 5. Pay → 6. Verify Email → 7. Login → 8. Dashboard

### Scenario 3: Payment Cancelled
1. Register → 2. Start Payment → 3. Cancel → 4. Return to Payment Page → 5. Try Again

## Key Features

✅ Automatic redirect to payment page when login with pending payment
✅ Preserves user's selected plan across sessions
✅ Shows helpful message when payment is cancelled
✅ Email verification required before dashboard access
✅ Telnyx phone number auto-assigned on first successful login
✅ Rate limiting to prevent brute force attacks
✅ Secure session management with HTTP-only cookies

## Files Modified

- `src/app/api/auth/login/route.ts` - Payment check logic
- `src/app/auth/login/page.tsx` - Auto-redirect logic
- `src/app/auth/payment/page.tsx` - Cancelled payment message

## Documentation Files

- `INCOMPLETE_PAYMENT_FLOW.md` - Complete technical documentation
- `PAYMENT_FLOW_TEST_CHECKLIST.md` - Testing guide
- `PAYMENT_FLOW_DIAGRAM.md` - Visual flow diagrams
- `IMPLEMENTATION_SUMMARY.md` - Implementation details
- `QUICK_REFERENCE.md` - This file

## Support

For issues or questions:
1. Check the test checklist for common scenarios
2. Review the flow diagrams for visual understanding
3. Check database subscription_status values
4. Verify Stripe webhook is firing correctly
5. Check server logs for error messages

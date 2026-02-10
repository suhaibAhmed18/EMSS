# Database Implementation Summary: Payment Checkout Sessions

## What Was Implemented

All payment checkout sessions are now tracked in the database, providing:
- **Complete audit trail** of all payment attempts
- **Analytics** on conversion rates and abandonment
- **Recovery** of incomplete payments
- **Monitoring** of payment flow health

## Database Changes

### New Table: payment_checkout_sessions

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

### New Functions

1. **get_or_create_checkout_session()** - Creates or retrieves existing session
2. **complete_checkout_session()** - Marks session as completed
3. **expire_old_checkout_sessions()** - Expires old sessions (cron job)
4. **get_latest_checkout_session()** - Gets user's most recent session

### New Indexes

- User lookup: `idx_payment_checkout_sessions_user_id`
- Email lookup: `idx_payment_checkout_sessions_email`
- Status filtering: `idx_payment_checkout_sessions_status`
- Stripe session: `idx_payment_checkout_sessions_stripe_session`
- Pending sessions: `idx_payment_checkout_sessions_pending`
- Expired sessions: `idx_payment_checkout_sessions_expired`

## Code Changes

### 1. Create Checkout API (`src/app/api/payments/create-checkout/route.ts`)

**Before:**
```typescript
// Only created Stripe session
const session = await stripe.checkout.sessions.create({...})
```

**After:**
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

// Create Stripe session with database session ID
const session = await stripe.checkout.sessions.create({
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

### 2. Webhook Handler (`src/app/api/payments/webhook/route.ts`)

**Added:**
```typescript
// Mark checkout session as completed in database
if (checkoutSessionId && checkoutSessionId !== 'unknown') {
  await supabase
    .rpc('complete_checkout_session', {
      p_session_id: checkoutSessionId,
      p_stripe_session_id: session.id,
      p_stripe_customer_id: session.customer as string
    })
}
```

### 3. New API Endpoint (`src/app/api/payments/checkout-session/route.ts`)

**Endpoints:**
- `GET /api/payments/checkout-session?userId={id}` - Get user's session
- `POST /api/payments/checkout-session` - Create session
- `PATCH /api/payments/checkout-session` - Update session status

## Files Created

### SQL Scripts
1. **scripts/create-payment-checkout-sessions.sql** - Complete table schema with functions
2. **scripts/run-payment-sessions-migration.js** - Migration runner script

### API Endpoints
3. **src/app/api/payments/checkout-session/route.ts** - Session management API

### Documentation
4. **DATABASE_CHECKOUT_SESSIONS.md** - Complete database documentation
5. **DATABASE_IMPLEMENTATION_SUMMARY.md** - This file

## Files Modified

1. **src/app/api/payments/create-checkout/route.ts** - Added database session tracking
2. **src/app/api/payments/webhook/route.ts** - Added session completion tracking
3. **INCOMPLETE_PAYMENT_FLOW.md** - Updated with database tracking info

## How It Works

### Flow Diagram

```
User Initiates Payment
        ↓
Create Database Session (payment_checkout_sessions)
        ↓
Create Stripe Session
        ↓
Link Database Session ↔ Stripe Session
        ↓
User Completes Payment
        ↓
Stripe Webhook Fires
        ↓
Update User Subscription (users table)
        ↓
Mark Database Session as Completed
        ↓
Send Verification Email
```

### Data Flow

1. **Session Creation**
   - User clicks "Continue to Payment"
   - Database session created with status='pending'
   - Stripe session created
   - Database session updated with stripe_session_id

2. **Payment Completion**
   - User completes payment on Stripe
   - Webhook fires with session.metadata.checkoutSessionId
   - User subscription updated to 'active'
   - Database session marked as 'completed'

3. **Incomplete Payment**
   - User closes browser
   - Session remains in database with status='pending'
   - User returns and logs in
   - System retrieves pending session
   - User redirected to payment page

## Benefits

### 1. Analytics & Monitoring
```sql
-- Conversion rate
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as conversion_rate
FROM payment_checkout_sessions
WHERE created_at > NOW() - INTERVAL '30 days';

-- Abandonment by plan
SELECT 
  subscription_plan,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as abandoned
FROM payment_checkout_sessions
GROUP BY subscription_plan;
```

### 2. Recovery
```sql
-- Find users who need reminders
SELECT user_id, email, subscription_plan, created_at
FROM payment_checkout_sessions
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND attempts < 3;
```

### 3. Audit Trail
- Every payment attempt is logged
- Track retry attempts
- Monitor time to completion
- Identify problematic flows

### 4. Business Intelligence
- Which plans have highest abandonment?
- What's the average time to complete payment?
- How many users retry payments?
- What's the conversion rate by plan?

## Migration Steps

### 1. Run Database Migration
```bash
# Option 1: Using Node.js script
node scripts/run-payment-sessions-migration.js

# Option 2: Manual in Supabase SQL Editor
# Copy and paste scripts/create-payment-checkout-sessions.sql
```

### 2. Verify Migration
```sql
-- Check table exists
SELECT * FROM payment_checkout_sessions LIMIT 1;

-- Test functions
SELECT expire_old_checkout_sessions();
```

### 3. Deploy Code Changes
```bash
# Restart development server
npm run dev

# Or deploy to production
npm run build
```

### 4. Test Flow
1. Register new account
2. Check database for session record
3. Complete payment
4. Verify session marked as completed
5. Check user subscription status updated

## Monitoring Queries

### Daily Health Check
```sql
-- Sessions created today
SELECT COUNT(*) FROM payment_checkout_sessions 
WHERE created_at > CURRENT_DATE;

-- Completion rate today
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as rate
FROM payment_checkout_sessions 
WHERE created_at > CURRENT_DATE;

-- Pending sessions older than 1 hour
SELECT COUNT(*) FROM payment_checkout_sessions
WHERE status = 'pending' 
  AND created_at < NOW() - INTERVAL '1 hour';
```

### Weekly Report
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM payment_checkout_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Maintenance

### Cron Jobs

#### 1. Expire Old Sessions (Hourly)
```sql
SELECT expire_old_checkout_sessions();
```

#### 2. Send Reminder Emails (Every 6 hours)
```sql
SELECT user_id, email, subscription_plan
FROM payment_checkout_sessions
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '6 hours'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND attempts < 3;
```

#### 3. Cleanup Old Completed Sessions (Weekly)
```sql
DELETE FROM payment_checkout_sessions
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '90 days';
```

## Troubleshooting

### Issue: Session Not Created
**Check:**
```sql
-- Verify user exists
SELECT * FROM users WHERE id = 'user-uuid';

-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'get_or_create_checkout_session';
```

### Issue: Session Not Completing
**Check:**
```sql
-- Find pending sessions with Stripe ID
SELECT * FROM payment_checkout_sessions
WHERE stripe_session_id IS NOT NULL
  AND status = 'pending';

-- Check webhook logs
SELECT * FROM webhook_events
WHERE topic = 'checkout.session.completed'
ORDER BY created_at DESC
LIMIT 10;
```

### Issue: High Abandonment Rate
**Investigate:**
```sql
-- Sessions by status
SELECT status, COUNT(*) 
FROM payment_checkout_sessions
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY status;

-- Average time before abandonment
SELECT 
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 60) as avg_minutes
FROM payment_checkout_sessions
WHERE status = 'pending'
  AND created_at > NOW() - INTERVAL '7 days';
```

## Security Considerations

1. **User Isolation**: Sessions tied to user_id with CASCADE delete
2. **Expiration**: Auto-expire after 24 hours
3. **Metadata**: JSONB for flexible, secure storage
4. **Indexes**: Optimized queries without exposing sensitive data
5. **Functions**: Encapsulated business logic with proper permissions

## Performance

### Expected Load
- ~100 sessions per day
- ~1,000 sessions per month
- ~12,000 sessions per year

### Index Performance
- User lookup: O(log n) with B-tree index
- Status filtering: O(log n) with partial index
- Stripe session lookup: O(1) with unique constraint

### Cleanup Strategy
- Expire old sessions: Hourly (< 1 second)
- Delete old completed: Weekly (< 5 seconds)
- Archive old data: Quarterly (optional)

## Next Steps

1. **Deploy Migration**: Run the SQL migration script
2. **Test Flow**: Complete end-to-end payment test
3. **Monitor**: Set up dashboard for key metrics
4. **Alerts**: Configure alerts for high abandonment
5. **Optimize**: Analyze data and improve conversion rate

## Support

For issues or questions:
1. Check database logs: `SELECT * FROM error_logs WHERE category = 'database'`
2. Verify functions: `SELECT * FROM pg_proc WHERE proname LIKE '%checkout%'`
3. Test queries: Run sample queries from DATABASE_CHECKOUT_SESSIONS.md
4. Check indexes: `SELECT * FROM pg_indexes WHERE tablename = 'payment_checkout_sessions'`

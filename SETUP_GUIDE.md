# Setup Guide: Payment Checkout Sessions

## Quick Start

Follow these steps to set up the payment checkout session tracking system.

## Prerequisites

- Supabase project set up
- Stripe account configured
- Environment variables set in `.env.local`

## Step 1: Run Database Migration

### Option A: Using Node.js Script (Recommended)

```bash
# Make sure you're in the project root
cd /path/to/your/project

# Run the migration script
node scripts/run-payment-sessions-migration.js
```

**Expected Output:**
```
🚀 Starting payment checkout sessions migration...
📄 Executing SQL migration...
✅ Migration completed successfully!
🔍 Verifying table creation...
✅ Table verified successfully!
🧪 Testing database functions...
✅ expire_old_checkout_sessions function working
✨ Migration complete!
```

### Option B: Manual Migration

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Open `scripts/create-payment-checkout-sessions.sql`
4. Copy entire contents
5. Paste into SQL Editor
6. Click "Run"

## Step 2: Verify Migration

Run these queries in Supabase SQL Editor:

```sql
-- Check table exists
SELECT * FROM payment_checkout_sessions LIMIT 1;

-- Test functions
SELECT expire_old_checkout_sessions();

-- Check indexes
SELECT indexname FROM pg_indexes 
WHERE tablename = 'payment_checkout_sessions';
```

**Expected Results:**
- Table query returns empty result (no error)
- Function returns 0 (no sessions to expire)
- Indexes list shows 6 indexes

## Step 3: Test the Flow

### 1. Register New User
```
1. Go to http://localhost:3000/pricing
2. Select "Professional" plan
3. Click "Get Started"
4. Fill registration form
5. Submit
```

### 2. Check Database
```sql
-- Should see new session record
SELECT * FROM payment_checkout_sessions 
WHERE email = 'your-test-email@example.com';
```

**Expected:**
- status: 'pending'
- subscription_plan: 'professional'
- attempts: 1
- stripe_session_id: NULL (not yet created)

### 3. Continue to Payment
```
1. Click "Continue to Payment"
2. Check database again
```

```sql
-- Should see Stripe session ID
SELECT stripe_session_id, status FROM payment_checkout_sessions 
WHERE email = 'your-test-email@example.com';
```

**Expected:**
- stripe_session_id: 'cs_test_...'
- status: 'pending'

### 4. Complete Payment
```
1. Use test card: 4242 4242 4242 4242
2. Complete payment
3. Wait for webhook
4. Check database
```

```sql
-- Should see completed session
SELECT status, completed_at FROM payment_checkout_sessions 
WHERE email = 'your-test-email@example.com';
```

**Expected:**
- status: 'completed'
- completed_at: timestamp

### 5. Test Incomplete Payment Flow
```
1. Register another user
2. Close browser before payment
3. Open browser and login
4. Should redirect to payment page
5. Check database for session
```

```sql
-- Should see pending session with attempts > 1
SELECT attempts, last_attempt_at FROM payment_checkout_sessions 
WHERE email = 'second-test-email@example.com';
```

## Step 4: Set Up Monitoring

### Create Dashboard Queries

Save these queries in Supabase for quick access:

#### 1. Today's Stats
```sql
SELECT 
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate
FROM payment_checkout_sessions
WHERE created_at > CURRENT_DATE;
```

#### 2. Pending Sessions
```sql
SELECT 
  email,
  subscription_plan,
  plan_price,
  attempts,
  created_at,
  expires_at
FROM payment_checkout_sessions
WHERE status = 'pending'
ORDER BY created_at DESC;
```

#### 3. Recent Completions
```sql
SELECT 
  email,
  subscription_plan,
  plan_price,
  completed_at,
  EXTRACT(EPOCH FROM (completed_at - created_at)) / 60 as minutes_to_complete
FROM payment_checkout_sessions
WHERE status = 'completed'
  AND completed_at > NOW() - INTERVAL '24 hours'
ORDER BY completed_at DESC;
```

## Step 5: Set Up Cron Jobs

### Using Supabase Edge Functions (Recommended)

Create a cron job to expire old sessions:

```typescript
// supabase/functions/expire-sessions/index.ts
import { createClient } from '@supabase/supabase-js'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data, error } = await supabase
    .rpc('expire_old_checkout_sessions')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ 
    expired: data,
    message: `Expired ${data} sessions` 
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Schedule in Supabase Dashboard:
- Function: `expire-sessions`
- Schedule: `0 * * * *` (every hour)

### Using External Cron Service

Use services like:
- Vercel Cron Jobs
- GitHub Actions
- Cron-job.org

Example GitHub Action:

```yaml
# .github/workflows/expire-sessions.yml
name: Expire Old Sessions
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  expire:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Expire sessions
        run: |
          curl -X POST https://your-project.supabase.co/functions/v1/expire-sessions \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

## Step 6: Configure Alerts

### Set Up Email Alerts

Create a function to check for issues:

```sql
-- Check for high abandonment rate
CREATE OR REPLACE FUNCTION check_abandonment_rate()
RETURNS TABLE (
  alert_level TEXT,
  message TEXT,
  rate NUMERIC
) AS $$
DECLARE
  v_rate NUMERIC;
BEGIN
  SELECT 
    COUNT(CASE WHEN status = 'pending' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)
  INTO v_rate
  FROM payment_checkout_sessions
  WHERE created_at > NOW() - INTERVAL '24 hours';
  
  IF v_rate > 70 THEN
    RETURN QUERY SELECT 'CRITICAL'::TEXT, 'Abandonment rate is very high'::TEXT, v_rate;
  ELSIF v_rate > 50 THEN
    RETURN QUERY SELECT 'WARNING'::TEXT, 'Abandonment rate is high'::TEXT, v_rate;
  ELSE
    RETURN QUERY SELECT 'OK'::TEXT, 'Abandonment rate is normal'::TEXT, v_rate;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

## Troubleshooting

### Migration Fails

**Error: "function update_updated_at_column does not exist"**

Solution: The function should be in the main schema. Add it:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Sessions Not Creating

**Check:**
1. User exists in users table
2. Function has correct permissions
3. Database connection is working

```sql
-- Test function manually
SELECT get_or_create_checkout_session(
  (SELECT id FROM users LIMIT 1),
  'test@example.com',
  'professional',
  20.00,
  'stripe'
);
```

### Sessions Not Completing

**Check:**
1. Webhook is firing (check Stripe dashboard)
2. Webhook secret is correct
3. Metadata includes checkoutSessionId

```sql
-- Find sessions with Stripe ID but not completed
SELECT * FROM payment_checkout_sessions
WHERE stripe_session_id IS NOT NULL
  AND status = 'pending';
```

## Environment Variables

Ensure these are set in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing Checklist

- [ ] Migration runs successfully
- [ ] Table and functions created
- [ ] Indexes created
- [ ] Session created on payment initiation
- [ ] Stripe session ID stored
- [ ] Session completed on payment
- [ ] User subscription updated
- [ ] Incomplete payment flow works
- [ ] Cron job expires old sessions
- [ ] Monitoring queries work

## Next Steps

1. **Production Deployment**
   - Run migration on production database
   - Update environment variables
   - Test with real Stripe account

2. **Monitoring Setup**
   - Create dashboard for metrics
   - Set up alerts for issues
   - Schedule regular reports

3. **Optimization**
   - Analyze conversion rates
   - Identify bottlenecks
   - Improve user experience

## Support

If you encounter issues:

1. Check the logs: `SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 10`
2. Verify functions: `SELECT proname FROM pg_proc WHERE proname LIKE '%checkout%'`
3. Test queries: Run examples from DATABASE_CHECKOUT_SESSIONS.md
4. Review documentation: See INCOMPLETE_PAYMENT_FLOW.md

## Resources

- **Database Schema**: `scripts/create-payment-checkout-sessions.sql`
- **Migration Script**: `scripts/run-payment-sessions-migration.js`
- **API Endpoints**: `src/app/api/payments/checkout-session/route.ts`
- **Documentation**: `DATABASE_CHECKOUT_SESSIONS.md`
- **Flow Diagram**: `PAYMENT_FLOW_DIAGRAM.md`

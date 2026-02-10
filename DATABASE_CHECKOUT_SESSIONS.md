# Payment Checkout Sessions Database Documentation

## Overview
The `payment_checkout_sessions` table tracks all payment checkout attempts, allowing for better monitoring, analytics, and recovery of incomplete payments.

## Table Schema

```sql
CREATE TABLE payment_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User information
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  
  -- Plan information
  subscription_plan VARCHAR(50) NOT NULL CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  plan_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment provider information
  payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('stripe', 'paypal')),
  stripe_session_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  
  -- Session status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled', 'failed')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  success_url TEXT,
  cancel_url TEXT,
  
  -- Tracking
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);
```

## Status Values

| Status | Description | When Set |
|--------|-------------|----------|
| `pending` | Checkout initiated but not completed | On session creation |
| `completed` | Payment successful | When Stripe webhook fires |
| `expired` | Session expired (24 hours) | By cleanup job |
| `cancelled` | User cancelled payment | When user clicks cancel |
| `failed` | Payment failed | When payment processing fails |

## Database Functions

### 1. get_or_create_checkout_session()
Creates a new checkout session or returns existing pending session.

**Parameters:**
- `p_user_id` (UUID): User ID
- `p_email` (VARCHAR): User email
- `p_plan` (VARCHAR): Subscription plan
- `p_price` (DECIMAL): Plan price
- `p_provider` (VARCHAR): Payment provider

**Returns:** UUID (session ID)

**Usage:**
```sql
SELECT get_or_create_checkout_session(
  'user-uuid-here',
  'user@example.com',
  'professional',
  20.00,
  'stripe'
);
```

**Behavior:**
- Checks for existing pending session that hasn't expired
- If found, increments attempts counter and returns existing session ID
- If not found, creates new session and returns new session ID

### 2. complete_checkout_session()
Marks a checkout session as completed.

**Parameters:**
- `p_session_id` (UUID): Session ID to complete
- `p_stripe_session_id` (VARCHAR): Stripe session ID (optional)
- `p_stripe_customer_id` (VARCHAR): Stripe customer ID (optional)
- `p_paypal_order_id` (VARCHAR): PayPal order ID (optional)

**Returns:** BOOLEAN (success)

**Usage:**
```sql
SELECT complete_checkout_session(
  'session-uuid-here',
  'cs_test_stripe_session_id',
  'cus_stripe_customer_id',
  NULL
);
```

### 3. expire_old_checkout_sessions()
Expires all pending sessions older than their expiration time.

**Parameters:** None

**Returns:** INTEGER (number of expired sessions)

**Usage:**
```sql
SELECT expire_old_checkout_sessions();
```

**Recommended:** Run as a cron job every hour

### 4. get_latest_checkout_session()
Gets the most recent checkout session for a user.

**Parameters:**
- `p_user_id` (UUID): User ID

**Returns:** TABLE with session details

**Usage:**
```sql
SELECT * FROM get_latest_checkout_session('user-uuid-here');
```

## Indexes

```sql
-- User lookup
CREATE INDEX idx_payment_checkout_sessions_user_id ON payment_checkout_sessions(user_id);

-- Email lookup
CREATE INDEX idx_payment_checkout_sessions_email ON payment_checkout_sessions(email);

-- Status filtering
CREATE INDEX idx_payment_checkout_sessions_status ON payment_checkout_sessions(status);

-- Stripe session lookup
CREATE INDEX idx_payment_checkout_sessions_stripe_session 
  ON payment_checkout_sessions(stripe_session_id) 
  WHERE stripe_session_id IS NOT NULL;

-- Pending sessions (for cleanup)
CREATE INDEX idx_payment_checkout_sessions_pending 
  ON payment_checkout_sessions(status, created_at DESC) 
  WHERE status = 'pending';

-- Expired sessions
CREATE INDEX idx_payment_checkout_sessions_expired 
  ON payment_checkout_sessions(expires_at) 
  WHERE status = 'pending';
```

## Common Queries

### Get All Pending Sessions for a User
```sql
SELECT * FROM payment_checkout_sessions 
WHERE user_id = 'user-uuid-here' 
  AND status = 'pending'
ORDER BY created_at DESC;
```

### Get User's Latest Session
```sql
SELECT * FROM get_latest_checkout_session('user-uuid-here');
```

### Find Abandoned Checkouts (for reminder emails)
```sql
SELECT 
  id,
  user_id,
  email,
  subscription_plan,
  plan_price,
  created_at,
  attempts
FROM payment_checkout_sessions
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND attempts < 3
ORDER BY created_at DESC;
```

### Calculate Conversion Rate
```sql
SELECT 
  COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as conversion_rate,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
  COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count
FROM payment_checkout_sessions
WHERE created_at > NOW() - INTERVAL '30 days';
```

### Get Sessions by Plan
```sql
SELECT 
  subscription_plan,
  COUNT(*) as total_sessions,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  AVG(plan_price) as avg_price
FROM payment_checkout_sessions
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY subscription_plan
ORDER BY total_sessions DESC;
```

### Get Average Time to Complete Payment
```sql
SELECT 
  subscription_plan,
  AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60) as avg_minutes_to_complete,
  COUNT(*) as completed_count
FROM payment_checkout_sessions
WHERE status = 'completed'
  AND completed_at IS NOT NULL
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY subscription_plan;
```

### Find Users with Multiple Attempts
```sql
SELECT 
  user_id,
  email,
  COUNT(*) as total_attempts,
  MAX(created_at) as last_attempt,
  subscription_plan
FROM payment_checkout_sessions
WHERE status IN ('pending', 'cancelled')
  AND created_at > NOW() - INTERVAL '7 days'
GROUP BY user_id, email, subscription_plan
HAVING COUNT(*) > 2
ORDER BY total_attempts DESC;
```

## API Endpoints

### GET /api/payments/checkout-session
Get checkout session for a user.

**Query Parameters:**
- `userId` (required): User ID

**Response:**
```json
{
  "session": {
    "id": "uuid",
    "email": "user@example.com",
    "plan": "professional",
    "price": 20.00,
    "status": "pending",
    "provider": "stripe",
    "createdAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2024-01-02T00:00:00Z"
  }
}
```

### POST /api/payments/checkout-session
Create or get checkout session.

**Body:**
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "plan": "professional",
  "price": 20.00,
  "provider": "stripe"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "message": "Checkout session created successfully"
}
```

### PATCH /api/payments/checkout-session
Update checkout session status.

**Body:**
```json
{
  "sessionId": "uuid",
  "status": "completed",
  "stripeSessionId": "cs_test_...",
  "stripeCustomerId": "cus_..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Checkout session completed"
}
```

## Integration with Application Flow

### 1. User Initiates Payment
```typescript
// In create-checkout API
const { data: dbSession } = await supabase
  .rpc('get_or_create_checkout_session', {
    p_user_id: userId,
    p_email: email,
    p_plan: plan,
    p_price: amount,
    p_provider: 'stripe'
  })
```

### 2. Stripe Session Created
```typescript
// Update database with Stripe session ID
await supabase
  .from('payment_checkout_sessions')
  .update({
    stripe_session_id: session.id,
    success_url: successUrl,
    cancel_url: cancelUrl
  })
  .eq('id', dbSession)
```

### 3. Payment Completed (Webhook)
```typescript
// Mark session as completed
await supabase
  .rpc('complete_checkout_session', {
    p_session_id: checkoutSessionId,
    p_stripe_session_id: session.id,
    p_stripe_customer_id: session.customer
  })
```

### 4. User Returns to Login
```typescript
// Get latest session to resume payment
const { data: session } = await supabase
  .rpc('get_latest_checkout_session', { p_user_id: userId })
  .single()

if (session && session.status === 'pending') {
  // Redirect to payment page with session data
  router.push(`/auth/payment?email=${session.email}&plan=${session.plan}&userId=${userId}`)
}
```

## Monitoring & Analytics

### Dashboard Metrics
1. **Conversion Rate**: Completed / Total sessions
2. **Abandonment Rate**: (Pending + Expired) / Total sessions
3. **Average Time to Complete**: Time from creation to completion
4. **Retry Rate**: Sessions with attempts > 1
5. **Plan Distribution**: Sessions by subscription plan

### Alerts
- High abandonment rate (> 50%)
- Many expired sessions (> 100 per day)
- Users with > 3 failed attempts
- Sessions stuck in pending for > 24 hours

## Maintenance

### Cleanup Job (Run Hourly)
```sql
-- Expire old sessions
SELECT expire_old_checkout_sessions();

-- Delete very old completed sessions (optional, for data retention)
DELETE FROM payment_checkout_sessions
WHERE status = 'completed'
  AND completed_at < NOW() - INTERVAL '90 days';
```

### Reminder Email Job (Run Every 6 Hours)
```sql
-- Find users who need reminders
SELECT DISTINCT ON (user_id)
  user_id,
  email,
  subscription_plan,
  plan_price,
  created_at
FROM payment_checkout_sessions
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '6 hours'
  AND created_at > NOW() - INTERVAL '24 hours'
  AND attempts < 3
ORDER BY user_id, created_at DESC;
```

## Migration

### Run Migration
```bash
# Using Node.js script
node scripts/run-payment-sessions-migration.js

# Or manually in Supabase SQL Editor
# Copy contents of scripts/create-payment-checkout-sessions.sql
```

### Verify Migration
```sql
-- Check table exists
SELECT * FROM payment_checkout_sessions LIMIT 1;

-- Test functions
SELECT expire_old_checkout_sessions();
SELECT * FROM get_latest_checkout_session('test-user-id');
```

## Troubleshooting

### Session Not Created
- Check user_id exists in users table
- Verify function permissions
- Check database logs for errors

### Session Not Completing
- Verify webhook is firing
- Check Stripe session ID matches
- Ensure complete_checkout_session function is called

### Sessions Not Expiring
- Run expire_old_checkout_sessions() manually
- Check cron job is running
- Verify expires_at timestamp is set correctly

## Security Considerations

1. **User Isolation**: Sessions are tied to user_id with CASCADE delete
2. **Expiration**: Sessions auto-expire after 24 hours
3. **Metadata**: Use JSONB for flexible, secure data storage
4. **Indexes**: Optimized for fast lookups without exposing sensitive data
5. **Functions**: Use RPC functions to encapsulate business logic

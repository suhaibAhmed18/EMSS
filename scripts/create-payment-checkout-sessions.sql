-- ============================================================================
-- PAYMENT CHECKOUT SESSIONS TABLE
-- ============================================================================
-- This table tracks incomplete payment sessions for users who register
-- but don't complete payment, allowing them to resume later
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_checkout_sessions (
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
  
  -- URLs for redirect
  success_url TEXT,
  cancel_url TEXT,
  
  -- Tracking
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  
  -- Notes
  notes TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_user_id 
  ON payment_checkout_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_email 
  ON payment_checkout_sessions(email);

CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_status 
  ON payment_checkout_sessions(status);

-- Stripe/PayPal session lookup
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_stripe_session 
  ON payment_checkout_sessions(stripe_session_id) 
  WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_paypal_order 
  ON payment_checkout_sessions(paypal_order_id) 
  WHERE paypal_order_id IS NOT NULL;

-- Pending sessions lookup (for cleanup/reminders)
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_pending 
  ON payment_checkout_sessions(status, created_at DESC) 
  WHERE status = 'pending';

-- Expired sessions lookup
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_expired 
  ON payment_checkout_sessions(expires_at) 
  WHERE status = 'pending';

-- User's latest session
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_user_latest 
  ON payment_checkout_sessions(user_id, created_at DESC);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp on row update
CREATE TRIGGER update_payment_checkout_sessions_updated_at 
  BEFORE UPDATE ON payment_checkout_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get or create checkout session for user
CREATE OR REPLACE FUNCTION get_or_create_checkout_session(
  p_user_id UUID,
  p_email VARCHAR(255),
  p_plan VARCHAR(50),
  p_price DECIMAL(10, 2),
  p_provider VARCHAR(50)
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
  v_existing_session_id UUID;
BEGIN
  -- Check for existing pending session
  SELECT id INTO v_existing_session_id
  FROM payment_checkout_sessions
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If exists, update and return
  IF v_existing_session_id IS NOT NULL THEN
    UPDATE payment_checkout_sessions
    SET 
      attempts = attempts + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    WHERE id = v_existing_session_id;
    
    RETURN v_existing_session_id;
  END IF;
  
  -- Create new session
  INSERT INTO payment_checkout_sessions (
    user_id,
    email,
    subscription_plan,
    plan_price,
    currency,
    payment_provider,
    status,
    attempts,
    last_attempt_at
  ) VALUES (
    p_user_id,
    p_email,
    p_plan,
    p_price,
    'USD',
    p_provider,
    'pending',
    1,
    NOW()
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark session as completed
CREATE OR REPLACE FUNCTION complete_checkout_session(
  p_session_id UUID,
  p_stripe_session_id VARCHAR(255) DEFAULT NULL,
  p_stripe_customer_id VARCHAR(255) DEFAULT NULL,
  p_paypal_order_id VARCHAR(255) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE payment_checkout_sessions
  SET 
    status = 'completed',
    completed_at = NOW(),
    stripe_session_id = COALESCE(p_stripe_session_id, stripe_session_id),
    stripe_customer_id = COALESCE(p_stripe_customer_id, stripe_customer_id),
    paypal_order_id = COALESCE(p_paypal_order_id, paypal_order_id),
    updated_at = NOW()
  WHERE id = p_session_id
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to expire old pending sessions
CREATE OR REPLACE FUNCTION expire_old_checkout_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE payment_checkout_sessions
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's latest checkout session
CREATE OR REPLACE FUNCTION get_latest_checkout_session(p_user_id UUID)
RETURNS TABLE (
  session_id UUID,
  email VARCHAR(255),
  plan VARCHAR(50),
  price DECIMAL(10, 2),
  status VARCHAR(50),
  provider VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id,
    payment_checkout_sessions.email,
    subscription_plan,
    plan_price,
    payment_checkout_sessions.status,
    payment_provider,
    payment_checkout_sessions.created_at,
    payment_checkout_sessions.expires_at
  FROM payment_checkout_sessions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE payment_checkout_sessions IS 'Tracks payment checkout sessions for subscription payments, allowing users to resume incomplete payments';
COMMENT ON COLUMN payment_checkout_sessions.user_id IS 'Reference to the user who initiated the checkout';
COMMENT ON COLUMN payment_checkout_sessions.subscription_plan IS 'The subscription plan selected (starter, professional, enterprise)';
COMMENT ON COLUMN payment_checkout_sessions.status IS 'Current status: pending (not completed), completed (payment successful), expired (session timeout), cancelled (user cancelled), failed (payment failed)';
COMMENT ON COLUMN payment_checkout_sessions.stripe_session_id IS 'Stripe Checkout Session ID for tracking';
COMMENT ON COLUMN payment_checkout_sessions.expires_at IS 'When this checkout session expires (default 24 hours)';
COMMENT ON COLUMN payment_checkout_sessions.attempts IS 'Number of times user attempted to complete this checkout';
COMMENT ON COLUMN payment_checkout_sessions.metadata IS 'Additional metadata in JSON format';

-- ============================================================================
-- SAMPLE QUERIES
-- ============================================================================

-- Get all pending sessions for a user
-- SELECT * FROM payment_checkout_sessions 
-- WHERE user_id = 'user-uuid-here' AND status = 'pending';

-- Get user's latest session
-- SELECT * FROM get_latest_checkout_session('user-uuid-here');

-- Create or get checkout session
-- SELECT get_or_create_checkout_session(
--   'user-uuid-here',
--   'user@example.com',
--   'professional',
--   20.00,
--   'stripe'
-- );

-- Mark session as completed
-- SELECT complete_checkout_session(
--   'session-uuid-here',
--   'cs_test_stripe_session_id',
--   'cus_stripe_customer_id',
--   NULL
-- );

-- Expire old sessions (run as cron job)
-- SELECT expire_old_checkout_sessions();

-- Get pending sessions older than 1 hour (for reminder emails)
-- SELECT * FROM payment_checkout_sessions
-- WHERE status = 'pending'
--   AND created_at < NOW() - INTERVAL '1 hour'
--   AND created_at > NOW() - INTERVAL '24 hours';

-- Get conversion rate
-- SELECT 
--   COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*) as conversion_rate,
--   COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
--   COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
--   COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count
-- FROM payment_checkout_sessions
-- WHERE created_at > NOW() - INTERVAL '30 days';

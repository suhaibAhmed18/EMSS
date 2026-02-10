-- Migration: Create payment checkout sessions table

CREATE TABLE IF NOT EXISTS payment_checkout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  subscription_plan VARCHAR(50) NOT NULL CHECK (subscription_plan IN ('starter', 'professional', 'enterprise')),
  plan_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_provider VARCHAR(50) NOT NULL CHECK (payment_provider IN ('stripe', 'paypal')),
  stripe_session_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  success_url TEXT,
  cancel_url TEXT,
  attempts INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_user_id ON payment_checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_email ON payment_checkout_sessions(email);
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_status ON payment_checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_stripe_session ON payment_checkout_sessions(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_paypal_order ON payment_checkout_sessions(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_pending ON payment_checkout_sessions(status, created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_expired ON payment_checkout_sessions(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_payment_checkout_sessions_user_latest ON payment_checkout_sessions(user_id, created_at DESC);

-- Trigger
CREATE TRIGGER update_payment_checkout_sessions_updated_at 
  BEFORE UPDATE ON payment_checkout_sessions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE payment_checkout_sessions IS 'Tracks payment checkout sessions for subscription payments';
COMMENT ON COLUMN payment_checkout_sessions.status IS 'Current status: pending, completed, expired, cancelled, failed';

-- Migration: Add subscription expiry and validity tracking

-- Add subscription expiry and validity fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_expiry ON users(subscription_expiry_date);
CREATE INDEX IF NOT EXISTS idx_users_next_billing ON users(next_billing_date);

-- Add comments
COMMENT ON COLUMN users.subscription_start_date IS 'Date when the current subscription period started';
COMMENT ON COLUMN users.subscription_expiry_date IS 'Date when the subscription expires (valid until)';
COMMENT ON COLUMN users.last_payment_date IS 'Date of the last successful payment';
COMMENT ON COLUMN users.next_billing_date IS 'Date when the next payment is due';
COMMENT ON COLUMN users.auto_renew IS 'Whether subscription should auto-renew on expiry';

-- Function: Extend Subscription by 1 Month
CREATE OR REPLACE FUNCTION extend_subscription(
  p_user_id UUID,
  p_plan_name VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  new_expiry_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_current_expiry TIMESTAMP WITH TIME ZONE;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_next_billing TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT subscription_expiry_date INTO v_current_expiry
  FROM users WHERE id = p_user_id;

  IF v_current_expiry IS NULL OR v_current_expiry < v_now THEN
    v_new_expiry := v_now + INTERVAL '1 month';
  ELSE
    v_new_expiry := v_current_expiry + INTERVAL '1 month';
  END IF;

  v_next_billing := v_new_expiry;

  UPDATE users
  SET 
    subscription_plan = COALESCE(p_plan_name, subscription_plan),
    subscription_status = 'active',
    subscription_start_date = COALESCE(subscription_start_date, v_now),
    subscription_expiry_date = v_new_expiry,
    last_payment_date = v_now,
    next_billing_date = v_next_billing,
    updated_at = v_now
  WHERE id = p_user_id;

  RETURN QUERY SELECT 
    TRUE as success,
    'Subscription extended successfully for 1 month' as message,
    v_new_expiry as new_expiry_date,
    v_next_billing as next_billing_date;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE as success,
    'Error extending subscription: ' || SQLERRM as message,
    NULL::TIMESTAMP WITH TIME ZONE as new_expiry_date,
    NULL::TIMESTAMP WITH TIME ZONE as next_billing_date;
END;
$$ LANGUAGE plpgsql;

-- Function: Check and Update Expired Subscriptions
CREATE OR REPLACE FUNCTION check_expired_subscriptions()
RETURNS TABLE (
  expired_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE users
  SET 
    subscription_status = 'expired',
    updated_at = NOW()
  WHERE 
    subscription_expiry_date < NOW()
    AND subscription_status = 'active';

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;

  RETURN QUERY SELECT 
    v_expired_count as expired_count,
    format('Marked %s subscriptions as expired', v_expired_count) as message;
END;
$$ LANGUAGE plpgsql;

-- Function: Get Subscription Status
CREATE OR REPLACE FUNCTION get_subscription_status(p_user_id UUID)
RETURNS TABLE (
  is_active BOOLEAN,
  plan_name VARCHAR(50),
  status VARCHAR(50),
  days_remaining INTEGER,
  expiry_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (u.subscription_expiry_date > NOW() AND u.subscription_status = 'active') as is_active,
    u.subscription_plan as plan_name,
    u.subscription_status as status,
    EXTRACT(DAY FROM (u.subscription_expiry_date - NOW()))::INTEGER as days_remaining,
    u.subscription_expiry_date as expiry_date,
    u.next_billing_date as next_billing_date
  FROM users u
  WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Cancel Subscription
CREATE OR REPLACE FUNCTION cancel_subscription(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  valid_until TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT subscription_expiry_date INTO v_expiry_date
  FROM users WHERE id = p_user_id;

  UPDATE users
  SET 
    subscription_status = 'cancelled',
    auto_renew = FALSE,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT 
    TRUE as success,
    'Subscription cancelled. Access remains until expiry date.' as message,
    v_expiry_date as valid_until;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT 
    FALSE as success,
    'Error cancelling subscription: ' || SQLERRM as message,
    NULL::TIMESTAMP WITH TIME ZONE as valid_until;
END;
$$ LANGUAGE plpgsql;

-- View: Subscriptions Expiring Soon
CREATE OR REPLACE VIEW subscriptions_expiring_soon AS
SELECT 
  u.id,
  u.email,
  u.subscription_plan,
  u.subscription_status,
  u.subscription_expiry_date,
  u.next_billing_date,
  u.auto_renew,
  EXTRACT(DAY FROM (u.subscription_expiry_date - NOW()))::INTEGER as days_until_expiry
FROM users u
WHERE 
  u.subscription_expiry_date IS NOT NULL
  AND u.subscription_expiry_date > NOW()
  AND u.subscription_expiry_date <= NOW() + INTERVAL '7 days'
  AND u.subscription_status = 'active'
ORDER BY u.subscription_expiry_date ASC;

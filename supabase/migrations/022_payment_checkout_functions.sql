-- Migration: Payment checkout session functions

-- Function: Get or create checkout session for user
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
  SELECT id INTO v_existing_session_id
  FROM payment_checkout_sessions
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_existing_session_id IS NOT NULL THEN
    UPDATE payment_checkout_sessions
    SET 
      attempts = attempts + 1,
      last_attempt_at = NOW(),
      updated_at = NOW()
    WHERE id = v_existing_session_id;
    
    RETURN v_existing_session_id;
  END IF;
  
  INSERT INTO payment_checkout_sessions (
    user_id, email, subscription_plan, plan_price, currency,
    payment_provider, status, attempts, last_attempt_at
  ) VALUES (
    p_user_id, p_email, p_plan, p_price, 'USD',
    p_provider, 'pending', 1, NOW()
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Mark session as completed
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
  WHERE id = p_session_id AND status = 'pending';
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function: Expire old pending sessions
CREATE OR REPLACE FUNCTION expire_old_checkout_sessions()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE payment_checkout_sessions
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' AND expires_at < NOW();
  
  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Get user's latest checkout session
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
    id, payment_checkout_sessions.email, subscription_plan,
    plan_price, payment_checkout_sessions.status, payment_provider,
    payment_checkout_sessions.created_at, payment_checkout_sessions.expires_at
  FROM payment_checkout_sessions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

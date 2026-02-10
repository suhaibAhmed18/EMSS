-- ============================================================================
-- COMPLETE SUBSCRIPTION SYSTEM SETUP
-- ============================================================================
-- This script sets up the complete subscription system including:
-- 1. Expiry date tracking
-- 2. Monthly renewal
-- 3. Upgrade/downgrade functionality
-- Run this script in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: SUBSCRIPTION EXPIRY & VALIDITY TRACKING
-- ============================================================================

-- Add subscription expiry and validity fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_expiry_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;

-- Add upgrade tracking fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS previous_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS upgrade_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS downgrade_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scheduled_plan VARCHAR(50);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_expiry ON users(subscription_expiry_date);
CREATE INDEX IF NOT EXISTS idx_users_next_billing ON users(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_users_previous_plan ON users(previous_plan);
CREATE INDEX IF NOT EXISTS idx_users_upgrade_date ON users(upgrade_date);

-- Add comments
COMMENT ON COLUMN users.subscription_start_date IS 'Date when the current subscription period started';
COMMENT ON COLUMN users.subscription_expiry_date IS 'Date when the subscription expires (valid until)';
COMMENT ON COLUMN users.last_payment_date IS 'Date of the last successful payment';
COMMENT ON COLUMN users.next_billing_date IS 'Date when the next payment is due';
COMMENT ON COLUMN users.auto_renew IS 'Whether subscription should auto-renew on expiry';
COMMENT ON COLUMN users.previous_plan IS 'Previous subscription plan before upgrade/downgrade';
COMMENT ON COLUMN users.upgrade_date IS 'Date when last upgrade/downgrade occurred';
COMMENT ON COLUMN users.downgrade_scheduled IS 'Whether a downgrade is scheduled for next billing';
COMMENT ON COLUMN users.scheduled_plan IS 'Plan to switch to at next billing (for downgrades)';

-- ============================================================================
-- FUNCTION: Extend Subscription by 1 Month
-- ============================================================================

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
  -- Get current expiry date
  SELECT subscription_expiry_date INTO v_current_expiry
  FROM users
  WHERE id = p_user_id;

  -- Calculate new expiry date
  IF v_current_expiry IS NULL OR v_current_expiry < v_now THEN
    v_new_expiry := v_now + INTERVAL '1 month';
  ELSE
    v_new_expiry := v_current_expiry + INTERVAL '1 month';
  END IF;

  v_next_billing := v_new_expiry;

  -- Update user subscription
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

-- ============================================================================
-- FUNCTION: Check and Update Expired Subscriptions
-- ============================================================================

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

-- ============================================================================
-- FUNCTION: Get Subscription Status
-- ============================================================================

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

-- ============================================================================
-- FUNCTION: Cancel Subscription
-- ============================================================================

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
  FROM users
  WHERE id = p_user_id;

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

-- ============================================================================
-- PART 2: UPGRADE & DOWNGRADE FUNCTIONALITY
-- ============================================================================

-- ============================================================================
-- FUNCTION: Calculate Prorated Upgrade Cost
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_upgrade_cost(
  p_user_id UUID,
  p_new_plan_name VARCHAR(50)
)
RETURNS TABLE (
  current_plan VARCHAR(50),
  new_plan VARCHAR(50),
  current_plan_price DECIMAL(10,2),
  new_plan_price DECIMAL(10,2),
  days_remaining INTEGER,
  prorated_credit DECIMAL(10,2),
  upgrade_cost DECIMAL(10,2),
  new_expiry_date TIMESTAMP WITH TIME ZONE,
  message TEXT
) AS $$
DECLARE
  v_current_plan VARCHAR(50);
  v_current_price DECIMAL(10,2);
  v_new_price DECIMAL(10,2);
  v_expiry_date TIMESTAMP WITH TIME ZONE;
  v_days_remaining INTEGER;
  v_days_in_month INTEGER := 30;
  v_prorated_credit DECIMAL(10,2);
  v_upgrade_cost DECIMAL(10,2);
  v_new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current subscription details
  SELECT 
    u.subscription_plan,
    u.subscription_expiry_date,
    EXTRACT(DAY FROM (u.subscription_expiry_date - NOW()))::INTEGER
  INTO v_current_plan, v_expiry_date, v_days_remaining
  FROM users u
  WHERE u.id = p_user_id;

  -- Get current plan price
  SELECT price INTO v_current_price
  FROM subscription_plans
  WHERE LOWER(name) = LOWER(v_current_plan);

  -- Get new plan price
  SELECT price INTO v_new_price
  FROM subscription_plans
  WHERE LOWER(name) = LOWER(p_new_plan_name);

  -- Calculate prorated credit from current plan
  v_prorated_credit := (v_current_price / v_days_in_month) * v_days_remaining;

  -- Calculate upgrade cost
  v_upgrade_cost := v_new_price - v_prorated_credit;
  
  IF v_upgrade_cost < 0 THEN
    v_upgrade_cost := 0;
  END IF;

  -- New expiry date extends from current expiry by 1 month
  v_new_expiry := v_expiry_date + INTERVAL '1 month';

  RETURN QUERY SELECT
    v_current_plan as current_plan,
    p_new_plan_name as new_plan,
    v_current_price as current_plan_price,
    v_new_price as new_plan_price,
    v_days_remaining as days_remaining,
    v_prorated_credit as prorated_credit,
    v_upgrade_cost as upgrade_cost,
    v_new_expiry as new_expiry_date,
    format('Upgrade from %s to %s. Pay $%s now (includes prorated credit of $%s)', 
      v_current_plan, p_new_plan_name, v_upgrade_cost, v_prorated_credit) as message;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Upgrade Subscription
-- ============================================================================

CREATE OR REPLACE FUNCTION upgrade_subscription(
  p_user_id UUID,
  p_new_plan_name VARCHAR(50),
  p_payment_id VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  previous_plan VARCHAR(50),
  new_plan VARCHAR(50),
  new_expiry_date TIMESTAMP WITH TIME ZONE,
  next_billing_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_current_plan VARCHAR(50);
  v_current_expiry TIMESTAMP WITH TIME ZONE;
  v_new_expiry TIMESTAMP WITH TIME ZONE;
  v_next_billing TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get current plan and expiry
  SELECT subscription_plan, subscription_expiry_date
  INTO v_current_plan, v_current_expiry
  FROM users
  WHERE id = p_user_id;

  -- Calculate new expiry (extend by 1 month from current expiry)
  v_new_expiry := v_current_expiry + INTERVAL '1 month';
  v_next_billing := v_new_expiry;

  -- Update user subscription
  UPDATE users
  SET 
    previous_plan = v_current_plan,
    subscription_plan = p_new_plan_name,
    subscription_status = 'active',
    subscription_expiry_date = v_new_expiry,
    next_billing_date = v_next_billing,
    upgrade_date = NOW(),
    last_payment_date = NOW(),
    payment_id = COALESCE(p_payment_id, payment_id),
    downgrade_scheduled = FALSE,
    scheduled_plan = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT
    TRUE as success,
    format('Successfully upgraded from %s to %s', v_current_plan, p_new_plan_name) as message,
    v_current_plan as previous_plan,
    p_new_plan_name as new_plan,
    v_new_expiry as new_expiry_date,
    v_next_billing as next_billing_date;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    FALSE as success,
    'Error upgrading subscription: ' || SQLERRM as message,
    NULL::VARCHAR(50) as previous_plan,
    NULL::VARCHAR(50) as new_plan,
    NULL::TIMESTAMP WITH TIME ZONE as new_expiry_date,
    NULL::TIMESTAMP WITH TIME ZONE as next_billing_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Schedule Downgrade
-- ============================================================================

CREATE OR REPLACE FUNCTION schedule_downgrade(
  p_user_id UUID,
  p_new_plan_name VARCHAR(50)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  current_plan VARCHAR(50),
  scheduled_plan VARCHAR(50),
  effective_date TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_current_plan VARCHAR(50);
  v_expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT subscription_plan, subscription_expiry_date
  INTO v_current_plan, v_expiry_date
  FROM users
  WHERE id = p_user_id;

  UPDATE users
  SET 
    downgrade_scheduled = TRUE,
    scheduled_plan = p_new_plan_name,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT
    TRUE as success,
    format('Downgrade to %s scheduled for %s', p_new_plan_name, v_expiry_date::DATE) as message,
    v_current_plan as current_plan,
    p_new_plan_name as scheduled_plan,
    v_expiry_date as effective_date;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    FALSE as success,
    'Error scheduling downgrade: ' || SQLERRM as message,
    NULL::VARCHAR(50) as current_plan,
    NULL::VARCHAR(50) as scheduled_plan,
    NULL::TIMESTAMP WITH TIME ZONE as effective_date;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Cancel Scheduled Downgrade
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_scheduled_downgrade(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  UPDATE users
  SET 
    downgrade_scheduled = FALSE,
    scheduled_plan = NULL,
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN QUERY SELECT
    TRUE as success,
    'Scheduled downgrade cancelled' as message;

EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT
    FALSE as success,
    'Error cancelling downgrade: ' || SQLERRM as message;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Process Scheduled Downgrades
-- ============================================================================

CREATE OR REPLACE FUNCTION process_scheduled_downgrades()
RETURNS TABLE (
  processed_count INTEGER,
  message TEXT
) AS $$
DECLARE
  v_processed_count INTEGER := 0;
  v_user RECORD;
BEGIN
  FOR v_user IN 
    SELECT id, scheduled_plan, subscription_expiry_date
    FROM users
    WHERE downgrade_scheduled = TRUE
      AND scheduled_plan IS NOT NULL
      AND subscription_expiry_date <= NOW()
  LOOP
    UPDATE users
    SET 
      previous_plan = subscription_plan,
      subscription_plan = v_user.scheduled_plan,
      downgrade_scheduled = FALSE,
      scheduled_plan = NULL,
      upgrade_date = NOW(),
      updated_at = NOW()
    WHERE id = v_user.id;

    v_processed_count := v_processed_count + 1;
  END LOOP;

  RETURN QUERY SELECT
    v_processed_count as processed_count,
    format('Processed %s scheduled downgrades', v_processed_count) as message;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Get Available Upgrades
-- ============================================================================

CREATE OR REPLACE FUNCTION get_available_upgrades(p_user_id UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_name VARCHAR(100),
  plan_description TEXT,
  plan_price DECIMAL(10,2),
  current_plan_price DECIMAL(10,2),
  price_difference DECIMAL(10,2),
  features JSONB,
  is_current_plan BOOLEAN,
  can_upgrade BOOLEAN
) AS $$
DECLARE
  v_current_plan VARCHAR(50);
  v_current_price DECIMAL(10,2);
BEGIN
  -- Get user's current plan and price
  SELECT u.subscription_plan, sp.price
  INTO v_current_plan, v_current_price
  FROM users u
  JOIN subscription_plans sp ON LOWER(sp.name) = LOWER(u.subscription_plan)
  WHERE u.id = p_user_id;

  -- Return all plans with comparison
  RETURN QUERY
  SELECT 
    sp.id as plan_id,
    sp.name as plan_name,
    sp.description as plan_description,
    sp.price as plan_price,
    v_current_price as current_plan_price,
    (sp.price - v_current_price) as price_difference,
    sp.features as features,
    (LOWER(sp.name) = LOWER(v_current_plan)) as is_current_plan,
    (sp.price > v_current_price) as can_upgrade
  FROM subscription_plans sp
  WHERE sp.is_active = TRUE
  ORDER BY sp.price ASC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

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

-- View: Subscription Upgrade History
CREATE OR REPLACE VIEW subscription_upgrade_history AS
SELECT 
  u.id as user_id,
  u.email,
  u.previous_plan,
  u.subscription_plan as current_plan,
  u.upgrade_date,
  u.downgrade_scheduled,
  u.scheduled_plan,
  u.subscription_expiry_date,
  CASE 
    WHEN u.downgrade_scheduled THEN 'Downgrade Scheduled'
    WHEN u.previous_plan IS NOT NULL THEN 'Upgraded'
    ELSE 'No Changes'
  END as upgrade_status
FROM users u
WHERE u.previous_plan IS NOT NULL OR u.downgrade_scheduled = TRUE
ORDER BY u.upgrade_date DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Complete subscription system setup completed!';
  RAISE NOTICE '';
  RAISE NOTICE '📅 Expiry Tracking:';
  RAISE NOTICE '   - subscription_start_date, subscription_expiry_date';
  RAISE NOTICE '   - last_payment_date, next_billing_date';
  RAISE NOTICE '';
  RAISE NOTICE '📈 Upgrade/Downgrade:';
  RAISE NOTICE '   - previous_plan, upgrade_date';
  RAISE NOTICE '   - downgrade_scheduled, scheduled_plan';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions Created:';
  RAISE NOTICE '   - extend_subscription() - Extend by 1 month';
  RAISE NOTICE '   - check_expired_subscriptions() - Mark expired';
  RAISE NOTICE '   - get_subscription_status() - Check validity';
  RAISE NOTICE '   - cancel_subscription() - Cancel subscription';
  RAISE NOTICE '   - calculate_upgrade_cost() - Calculate prorated cost';
  RAISE NOTICE '   - upgrade_subscription() - Process upgrade';
  RAISE NOTICE '   - schedule_downgrade() - Schedule downgrade';
  RAISE NOTICE '   - get_available_upgrades() - Get all plans';
  RAISE NOTICE '   - process_scheduled_downgrades() - Process downgrades';
  RAISE NOTICE '';
  RAISE NOTICE '👁️ Views Created:';
  RAISE NOTICE '   - subscriptions_expiring_soon';
  RAISE NOTICE '   - subscription_upgrade_history';
END $$;

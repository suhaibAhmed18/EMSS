-- Migration: Add subscription upgrade and downgrade functionality

-- Add upgrade tracking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS previous_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS upgrade_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS downgrade_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scheduled_plan VARCHAR(50);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_previous_plan ON users(previous_plan);
CREATE INDEX IF NOT EXISTS idx_users_upgrade_date ON users(upgrade_date);

-- Add comments
COMMENT ON COLUMN users.previous_plan IS 'Previous subscription plan before upgrade/downgrade';
COMMENT ON COLUMN users.upgrade_date IS 'Date when last upgrade/downgrade occurred';
COMMENT ON COLUMN users.downgrade_scheduled IS 'Whether a downgrade is scheduled for next billing';
COMMENT ON COLUMN users.scheduled_plan IS 'Plan to switch to at next billing (for downgrades)';

-- Function: Calculate Prorated Upgrade Cost
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
  SELECT 
    u.subscription_plan,
    u.subscription_expiry_date,
    EXTRACT(DAY FROM (u.subscription_expiry_date - NOW()))::INTEGER
  INTO v_current_plan, v_expiry_date, v_days_remaining
  FROM users u
  WHERE u.id = p_user_id;

  SELECT price INTO v_current_price
  FROM subscription_plans
  WHERE LOWER(name) = LOWER(v_current_plan);

  SELECT price INTO v_new_price
  FROM subscription_plans
  WHERE LOWER(name) = LOWER(p_new_plan_name);

  v_prorated_credit := (v_current_price / v_days_in_month) * v_days_remaining;
  v_upgrade_cost := v_new_price - v_prorated_credit;
  
  IF v_upgrade_cost < 0 THEN
    v_upgrade_cost := 0;
  END IF;

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

-- Function: Upgrade Subscription
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
  SELECT subscription_plan, subscription_expiry_date
  INTO v_current_plan, v_current_expiry
  FROM users
  WHERE id = p_user_id;

  v_new_expiry := v_current_expiry + INTERVAL '1 month';
  v_next_billing := v_new_expiry;

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

-- Function: Schedule Downgrade
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

-- Function: Cancel Scheduled Downgrade
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

-- Function: Process Scheduled Downgrades
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

-- Function: Get Available Upgrades
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
  SELECT u.subscription_plan, sp.price
  INTO v_current_plan, v_current_price
  FROM users u
  JOIN subscription_plans sp ON LOWER(sp.name) = LOWER(u.subscription_plan)
  WHERE u.id = p_user_id;

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

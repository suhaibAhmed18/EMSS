-- Create function to get available upgrade plans for a user
CREATE OR REPLACE FUNCTION get_available_upgrades(p_user_id UUID)
RETURNS TABLE (
  plan_id UUID,
  plan_name VARCHAR,
  plan_description TEXT,
  plan_price DECIMAL,
  current_plan_price DECIMAL,
  price_difference DECIMAL,
  features JSONB,
  is_current_plan BOOLEAN,
  can_upgrade BOOLEAN
) AS $$
DECLARE
  v_current_plan VARCHAR;
  v_current_price DECIMAL;
BEGIN
  -- Get user's current plan
  SELECT subscription_plan INTO v_current_plan
  FROM users
  WHERE id = p_user_id;
  
  -- Default to 'Starter' if no plan
  v_current_plan := COALESCE(v_current_plan, 'Starter');
  
  -- Get current plan price
  SELECT price INTO v_current_price
  FROM subscription_plans
  WHERE LOWER(name) = LOWER(v_current_plan);
  
  v_current_price := COALESCE(v_current_price, 0);
  
  -- Return all plans with comparison data
  RETURN QUERY
  SELECT 
    sp.id AS plan_id,
    sp.name AS plan_name,
    sp.description AS plan_description,
    sp.price AS plan_price,
    v_current_price AS current_plan_price,
    (sp.price - v_current_price) AS price_difference,
    sp.features AS features,
    (LOWER(sp.name) = LOWER(v_current_plan)) AS is_current_plan,
    (sp.price > v_current_price) AS can_upgrade
  FROM subscription_plans sp
  WHERE sp.is_active = true
  ORDER BY sp.price ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_available_upgrades IS 'Get all available subscription plans with upgrade information for a user';

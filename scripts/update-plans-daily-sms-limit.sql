-- ============================================================================
-- UPDATE SUBSCRIPTION PLANS WITH DAILY SMS LIMITS
-- ============================================================================
-- This script updates existing subscription plans to include daily_sms_limit
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Update Starter plan
UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{daily_sms_limit}',
  '100'::jsonb
)
WHERE name = 'Starter';

-- Update Professional plan
UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{daily_sms_limit}',
  '400'::jsonb
)
WHERE name = 'Professional';

-- Update Enterprise plan
UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{daily_sms_limit}',
  '1000'::jsonb
)
WHERE name = 'Enterprise';

-- Update the features array to include daily SMS limit information
UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{features}',
  (features->'features')::jsonb || '["100 SMS per day per customer"]'::jsonb
)
WHERE name = 'Starter';

UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{features}',
  (features->'features')::jsonb || '["400 SMS per day per customer"]'::jsonb
)
WHERE name = 'Professional';

UPDATE subscription_plans
SET features = jsonb_set(
  features,
  '{features}',
  (features->'features')::jsonb || '["1,000 SMS per day per customer"]'::jsonb
)
WHERE name = 'Enterprise';

-- Verify the updates
SELECT 
  name,
  price,
  features->>'daily_sms_limit' as daily_sms_limit,
  features->'features' as feature_list
FROM subscription_plans
ORDER BY price ASC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription plans updated with daily SMS limits!';
  RAISE NOTICE '📊 Starter: 100 SMS/day, Professional: 400 SMS/day, Enterprise: 1000 SMS/day';
END $$;

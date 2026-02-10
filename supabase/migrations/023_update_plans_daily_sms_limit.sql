-- Migration: Update subscription plans with daily SMS limits

-- Update Starter plan
UPDATE subscription_plans
SET features = jsonb_set(features, '{daily_sms_limit}', '100'::jsonb)
WHERE name = 'Starter';

-- Update Professional plan
UPDATE subscription_plans
SET features = jsonb_set(features, '{daily_sms_limit}', '400'::jsonb)
WHERE name = 'Professional';

-- Update Enterprise plan
UPDATE subscription_plans
SET features = jsonb_set(features, '{daily_sms_limit}', '1000'::jsonb)
WHERE name = 'Enterprise';

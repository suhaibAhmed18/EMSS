-- ============================================================================
-- FIX SUBSCRIPTION END DATE
-- ============================================================================
-- Updates subscription_end_date to be 1 month from start date instead of 1 year
-- ============================================================================

-- Update test account subscription end date
UPDATE users 
SET 
  subscription_end_date = subscription_start_date + INTERVAL '1 month',
  updated_at = NOW()
WHERE email = 'test@example.com';

-- Verify the update
SELECT 
  email,
  subscription_plan,
  subscription_status,
  subscription_start_date,
  subscription_end_date,
  EXTRACT(DAY FROM (subscription_end_date - subscription_start_date)) as days_difference
FROM users 
WHERE email = 'test@example.com';

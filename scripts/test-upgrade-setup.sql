-- Test script to verify upgrade functionality setup
-- Run this in Supabase SQL Editor

-- 1. Check if subscription_plans table exists and has data
SELECT 
  'subscription_plans' as table_name,
  COUNT(*) as row_count,
  ARRAY_AGG(name) as plan_names
FROM subscription_plans;

-- 2. Check if get_available_upgrades function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_available_upgrades';

-- 3. Check users table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('subscription_plan', 'subscription_status', 'subscription_expires_at')
ORDER BY column_name;

-- 4. Test the function with a sample user (replace USER_ID with actual user ID)
-- SELECT * FROM get_available_upgrades('USER_ID_HERE');

-- 5. Check if there are any users
SELECT 
  id,
  email,
  subscription_plan,
  subscription_status,
  subscription_expires_at
FROM users
LIMIT 5;

-- 6. Verify subscription_plans features structure
SELECT 
  name,
  price,
  features
FROM subscription_plans
ORDER BY price;

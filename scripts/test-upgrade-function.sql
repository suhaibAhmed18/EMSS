-- Test script to verify upgrade functionality
-- Run this in Supabase SQL Editor

-- 1. Check if get_available_upgrades function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_available_upgrades';

-- 2. Check if subscription_plans table has data
SELECT 
  id,
  name,
  price,
  is_active
FROM subscription_plans
ORDER BY price;

-- 3. Test the function with a sample user (replace with actual user ID)
-- SELECT * FROM get_available_upgrades('YOUR_USER_ID_HERE');

-- 4. Check users table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('id', 'email', 'subscription_plan', 'stripe_customer_id')
ORDER BY ordinal_position;

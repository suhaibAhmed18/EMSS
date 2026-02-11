-- ============================================
-- Fix "No stores connected" Error
-- ============================================
-- This script helps diagnose and fix the issue where
-- users cannot add contacts due to no connected stores

-- Step 1: Check if stores table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stores') THEN
    RAISE NOTICE 'ERROR: stores table does not exist. Run database migrations first.';
  ELSE
    RAISE NOTICE 'SUCCESS: stores table exists';
  END IF;
END $$;

-- Step 2: Check current stores and their status
SELECT 
  'Current Stores Status' as info,
  COUNT(*) as total_stores,
  COUNT(*) FILTER (WHERE is_active = true) as active_stores,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_stores
FROM stores;

-- Step 3: List all stores with details
SELECT 
  id,
  user_id,
  shop_domain,
  store_name,
  is_active,
  created_at,
  updated_at
FROM stores
ORDER BY created_at DESC;

-- Step 4: Check users without stores
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(s.id) as store_count
FROM users u
LEFT JOIN stores s ON u.id = s.user_id AND s.is_active = true
GROUP BY u.id, u.email, u.full_name
HAVING COUNT(s.id) = 0;

-- ============================================
-- SOLUTIONS (uncomment the one you need)
-- ============================================

-- Solution 1: Activate all inactive stores
-- UPDATE stores 
-- SET is_active = true, updated_at = NOW()
-- WHERE is_active = false;

-- Solution 2: Activate stores for a specific user
-- Replace 'YOUR_USER_ID' with the actual user ID
-- UPDATE stores 
-- SET is_active = true, updated_at = NOW()
-- WHERE user_id = 'YOUR_USER_ID' AND is_active = false;

-- Solution 3: Create a test store for a user (for development/testing)
-- Replace 'YOUR_USER_ID' with the actual user ID
-- INSERT INTO stores (
--   user_id,
--   store_name,
--   shop_domain,
--   access_token,
--   is_active,
--   created_at,
--   updated_at
-- ) VALUES (
--   'YOUR_USER_ID',
--   'Test Store',
--   'test-store.myshopify.com',
--   'test_access_token_' || gen_random_uuid()::text,
--   true,
--   NOW(),
--   NOW()
-- )
-- ON CONFLICT (shop_domain) DO UPDATE
-- SET is_active = true, updated_at = NOW();

-- Solution 4: Get your user ID (run this first if you don't know it)
-- SELECT id, email, full_name FROM users ORDER BY created_at DESC LIMIT 5;

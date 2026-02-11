-- Check current stores status
SELECT 
  id,
  user_id,
  shop_domain,
  store_name,
  is_active,
  created_at
FROM stores
ORDER BY created_at DESC;

-- If you need to activate stores for a specific user, uncomment and run:
-- UPDATE stores 
-- SET is_active = true 
-- WHERE user_id = 'YOUR_USER_ID_HERE';

-- Check if stores table exists and has correct structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
ORDER BY ordinal_position;

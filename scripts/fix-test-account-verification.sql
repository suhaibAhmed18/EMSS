-- ============================================================================
-- FIX TEST ACCOUNT VERIFICATION
-- ============================================================================
-- This script ensures the test account has email_verified set to true
-- Run this if you're getting "Please verify your email" errors
-- ============================================================================

-- Check current status
SELECT 
  id,
  email,
  email_verified,
  email_verified_at,
  subscription_status,
  subscription_plan
FROM users 
WHERE email = 'test@example.com';

-- Update test account to be verified
UPDATE users 
SET 
  email_verified = true,
  email_verified_at = NOW(),
  subscription_status = 'active',
  subscription_plan = 'professional',
  updated_at = NOW()
WHERE email = 'test@example.com';

-- Verify the update
SELECT 
  id,
  email,
  email_verified,
  email_verified_at,
  subscription_status,
  subscription_plan,
  'Account is now verified and active!' as status
FROM users 
WHERE email = 'test@example.com';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ Test account updated successfully!';
  RAISE NOTICE 'Email: test@example.com';
  RAISE NOTICE 'Password: Test123456';
  RAISE NOTICE 'Status: Email verified ✓, Subscription active ✓';
  RAISE NOTICE '';
  RAISE NOTICE 'You can now login at: http://localhost:3000/auth/login';
END $$;

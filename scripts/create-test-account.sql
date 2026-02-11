-- ============================================================================
-- CREATE TEST ACCOUNT
-- ============================================================================
-- Creates a test account that can login to the dashboard
-- Email: test@example.com
-- Password: Test123456
-- ============================================================================

-- Delete existing test account if it exists
DELETE FROM users WHERE email = 'test@example.com';

-- Create test user with hashed password
-- Password: Test123456
-- SHA256 hash: 8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  name,
  password_hash,
  email_verified,
  email_verified_at,
  subscription_status,
  subscription_plan,
  subscription_start_date,
  subscription_end_date,
  stripe_customer_id,
  stripe_subscription_id,
  telnyx_phone_number,
  payment_method,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  'Test',
  'User',
  'Test User',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  true,
  NOW(),
  'active',
  'professional',
  NOW(),
  NOW() + INTERVAL '1 month',
  'cus_test_123456',
  'sub_test_123456',
  '+15551234567',
  'stripe',
  NOW(),
  NOW()
);

-- Get the user ID for reference
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM users WHERE email = 'test@example.com';
  
  -- Create SMS settings for test user
  INSERT INTO sms_settings (
    user_id,
    keyword,
    sender_name,
    quiet_hours_enabled,
    quiet_hours_start,
    quiet_hours_end,
    daily_limit,
    timezone,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'JOIN',
    'TESTINGAPP',
    false,
    '00:00',
    '00:00',
    400,
    'America/New_York',
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Add shared email address
  INSERT INTO sender_email_addresses (
    user_id,
    email,
    status,
    verified_on,
    is_shared,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    'Shared Sendra Email',
    'Verified',
    NOW(),
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, email) DO NOTHING;
  
  RAISE NOTICE 'Test account created successfully!';
  RAISE NOTICE 'Email: test@example.com';
  RAISE NOTICE 'Password: Test123456';
  RAISE NOTICE 'User ID: %', test_user_id;
END $$;

-- Verify the account was created
SELECT 
  id,
  email,
  first_name,
  last_name,
  email_verified,
  subscription_status,
  subscription_plan,
  telnyx_phone_number,
  created_at
FROM users 
WHERE email = 'test@example.com';

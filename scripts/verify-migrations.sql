-- Verification script to check if all migrations were applied successfully

-- Check all tables exist
SELECT 
  'Tables Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as found_count,
  8 as expected_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'subscription_plans',
    'email_domains',
    'sender_email_addresses',
    'sms_settings',
    'email_usage',
    'sms_usage',
    'campaign_templates',
    'shopify_checkouts',
    'payment_checkout_sessions'
  );

-- Check user table columns
SELECT 
  'User Columns Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as found_count,
  15 as expected_count
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN (
    'first_name', 'last_name',
    'email_verified', 'email_verified_at',
    'subscription_plan', 'subscription_status',
    'payment_id', 'telnyx_phone_number',
    'stripe_subscription_id',
    'subscription_start_date', 'subscription_expiry_date',
    'last_payment_date', 'next_billing_date',
    'auto_renew', 'previous_plan'
  );

-- Check functions exist
SELECT 
  'Functions Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 12 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as found_count,
  12 as expected_count
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'extend_subscription',
    'check_expired_subscriptions',
    'get_subscription_status',
    'cancel_subscription',
    'calculate_upgrade_cost',
    'upgrade_subscription',
    'schedule_downgrade',
    'cancel_scheduled_downgrade',
    'process_scheduled_downgrades',
    'get_available_upgrades',
    'get_or_create_checkout_session',
    'complete_checkout_session'
  );

-- Check views exist
SELECT 
  'Views Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as found_count,
  2 as expected_count
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN (
    'subscriptions_expiring_soon',
    'subscription_upgrade_history'
  );

-- Check subscription plans data
SELECT 
  'Subscription Plans Data' as check_type,
  CASE 
    WHEN COUNT(*) >= 3 THEN '✅ PASS'
    ELSE '❌ FAIL'
  END as status,
  COUNT(*) as found_count,
  3 as expected_count
FROM subscription_plans
WHERE name IN ('Starter', 'Professional', 'Enterprise');

-- List all subscription plans
SELECT 
  name,
  price,
  features->>'daily_sms_limit' as daily_sms_limit,
  is_active
FROM subscription_plans
ORDER BY price ASC;

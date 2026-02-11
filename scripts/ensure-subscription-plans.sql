-- ============================================================================
-- ENSURE CONSISTENT SUBSCRIPTION PLANS
-- ============================================================================
-- This script ensures subscription plans have consistent pricing across the app
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Delete existing plans to avoid duplicates
DELETE FROM subscription_plans;

-- Insert consistent subscription plans
INSERT INTO subscription_plans (name, description, price, currency, billing_period, features, is_active) VALUES
(
  'Starter',
  'Perfect for small businesses getting started with email and SMS marketing',
  10.00,
  'USD',
  'monthly',
  '{
    "sms_credits": 500,
    "email_credits": 5000,
    "contacts": 1000,
    "automations": 5,
    "daily_sms_limit": 100,
    "support": "Email support",
    "phone_number": "1 Telnyx number",
    "analytics": "Basic analytics",
    "features": [
      "Up to 1,000 contacts",
      "5,000 emails per month",
      "500 SMS per month",
      "100 SMS per day per customer",
      "5 automation workflows",
      "Basic analytics",
      "Email support",
      "Telnyx phone number included"
    ]
  }'::jsonb,
  true
),
(
  'Professional',
  'For growing businesses with advanced marketing needs',
  20.00,
  'USD',
  'monthly',
  '{
    "sms_credits": 2000,
    "email_credits": 20000,
    "contacts": 10000,
    "automations": 20,
    "daily_sms_limit": 400,
    "support": "Priority email support",
    "phone_number": "1 Telnyx number",
    "analytics": "Advanced analytics",
    "ab_testing": true,
    "features": [
      "Up to 10,000 contacts",
      "20,000 emails per month",
      "2,000 SMS per month",
      "400 SMS per day per customer",
      "20 automation workflows",
      "Advanced analytics",
      "Priority email support",
      "Telnyx phone number included",
      "A/B testing",
      "Custom templates"
    ]
  }'::jsonb,
  true
),
(
  'Enterprise',
  'For large-scale operations requiring unlimited resources',
  30.00,
  'USD',
  'monthly',
  '{
    "sms_credits": 50000,
    "email_credits": 100000,
    "contacts": "unlimited",
    "automations": "unlimited",
    "daily_sms_limit": 1000,
    "support": "24/7 priority support",
    "phone_number": "Multiple Telnyx numbers",
    "analytics": "Premium analytics & reporting",
    "ab_testing": true,
    "custom_integrations": true,
    "dedicated_manager": true,
    "features": [
      "Unlimited contacts",
      "100,000+ emails per month",
      "50,000 SMS per month",
      "1,000 SMS per day per customer",
      "Unlimited automation workflows",
      "Premium analytics & reporting",
      "24/7 priority support",
      "Multiple Telnyx phone numbers",
      "Advanced automation",
      "Custom integrations",
      "Dedicated account manager",
      "White-label options"
    ]
  }'::jsonb,
  true
);

-- Verify the plans
SELECT 
  name,
  price,
  features->>'sms_credits' as sms_credits,
  features->>'email_credits' as email_credits,
  features->>'contacts' as contacts,
  features->>'automations' as automations
FROM subscription_plans
ORDER BY price ASC;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription plans updated successfully!';
  RAISE NOTICE '📊 Plans: Starter ($10), Professional ($20), Enterprise ($30)';
END $$;

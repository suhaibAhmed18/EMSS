-- ============================================================================
-- SUBSCRIPTION PLANS SETUP
-- ============================================================================
-- This script sets up the subscription plans table and inserts default plans
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Create subscription_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view subscription plans
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can view subscription plans" 
  ON subscription_plans 
  FOR SELECT 
  USING (true);

-- Delete existing plans to avoid duplicates
DELETE FROM subscription_plans;

-- Insert default subscription plans
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

-- Verify the plans were inserted
SELECT 
  name,
  price,
  currency,
  billing_period,
  features->>'sms_credits' as sms_credits,
  features->>'email_credits' as email_credits,
  features->>'contacts' as contacts,
  is_active
FROM subscription_plans
ORDER BY price ASC;

-- Add comment to table
COMMENT ON TABLE subscription_plans IS 'Available subscription plans for the marketing platform';
COMMENT ON COLUMN subscription_plans.features IS 'JSON object containing plan features and limits';
COMMENT ON COLUMN subscription_plans.is_active IS 'Whether this plan is currently available for purchase';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription plans setup completed successfully!';
  RAISE NOTICE '📊 3 plans created: Starter ($10), Professional ($20), Enterprise ($30)';
  RAISE NOTICE '🔒 Row Level Security enabled - anyone can view plans';
END $$;

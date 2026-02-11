-- Add subscription expiry tracking and plan enforcement
-- This migration adds fields to track subscription expiry and enforce plan limits

-- Add expiry tracking to users table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='users' AND column_name='subscription_expires_at') THEN
    ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add domain verification status tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='email_domains' AND column_name='resend_domain_id') THEN
    ALTER TABLE email_domains ADD COLUMN resend_domain_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='email_domains' AND column_name='verification_status') THEN
    ALTER TABLE email_domains ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='email_domains' AND column_name='verification_started_at') THEN
    ALTER TABLE email_domains ADD COLUMN verification_started_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add email verification status tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='sender_email_addresses' AND column_name='resend_email_id') THEN
    ALTER TABLE sender_email_addresses ADD COLUMN resend_email_id VARCHAR(255);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='sender_email_addresses' AND column_name='verification_status') THEN
    ALTER TABLE sender_email_addresses ADD COLUMN verification_status VARCHAR(50) DEFAULT 'pending';
  END IF;
END $$;

-- Function to check if subscription is expired
CREATE OR REPLACE FUNCTION is_subscription_expired(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  expiry_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT subscription_expires_at INTO expiry_date
  FROM users
  WHERE id = user_id;
  
  IF expiry_date IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN expiry_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create campaigns
CREATE OR REPLACE FUNCTION can_create_campaign(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_expired BOOLEAN;
  sub_status VARCHAR(50);
BEGIN
  SELECT subscription_status, is_subscription_expired(user_id)
  INTO sub_status, is_expired
  FROM users
  WHERE id = user_id;
  
  RETURN sub_status = 'active' AND NOT is_expired;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can create automations
CREATE OR REPLACE FUNCTION can_create_automation(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN can_create_campaign(user_id);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_subscription_expired IS 'Check if a user subscription has expired';
COMMENT ON FUNCTION can_create_campaign IS 'Check if user can create campaigns based on subscription status';
COMMENT ON FUNCTION can_create_automation IS 'Check if user can create automations based on subscription status';

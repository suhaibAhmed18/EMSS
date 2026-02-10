-- ============================================================================
-- Complete Payment System Migration
-- ============================================================================
-- This migration adds all required fields for the payment system
-- Run this to update your existing database
-- ============================================================================

-- Add email verification fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP WITH TIME ZONE;

-- Add Stripe subscription field
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Add comments
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when the email was verified';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for recurring payments';

-- Update existing users to have email_verified = false if null
UPDATE users SET email_verified = FALSE WHERE email_verified IS NULL;

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '✅ Payment system migration completed successfully!';
  RAISE NOTICE '   - Added email_verified column';
  RAISE NOTICE '   - Added email_verified_at column';
  RAISE NOTICE '   - Added stripe_subscription_id column';
  RAISE NOTICE '   - Created indexes for performance';
  RAISE NOTICE '   - Updated existing users';
END $$;

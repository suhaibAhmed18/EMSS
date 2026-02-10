-- Add subscription and payment fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS telnyx_phone_number VARCHAR(20);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_telnyx_phone ON users(telnyx_phone_number);

-- Add comment
COMMENT ON COLUMN users.subscription_plan IS 'User subscription plan: starter, professional, enterprise';
COMMENT ON COLUMN users.subscription_status IS 'Subscription status: pending, active, cancelled, expired';
COMMENT ON COLUMN users.payment_id IS 'Stripe or PayPal payment ID';
COMMENT ON COLUMN users.telnyx_phone_number IS 'Assigned Telnyx phone number for SMS campaigns';

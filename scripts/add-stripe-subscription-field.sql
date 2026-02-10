-- Add stripe_subscription_id field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Add comment
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for recurring payments';

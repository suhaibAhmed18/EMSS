-- Add subscription and billing fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS paypal_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telnyx_phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telnyx_phone_number_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Create subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  features JSONB,
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50) NOT NULL,
  payment_provider VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  stripe_payment_intent_id VARCHAR(255),
  paypal_order_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create telnyx_numbers table for tracking
CREATE TABLE IF NOT EXISTS telnyx_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  telnyx_number_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_telnyx_numbers_user_id ON telnyx_numbers(user_id);
CREATE INDEX IF NOT EXISTS idx_telnyx_numbers_phone_number ON telnyx_numbers(phone_number);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_period, features) VALUES
('Starter', 'Perfect for small businesses', 29.99, 'monthly', '{"sms_credits": 500, "email_credits": 5000, "contacts": 1000, "automations": 5}'),
('Professional', 'For growing businesses', 79.99, 'monthly', '{"sms_credits": 2000, "email_credits": 20000, "contacts": 10000, "automations": 20}'),
('Enterprise', 'For large organizations', 199.99, 'monthly', '{"sms_credits": 10000, "email_credits": 100000, "contacts": "unlimited", "automations": "unlimited"}')
ON CONFLICT DO NOTHING;

-- Add triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE telnyx_numbers ENABLE ROW LEVEL SECURITY;

-- Anyone can view subscription plans
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans
  FOR SELECT USING (true);

-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can view their own Telnyx numbers
CREATE POLICY "Users can view own telnyx numbers" ON telnyx_numbers
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Service role can access all
CREATE POLICY "Service role can access all payments" ON payments
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all telnyx numbers" ON telnyx_numbers
  FOR ALL USING (auth.role() = 'service_role');

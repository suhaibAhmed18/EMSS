-- Multi-store support migration
-- Allow users to manage multiple Shopify stores

-- Add user_stores junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS user_stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'manager', 'viewer')),
  permissions JSONB DEFAULT '{}',
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store_id ON user_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_role ON user_stores(role);

-- Add store metadata and settings
ALTER TABLE stores ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise'));
ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan_limits JSONB DEFAULT '{}';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'unpaid'));

-- Add store analytics tracking
CREATE TABLE IF NOT EXISTS store_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, date, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_store_analytics_store_date ON store_analytics(store_id, date);
CREATE INDEX IF NOT EXISTS idx_store_analytics_metric ON store_analytics(metric_name);

-- Add store activity log
CREATE TABLE IF NOT EXISTS store_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_activity_log_store_id ON store_activity_log(store_id);
CREATE INDEX IF NOT EXISTS idx_store_activity_log_user_id ON store_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_store_activity_log_created_at ON store_activity_log(created_at);

-- Update user_profiles to remove direct store relationship
ALTER TABLE user_profiles DROP COLUMN IF EXISTS shopify_store_id;

-- Add professional email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL CHECK (template_type IN ('auth_verification', 'password_reset', 'welcome', 'invitation', 'notification')),
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '[]',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert professional email templates
INSERT INTO email_templates (template_type, subject, html_content, text_content, is_system) VALUES
('auth_verification', 'Verify Your Email Address - {{company_name}}', 
'<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0; }
        .content { padding: 40px; background: white; border: 1px solid #e1e5e9; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{company_name}}</h1>
        </div>
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for signing up! Please verify your email address to complete your account setup and start using our platform.</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{verification_url}}" class="button">Verify Email Address</a>
            </p>
            <p>If the button doesn''t work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{{verification_url}}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
        </div>
        <div class="footer">
            <p>If you didn''t create an account, you can safely ignore this email.</p>
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
'Welcome to {{company_name}}

Please verify your email address by clicking the link below:
{{verification_url}}

This link will expire in 24 hours.

If you didn''t create an account, you can safely ignore this email.

© {{current_year}} {{company_name}}. All rights reserved.',
true),

('password_reset', 'Reset Your Password - {{company_name}}',
'<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 40px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px 8px 0 0; }
        .content { padding: 40px; background: white; border: 1px solid #e1e5e9; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        .security-notice { background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your {{company_name}} account.</p>
            <p style="text-align: center; margin: 30px 0;">
                <a href="{{reset_url}}" class="button">Reset Password</a>
            </p>
            <p>If the button doesn''t work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #667eea;">{{reset_url}}</p>
            <div class="security-notice">
                <strong>Security Notice:</strong>
                <ul>
                    <li>This link will expire in 1 hour for security reasons</li>
                    <li>If you didn''t request this reset, please ignore this email</li>
                    <li>Your password will remain unchanged until you create a new one</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>For security questions, contact our support team.</p>
            <p>&copy; {{current_year}} {{company_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
'Password Reset Request - {{company_name}}

We received a request to reset your password for your account.

Reset your password by clicking the link below:
{{reset_url}}

This link will expire in 1 hour for security reasons.

If you didn''t request this reset, please ignore this email. Your password will remain unchanged.

© {{current_year}} {{company_name}}. All rights reserved.',
true);

-- Add RLS policies for multi-store support
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own store associations" ON user_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage stores they have admin access to" ON user_stores
  FOR ALL USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = user_stores.store_id 
      AND us.role = 'admin'
    )
  );

-- Update stores RLS policy
DROP POLICY IF EXISTS "Users can only access their own store" ON stores;

CREATE POLICY "Users can access stores they are associated with" ON stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = stores.id
    )
  );

-- Add RLS for new tables
ALTER TABLE store_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view analytics for their stores" ON store_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = store_analytics.store_id
    )
  );

ALTER TABLE store_activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view activity for their stores" ON store_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = store_activity_log.store_id
    )
  );

-- Add functions for store management
CREATE OR REPLACE FUNCTION get_user_stores(user_uuid UUID)
RETURNS TABLE (
  store_id UUID,
  store_domain TEXT,
  display_name TEXT,
  role TEXT,
  permissions JSONB,
  is_active BOOLEAN,
  plan_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.shop_domain,
    s.display_name,
    us.role,
    us.permissions,
    s.is_active,
    s.plan_type,
    us.created_at
  FROM stores s
  JOIN user_stores us ON s.id = us.store_id
  WHERE us.user_id = user_uuid
  ORDER BY us.created_at DESC;
END;
$$;

-- Add function to track store activity
CREATE OR REPLACE FUNCTION log_store_activity(
  p_store_id UUID,
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO store_activity_log (
    store_id, user_id, action, resource_type, resource_id, 
    details, ip_address, user_agent
  ) VALUES (
    p_store_id, p_user_id, p_action, p_resource_type, p_resource_id,
    p_details, p_ip_address, p_user_agent
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Add function to record store analytics
CREATE OR REPLACE FUNCTION record_store_metric(
  p_store_id UUID,
  p_date DATE,
  p_metric_name TEXT,
  p_metric_value NUMERIC,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO store_analytics (store_id, date, metric_name, metric_value, metadata)
  VALUES (p_store_id, p_date, p_metric_name, p_metric_value, p_metadata)
  ON CONFLICT (store_id, date, metric_name) 
  DO UPDATE SET 
    metric_value = EXCLUDED.metric_value,
    metadata = EXCLUDED.metadata;
END;
$$;

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_stores_updated_at 
  BEFORE UPDATE ON user_stores 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at 
  BEFORE UPDATE ON stores 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at 
  BEFORE UPDATE ON email_templates 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
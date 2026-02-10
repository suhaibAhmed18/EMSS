-- ============================================================================
-- COMPLETE SUPABASE DATABASE SCHEMA
-- ============================================================================
-- This file contains all database tables, types, indexes, triggers, and policies
-- for the Shopify Marketing Platform
-- 
-- To use: Upload this file to Supabase SQL Editor and execute
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');
CREATE TYPE consent_type AS ENUM ('email', 'sms');
CREATE TYPE consent_source AS ENUM ('shopify', 'manual', 'campaign', 'api');
CREATE TYPE campaign_send_status AS ENUM ('pending', 'delivered', 'opened', 'clicked', 'bounced', 'failed');
CREATE TYPE user_role AS ENUM ('merchant', 'admin');

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Users table for authentication
-- Note: Email verification is handled by Supabase Auth (auth.users table)
-- Users must verify their email before they can login
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  lastname VARCHAR(255),
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP WITH TIME ZONE,
  subscription_status VARCHAR(50) DEFAULT 'inactive',
  subscription_plan VARCHAR(50) DEFAULT 'starter',
  subscription_start_date TIMESTAMP WITH TIME ZONE,
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  paypal_subscription_id VARCHAR(255),
  telnyx_phone_number VARCHAR(20),
  telnyx_phone_number_id VARCHAR(255),
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'merchant' CHECK (role IN ('merchant', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  description TEXT,
  logo_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  currency TEXT DEFAULT 'USD',
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'starter', 'professional', 'enterprise')),
  plan_limits JSONB DEFAULT '{}',
  billing_email TEXT,
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'unpaid')),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stores junction table (many-to-many)
CREATE TABLE user_stores (
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

-- Contacts table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  shopify_customer_id VARCHAR(50),
  tags TEXT[] DEFAULT '{}',
  segments TEXT[] DEFAULT '{}',
  email_consent BOOLEAN DEFAULT false,
  sms_consent BOOLEAN DEFAULT false,
  total_spent DECIMAL(10,2) DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  last_order_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, email)
);

-- Email campaigns table
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(100) NOT NULL,
  status campaign_status DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS campaigns table
CREATE TABLE sms_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  from_number VARCHAR(20) NOT NULL,
  status campaign_status DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign templates table
CREATE TABLE campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Templates table (alternative structure)
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms')),
  category TEXT NOT NULL,
  subject TEXT,
  preheader TEXT,
  message TEXT,
  html TEXT,
  variables TEXT,
  thumbnail TEXT,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Automation workflows table
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB NOT NULL,
  actions JSONB NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation runs table
CREATE TABLE automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID REFERENCES automation_workflows(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  actions_executed JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent records table
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  type consent_type NOT NULL,
  consented BOOLEAN NOT NULL,
  source consent_source NOT NULL,
  ip_address INET,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign sends table
CREATE TABLE campaign_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  campaign_type VARCHAR(10) NOT NULL CHECK (campaign_type IN ('email', 'sms')),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  external_message_id VARCHAR(255),
  status campaign_send_status DEFAULT 'pending',
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign clicks table
CREATE TABLE campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  campaign_type VARCHAR(10) NOT NULL CHECK (campaign_type IN ('email', 'sms', 'automation')),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  url TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopify orders table
CREATE TABLE shopify_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_order_id VARCHAR(50) NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  order_number VARCHAR(50),
  total_price DECIMAL(10,2),
  currency VARCHAR(3),
  financial_status VARCHAR(50),
  fulfillment_status VARCHAR(50),
  attributed_campaign_id UUID,
  attributed_campaign_type VARCHAR(10) CHECK (attributed_campaign_type IN ('email', 'sms', 'automation')),
  attribution_timestamp TIMESTAMP WITH TIME ZONE,
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, shopify_order_id)
);

-- Shopify products table
CREATE TABLE shopify_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  shopify_product_id VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  handle VARCHAR(255),
  product_type VARCHAR(100),
  vendor VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(20),
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, shopify_product_id)
);

-- Shopify checkouts table
CREATE TABLE shopify_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shopify_checkout_token TEXT NOT NULL,
  email TEXT,
  cart_token TEXT,
  total_price DECIMAL(10, 2),
  currency TEXT,
  line_items_count INTEGER DEFAULT 0,
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  abandoned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, shopify_checkout_token)
);

-- Webhook events table
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  webhook_id VARCHAR(255),
  topic VARCHAR(100) NOT NULL,
  shopify_webhook_id VARCHAR(100),
  payload JSONB NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, webhook_id)
);

-- ============================================================================
-- SUBSCRIPTION & BILLING TABLES
-- ============================================================================

-- Subscription plans table
CREATE TABLE subscription_plans (
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

-- Payments table
CREATE TABLE payments (
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

-- Telnyx numbers table
CREATE TABLE telnyx_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20) NOT NULL UNIQUE,
  telnyx_number_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MONITORING & ANALYTICS TABLES
-- ============================================================================

-- Store analytics table
CREATE TABLE store_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, date, metric_name)
);

-- Store activity log table
CREATE TABLE store_activity_log (
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

-- Performance metrics table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric VARCHAR(100) NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance alerts table
CREATE TABLE performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric VARCHAR(100) NOT NULL,
  value DECIMAL(15,4) NOT NULL,
  threshold DECIMAL(15,4) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security events table
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(255) NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IP blocks table
CREATE TABLE ip_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Request logs table
CREATE TABLE request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  user_agent TEXT,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}'::jsonb,
  response_status INTEGER,
  response_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign performance table
CREATE TABLE campaign_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  campaign_type VARCHAR(10) NOT NULL CHECK (campaign_type IN ('email', 'sms')),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  metric_name VARCHAR(50) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System health checks table
CREATE TABLE system_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('healthy', 'warning', 'critical', 'unknown')),
  response_time INTEGER,
  details JSONB DEFAULT '{}'::jsonb,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error logs table
CREATE TABLE error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('authentication', 'authorization', 'validation', 'database', 'external_api', 'business_logic', 'system', 'network', 'performance')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  context JSONB DEFAULT '{}',
  stack_trace TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  request_id TEXT,
  ip_address INET,
  user_agent TEXT,
  endpoint TEXT,
  method TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App settings table
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email templates table
CREATE TABLE email_templates (
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

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_first_name ON users(first_name);
CREATE INDEX idx_users_last_name ON users(last_name);
CREATE INDEX idx_users_lastname ON users(lastname);
CREATE INDEX idx_users_email_verified ON users(email_verified);
CREATE INDEX idx_users_subscription_status ON users(subscription_status);
CREATE INDEX idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX idx_users_stripe_subscription_id ON users(stripe_subscription_id);
CREATE INDEX idx_users_telnyx_phone ON users(telnyx_phone_number);

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

-- Stores indexes
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_shop_domain ON stores(shop_domain);

-- User stores indexes
CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX idx_user_stores_store_id ON user_stores(store_id);
CREATE INDEX idx_user_stores_role ON user_stores(role);

-- Contacts indexes
CREATE INDEX idx_contacts_store_id ON contacts(store_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_shopify_customer_id ON contacts(shopify_customer_id);
CREATE INDEX idx_contacts_email_consent ON contacts(email_consent);
CREATE INDEX idx_contacts_sms_consent ON contacts(sms_consent);

-- Email campaigns indexes
CREATE INDEX idx_email_campaigns_store_id ON email_campaigns(store_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);

-- SMS campaigns indexes
CREATE INDEX idx_sms_campaigns_store_id ON sms_campaigns(store_id);
CREATE INDEX idx_sms_campaigns_status ON sms_campaigns(status);

-- Campaign templates indexes
CREATE INDEX idx_campaign_templates_store_id ON campaign_templates(store_id);
CREATE INDEX idx_campaign_templates_type ON campaign_templates(type);

-- Templates indexes
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_category ON templates(category);

-- Automation workflows indexes
CREATE INDEX idx_automation_workflows_store_id ON automation_workflows(store_id);
CREATE INDEX idx_automation_workflows_active ON automation_workflows(is_active);

-- Automation runs indexes
CREATE INDEX idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX idx_automation_runs_contact_id ON automation_runs(contact_id);
CREATE INDEX idx_automation_runs_status ON automation_runs(status);
CREATE INDEX idx_automation_runs_started_at ON automation_runs(started_at);

-- Consent records indexes
CREATE INDEX idx_consent_records_contact_id ON consent_records(contact_id);
CREATE INDEX idx_consent_records_type ON consent_records(type);

-- Campaign sends indexes
CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_contact_id ON campaign_sends(contact_id);
CREATE INDEX idx_campaign_sends_status ON campaign_sends(status);

-- Campaign clicks indexes
CREATE INDEX idx_campaign_clicks_campaign ON campaign_clicks(campaign_id, campaign_type);
CREATE INDEX idx_campaign_clicks_contact ON campaign_clicks(contact_id);
CREATE INDEX idx_campaign_clicks_clicked_at ON campaign_clicks(clicked_at);

-- Shopify orders indexes
CREATE INDEX idx_shopify_orders_store_id ON shopify_orders(store_id);
CREATE INDEX idx_shopify_orders_contact_id ON shopify_orders(contact_id);
CREATE INDEX idx_shopify_orders_shopify_order_id ON shopify_orders(shopify_order_id);
CREATE INDEX idx_shopify_orders_attributed_campaign ON shopify_orders(attributed_campaign_id, attributed_campaign_type);
CREATE INDEX idx_shopify_orders_attribution_timestamp ON shopify_orders(attribution_timestamp);

-- Shopify products indexes
CREATE INDEX idx_shopify_products_store_id ON shopify_products(store_id);

-- Shopify checkouts indexes
CREATE INDEX idx_shopify_checkouts_store ON shopify_checkouts(store_id);
CREATE INDEX idx_shopify_checkouts_abandoned ON shopify_checkouts(abandoned, created_at_shopify) WHERE abandoned = TRUE;
CREATE INDEX idx_shopify_checkouts_email ON shopify_checkouts(email) WHERE email IS NOT NULL;

-- Webhook events indexes
CREATE INDEX idx_webhook_events_store_id ON webhook_events(store_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_topic ON webhook_events(topic);
CREATE INDEX idx_webhook_events_store_topic ON webhook_events(store_id, topic, created_at DESC);
CREATE INDEX idx_webhook_events_shopify_id ON webhook_events(shopify_webhook_id);

-- Payments indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- Telnyx numbers indexes
CREATE INDEX idx_telnyx_numbers_user_id ON telnyx_numbers(user_id);
CREATE INDEX idx_telnyx_numbers_phone_number ON telnyx_numbers(phone_number);

-- Store analytics indexes
CREATE INDEX idx_store_analytics_store_date ON store_analytics(store_id, date);
CREATE INDEX idx_store_analytics_metric ON store_analytics(metric_name);

-- Store activity log indexes
CREATE INDEX idx_store_activity_log_store_id ON store_activity_log(store_id);
CREATE INDEX idx_store_activity_log_user_id ON store_activity_log(user_id);
CREATE INDEX idx_store_activity_log_created_at ON store_activity_log(created_at);

-- Performance metrics indexes
CREATE INDEX idx_performance_metrics_metric_time ON performance_metrics(metric, created_at DESC);
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

-- Performance alerts indexes
CREATE INDEX idx_performance_alerts_severity_time ON performance_alerts(severity, created_at DESC);
CREATE INDEX idx_performance_alerts_acknowledged ON performance_alerts(acknowledged, created_at DESC);

-- Security events indexes
CREATE INDEX idx_security_events_type_time ON security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity, created_at DESC);
CREATE INDEX idx_security_events_identifier ON security_events(identifier, created_at DESC);

-- IP blocks indexes
CREATE INDEX idx_ip_blocks_ip_expires ON ip_blocks(ip_address, expires_at);
CREATE INDEX idx_ip_blocks_expires_at ON ip_blocks(expires_at);

-- Request logs indexes
CREATE INDEX idx_request_logs_ip_time ON request_logs(ip_address, created_at DESC);
CREATE INDEX idx_request_logs_endpoint_time ON request_logs(endpoint, created_at DESC);
CREATE INDEX idx_request_logs_created_at ON request_logs(created_at DESC);

-- Campaign performance indexes
CREATE INDEX idx_campaign_performance_campaign ON campaign_performance(campaign_id, campaign_type);
CREATE INDEX idx_campaign_performance_store_metric ON campaign_performance(store_id, metric_name, calculated_at DESC);

-- System health checks indexes
CREATE INDEX idx_system_health_checks_name_time ON system_health_checks(check_name, checked_at DESC);
CREATE INDEX idx_system_health_checks_status ON system_health_checks(status, checked_at DESC);

-- Error logs indexes
CREATE INDEX idx_error_logs_severity ON error_logs(severity);
CREATE INDEX idx_error_logs_category ON error_logs(category);
CREATE INDEX idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX idx_error_logs_store_id ON error_logs(store_id);
CREATE INDEX idx_error_logs_resolved ON error_logs(resolved);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_stores_updated_at BEFORE UPDATE ON user_stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON sms_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_templates_updated_at BEFORE UPDATE ON campaign_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopify_orders_updated_at BEFORE UPDATE ON shopify_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopify_products_updated_at BEFORE UPDATE ON shopify_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'merchant')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update campaign revenue when order is attributed
CREATE OR REPLACE FUNCTION update_campaign_revenue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.attributed_campaign_id IS NOT NULL AND NEW.attributed_campaign_type IS NOT NULL THEN
    IF NEW.attributed_campaign_type = 'email' THEN
      UPDATE email_campaigns
      SET revenue = revenue + NEW.total_price,
          conversion_count = conversion_count + 1
      WHERE id = NEW.attributed_campaign_id;
    ELSIF NEW.attributed_campaign_type = 'sms' THEN
      UPDATE sms_campaigns
      SET revenue = revenue + NEW.total_price,
          conversion_count = conversion_count + 1
      WHERE id = NEW.attributed_campaign_id;
    ELSIF NEW.attributed_campaign_type = 'automation' THEN
      UPDATE automation_workflows
      SET revenue = revenue + NEW.total_price,
          conversion_count = conversion_count + 1
      WHERE id = NEW.attributed_campaign_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for campaign revenue updates
CREATE TRIGGER trigger_update_campaign_revenue
AFTER INSERT OR UPDATE OF attributed_campaign_id, total_price ON shopify_orders
FOR EACH ROW
EXECUTE FUNCTION update_campaign_revenue();

-- Function to update campaign click counts
CREATE OR REPLACE FUNCTION update_campaign_clicks()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.campaign_type = 'email' THEN
    UPDATE email_campaigns
    SET clicked_count = clicked_count + 1
    WHERE id = NEW.campaign_id;
  ELSIF NEW.campaign_type = 'sms' THEN
    UPDATE sms_campaigns
    SET clicked_count = clicked_count + 1
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for click count updates
CREATE TRIGGER trigger_update_campaign_clicks
AFTER INSERT ON campaign_clicks
FOR EACH ROW
EXECUTE FUNCTION update_campaign_clicks();

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_old_monitoring_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM performance_metrics WHERE created_at < NOW() - INTERVAL '90 days';
  DELETE FROM request_logs WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM security_events WHERE resolved = true AND created_at < NOW() - INTERVAL '180 days';
  DELETE FROM ip_blocks WHERE expires_at < NOW();
  DELETE FROM webhook_events WHERE created_at < NOW() - INTERVAL '30 days';
  DELETE FROM system_health_checks WHERE checked_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Function to clean up old error logs
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  retention_days INTEGER;
BEGIN
  retention_days := COALESCE(
    (SELECT value::integer FROM app_settings WHERE key = 'error_log_retention_days'),
    90
  );
  
  DELETE FROM error_logs 
  WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
  AND resolved = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get user stores
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

-- Function to log store activity
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

-- Function to record store metrics
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

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_error_statistics(
  p_store_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_errors BIGINT,
  critical_errors BIGINT,
  high_errors BIGINT,
  medium_errors BIGINT,
  low_errors BIGINT,
  resolved_errors BIGINT,
  unresolved_errors BIGINT,
  most_common_category TEXT,
  most_common_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH error_stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE severity = 'critical') as critical,
      COUNT(*) FILTER (WHERE severity = 'high') as high,
      COUNT(*) FILTER (WHERE severity = 'medium') as medium,
      COUNT(*) FILTER (WHERE severity = 'low') as low,
      COUNT(*) FILTER (WHERE resolved = true) as resolved,
      COUNT(*) FILTER (WHERE resolved = false) as unresolved
    FROM error_logs
    WHERE 
      (p_store_id IS NULL OR store_id = p_store_id)
      AND created_at::date BETWEEN p_start_date AND p_end_date
  ),
  category_stats AS (
    SELECT category, COUNT(*) as count
    FROM error_logs
    WHERE 
      (p_store_id IS NULL OR store_id = p_store_id)
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY category
    ORDER BY count DESC
    LIMIT 1
  ),
  code_stats AS (
    SELECT code, COUNT(*) as count
    FROM error_logs
    WHERE 
      (p_store_id IS NULL OR store_id = p_store_id)
      AND created_at::date BETWEEN p_start_date AND p_end_date
    GROUP BY code
    ORDER BY count DESC
    LIMIT 1
  )
  SELECT 
    es.total,
    es.critical,
    es.high,
    es.medium,
    es.low,
    es.resolved,
    es.unresolved,
    cs.category,
    cds.code
  FROM error_stats es
  CROSS JOIN category_stats cs
  CROSS JOIN code_stats cds;
END;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE telnyx_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ip_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Service role can access all users" ON users FOR ALL USING (auth.role() = 'service_role');

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role can manage all profiles" ON user_profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Stores policies
CREATE POLICY "Users can access stores they are associated with" ON stores
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = stores.id
    )
  );
CREATE POLICY "Service role can access all stores" ON stores FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User stores policies
CREATE POLICY "Users can view their own store associations" ON user_stores FOR SELECT USING (auth.uid() = user_id);
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

-- Contacts policies
CREATE POLICY "Users can view contacts from their stores" ON contacts
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert contacts to their stores" ON contacts
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update contacts in their stores" ON contacts
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete contacts from their stores" ON contacts
  FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all contacts" ON contacts FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Email campaigns policies
CREATE POLICY "Users can view email campaigns from their stores" ON email_campaigns
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert email campaigns to their stores" ON email_campaigns
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update email campaigns in their stores" ON email_campaigns
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete email campaigns from their stores" ON email_campaigns
  FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all campaigns" ON email_campaigns FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- SMS campaigns policies
CREATE POLICY "Users can view SMS campaigns from their stores" ON sms_campaigns
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert SMS campaigns to their stores" ON sms_campaigns
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update SMS campaigns in their stores" ON sms_campaigns
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete SMS campaigns from their stores" ON sms_campaigns
  FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all SMS campaigns" ON sms_campaigns FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Campaign templates policies
CREATE POLICY "Users can view templates from their stores" ON campaign_templates
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert templates to their stores" ON campaign_templates
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update templates in their stores" ON campaign_templates
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete templates from their stores" ON campaign_templates
  FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all templates" ON campaign_templates FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Automation workflows policies
CREATE POLICY "Users can view workflows from their stores" ON automation_workflows
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert workflows to their stores" ON automation_workflows
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update workflows in their stores" ON automation_workflows
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete workflows from their stores" ON automation_workflows
  FOR DELETE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all workflows" ON automation_workflows FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Consent records policies
CREATE POLICY "Users can view consent records for their store contacts" ON consent_records
  FOR SELECT USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN stores s ON c.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert consent records for their store contacts" ON consent_records
  FOR INSERT WITH CHECK (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN stores s ON c.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role can access all consent records" ON consent_records FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Campaign sends policies
CREATE POLICY "Users can view campaign sends from their stores" ON campaign_sends
  FOR SELECT USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN stores s ON c.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert campaign sends for their store contacts" ON campaign_sends
  FOR INSERT WITH CHECK (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN stores s ON c.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update campaign sends for their store contacts" ON campaign_sends
  FOR UPDATE USING (
    contact_id IN (
      SELECT c.id FROM contacts c
      JOIN stores s ON c.store_id = s.id
      WHERE s.user_id = auth.uid()
    )
  );
CREATE POLICY "Service role can access all campaign sends" ON campaign_sends FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Shopify orders policies
CREATE POLICY "Users can view orders from their stores" ON shopify_orders
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert orders to their stores" ON shopify_orders
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update orders in their stores" ON shopify_orders
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all orders" ON shopify_orders FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Shopify products policies
CREATE POLICY "Users can view products from their stores" ON shopify_products
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert products to their stores" ON shopify_products
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update products in their stores" ON shopify_products
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all products" ON shopify_products FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Webhook events policies
CREATE POLICY "Users can view webhook events from their stores" ON webhook_events
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert webhook events to their stores" ON webhook_events
  FOR INSERT WITH CHECK (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can update webhook events in their stores" ON webhook_events
  FOR UPDATE USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Service role can access all webhook events" ON webhook_events FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
CREATE POLICY "Store owners can view their webhook events" ON webhook_events
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Subscription plans policies
CREATE POLICY "Anyone can view subscription plans" ON subscription_plans FOR SELECT USING (true);

-- Payments policies
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Service role can access all payments" ON payments FOR ALL USING (auth.role() = 'service_role');

-- Telnyx numbers policies
CREATE POLICY "Users can view own telnyx numbers" ON telnyx_numbers FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Service role can access all telnyx numbers" ON telnyx_numbers FOR ALL USING (auth.role() = 'service_role');

-- Store analytics policies
CREATE POLICY "Users can view analytics for their stores" ON store_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = store_analytics.store_id
    )
  );

-- Store activity log policies
CREATE POLICY "Users can view activity for their stores" ON store_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = store_activity_log.store_id
    )
  );

-- Performance metrics policies
CREATE POLICY "Service role can manage performance metrics" ON performance_metrics FOR ALL USING (auth.role() = 'service_role');

-- Performance alerts policies
CREATE POLICY "Service role can manage performance alerts" ON performance_alerts FOR ALL USING (auth.role() = 'service_role');

-- Security events policies
CREATE POLICY "Service role can manage security events" ON security_events FOR ALL USING (auth.role() = 'service_role');

-- IP blocks policies
CREATE POLICY "Service role can manage IP blocks" ON ip_blocks FOR ALL USING (auth.role() = 'service_role');

-- Request logs policies
CREATE POLICY "Service role can manage request logs" ON request_logs FOR ALL USING (auth.role() = 'service_role');

-- Campaign performance policies
CREATE POLICY "Service role can manage campaign performance" ON campaign_performance FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Store owners can view their campaign performance" ON campaign_performance
  FOR SELECT USING (store_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- System health checks policies
CREATE POLICY "Service role can manage system health checks" ON system_health_checks FOR ALL USING (auth.role() = 'service_role');

-- Error logs policies
CREATE POLICY "System can insert error logs" ON error_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_stores us 
      WHERE us.user_id = auth.uid() 
      AND us.store_id = error_logs.store_id
      AND us.role = 'admin'
    )
  );

-- App settings policies
CREATE POLICY "System can manage app settings" ON app_settings FOR ALL USING (true);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price, billing_period, features) VALUES
('Starter', 'Perfect for small businesses', 29.99, 'monthly', '{"sms_credits": 500, "email_credits": 5000, "contacts": 1000, "automations": 5}'),
('Professional', 'For growing businesses', 79.99, 'monthly', '{"sms_credits": 2000, "email_credits": 20000, "contacts": 10000, "automations": 20}'),
('Enterprise', 'For large organizations', 199.99, 'monthly', '{"sms_credits": 10000, "email_credits": 100000, "contacts": "unlimited", "automations": "unlimited"}')
ON CONFLICT DO NOTHING;

-- Insert default app settings
INSERT INTO app_settings (key, value, description) VALUES
('error_log_retention_days', '90', 'Number of days to retain resolved error logs'),
('max_error_logs_per_day', '10000', 'Maximum number of error logs per day per store'),
('critical_error_notification_enabled', 'true', 'Enable notifications for critical errors'),
('error_rate_limit_threshold', '100', 'Error rate limit threshold per hour')
ON CONFLICT (key) DO NOTHING;

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
true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'Main users table for authentication and user management';
COMMENT ON TABLE user_profiles IS 'Extended user profile information linked to auth.users';
COMMENT ON TABLE stores IS 'Shopify store connections and configurations';
COMMENT ON TABLE user_stores IS 'Many-to-many relationship between users and stores';
COMMENT ON TABLE contacts IS 'Customer contacts from Shopify stores';
COMMENT ON TABLE email_campaigns IS 'Email marketing campaigns';
COMMENT ON TABLE sms_campaigns IS 'SMS marketing campaigns';
COMMENT ON TABLE campaign_templates IS 'Reusable campaign templates';
COMMENT ON TABLE automation_workflows IS 'Marketing automation workflows';
COMMENT ON TABLE consent_records IS 'Customer consent tracking for GDPR compliance';
COMMENT ON TABLE campaign_sends IS 'Individual campaign message sends tracking';
COMMENT ON TABLE campaign_clicks IS 'Click tracking for campaigns';
COMMENT ON TABLE shopify_orders IS 'Shopify order data for analytics and attribution';
COMMENT ON TABLE shopify_products IS 'Shopify product catalog';
COMMENT ON TABLE shopify_checkouts IS 'Tracks Shopify checkouts for cart abandonment automation';
COMMENT ON TABLE webhook_events IS 'Shopify webhook events for processing';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans';
COMMENT ON TABLE payments IS 'Payment transaction records';
COMMENT ON TABLE telnyx_numbers IS 'Telnyx phone numbers assigned to users';
COMMENT ON TABLE store_analytics IS 'Store-level analytics and metrics';
COMMENT ON TABLE store_activity_log IS 'Audit log of store activities';
COMMENT ON TABLE performance_metrics IS 'System performance metrics';
COMMENT ON TABLE error_logs IS 'Application error logging';
COMMENT ON TABLE app_settings IS 'Application configuration settings';

-- Add stripe_subscription_id field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription_id ON users(stripe_subscription_id);

-- Add comment
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID for recurring payments';
-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

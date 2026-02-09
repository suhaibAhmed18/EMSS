-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'failed');
CREATE TYPE consent_type AS ENUM ('email', 'sms');
CREATE TYPE consent_source AS ENUM ('shopify', 'manual', 'campaign', 'api');
CREATE TYPE campaign_send_status AS ENUM ('pending', 'delivered', 'opened', 'clicked', 'bounced', 'failed');
CREATE TYPE user_role AS ENUM ('merchant', 'admin');

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain VARCHAR(255) UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Campaign sends table (for tracking individual sends)
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shopify orders table (for tracking and analytics)
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
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, shopify_order_id)
);

-- Shopify products table (for campaign personalization)
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

-- Webhook events table (for processing and deduplication)
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  webhook_id VARCHAR(255) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, webhook_id)
);

-- Create indexes for performance
CREATE INDEX idx_stores_user_id ON stores(user_id);
CREATE INDEX idx_stores_shop_domain ON stores(shop_domain);
CREATE INDEX idx_contacts_store_id ON contacts(store_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_phone ON contacts(phone);
CREATE INDEX idx_contacts_shopify_customer_id ON contacts(shopify_customer_id);
CREATE INDEX idx_contacts_email_consent ON contacts(email_consent);
CREATE INDEX idx_contacts_sms_consent ON contacts(sms_consent);
CREATE INDEX idx_email_campaigns_store_id ON email_campaigns(store_id);
CREATE INDEX idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX idx_sms_campaigns_store_id ON sms_campaigns(store_id);
CREATE INDEX idx_sms_campaigns_status ON sms_campaigns(status);
CREATE INDEX idx_campaign_templates_store_id ON campaign_templates(store_id);
CREATE INDEX idx_campaign_templates_type ON campaign_templates(type);
CREATE INDEX idx_automation_workflows_store_id ON automation_workflows(store_id);
CREATE INDEX idx_automation_workflows_active ON automation_workflows(is_active);
CREATE INDEX idx_consent_records_contact_id ON consent_records(contact_id);
CREATE INDEX idx_consent_records_type ON consent_records(type);
CREATE INDEX idx_campaign_sends_campaign_id ON campaign_sends(campaign_id);
CREATE INDEX idx_campaign_sends_contact_id ON campaign_sends(contact_id);
CREATE INDEX idx_campaign_sends_status ON campaign_sends(status);
CREATE INDEX idx_shopify_orders_store_id ON shopify_orders(store_id);
CREATE INDEX idx_shopify_orders_contact_id ON shopify_orders(contact_id);
CREATE INDEX idx_shopify_orders_shopify_order_id ON shopify_orders(shopify_order_id);
CREATE INDEX idx_shopify_products_store_id ON shopify_products(store_id);
CREATE INDEX idx_webhook_events_store_id ON webhook_events(store_id);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_topic ON webhook_events(topic);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables that have updated_at column
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_campaigns_updated_at BEFORE UPDATE ON email_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sms_campaigns_updated_at BEFORE UPDATE ON sms_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_templates_updated_at BEFORE UPDATE ON campaign_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_automation_workflows_updated_at BEFORE UPDATE ON automation_workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopify_orders_updated_at BEFORE UPDATE ON shopify_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopify_products_updated_at BEFORE UPDATE ON shopify_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
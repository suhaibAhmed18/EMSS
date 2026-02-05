-- Enable Row Level Security on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
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

-- Stores policies
CREATE POLICY "Users can view their own stores" ON stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores" ON stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores" ON stores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" ON stores
  FOR DELETE USING (auth.uid() = user_id);

-- Contacts policies
CREATE POLICY "Users can view contacts from their stores" ON contacts
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert contacts to their stores" ON contacts
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts in their stores" ON contacts
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts from their stores" ON contacts
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Email campaigns policies
CREATE POLICY "Users can view email campaigns from their stores" ON email_campaigns
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert email campaigns to their stores" ON email_campaigns
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update email campaigns in their stores" ON email_campaigns
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete email campaigns from their stores" ON email_campaigns
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- SMS campaigns policies
CREATE POLICY "Users can view SMS campaigns from their stores" ON sms_campaigns
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SMS campaigns to their stores" ON sms_campaigns
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SMS campaigns in their stores" ON sms_campaigns
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete SMS campaigns from their stores" ON sms_campaigns
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Campaign templates policies
CREATE POLICY "Users can view templates from their stores" ON campaign_templates
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates to their stores" ON campaign_templates
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates in their stores" ON campaign_templates
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates from their stores" ON campaign_templates
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Automation workflows policies
CREATE POLICY "Users can view workflows from their stores" ON automation_workflows
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert workflows to their stores" ON automation_workflows
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update workflows in their stores" ON automation_workflows
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete workflows from their stores" ON automation_workflows
  FOR DELETE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

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

-- Shopify orders policies
CREATE POLICY "Users can view orders from their stores" ON shopify_orders
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert orders to their stores" ON shopify_orders
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update orders in their stores" ON shopify_orders
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Shopify products policies
CREATE POLICY "Users can view products from their stores" ON shopify_products
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products to their stores" ON shopify_products
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in their stores" ON shopify_products
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Webhook events policies
CREATE POLICY "Users can view webhook events from their stores" ON webhook_events
  FOR SELECT USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert webhook events to their stores" ON webhook_events
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update webhook events in their stores" ON webhook_events
  FOR UPDATE USING (
    store_id IN (
      SELECT id FROM stores WHERE user_id = auth.uid()
    )
  );

-- Service role policies for webhook processing and system operations
-- These allow the service role to bypass RLS for system operations

-- Allow service role to access all data for webhook processing
CREATE POLICY "Service role can access all stores" ON stores
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all contacts" ON contacts
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all campaigns" ON email_campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all SMS campaigns" ON sms_campaigns
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all templates" ON campaign_templates
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all workflows" ON automation_workflows
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all consent records" ON consent_records
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all campaign sends" ON campaign_sends
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all orders" ON shopify_orders
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all products" ON shopify_products
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can access all webhook events" ON webhook_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
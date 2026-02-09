-- Add campaign attribution tracking for revenue and conversions

-- Add campaign attribution fields to shopify_orders
ALTER TABLE shopify_orders
ADD COLUMN IF NOT EXISTS attributed_campaign_id UUID,
ADD COLUMN IF NOT EXISTS attributed_campaign_type VARCHAR(10) CHECK (attributed_campaign_type IN ('email', 'sms', 'automation')),
ADD COLUMN IF NOT EXISTS attribution_timestamp TIMESTAMP WITH TIME ZONE;

-- Add cost tracking to campaigns
ALTER TABLE email_campaigns
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;

ALTER TABLE sms_campaigns
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clicked_count INTEGER DEFAULT 0;

-- Add click tracking to campaign_sends
ALTER TABLE campaign_sends
ADD COLUMN IF NOT EXISTS click_count INTEGER DEFAULT 0;

-- Create campaign_clicks table for detailed click tracking
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  campaign_type VARCHAR(10) NOT NULL CHECK (campaign_type IN ('email', 'sms', 'automation')),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  url TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation_runs table for tracking automation executions
CREATE TABLE IF NOT EXISTS automation_runs (
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

-- Add revenue and cost tracking to automation_workflows
ALTER TABLE automation_workflows
ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS successful_runs INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS revenue DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shopify_orders_attributed_campaign ON shopify_orders(attributed_campaign_id, attributed_campaign_type);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_attribution_timestamp ON shopify_orders(attribution_timestamp);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign ON campaign_clicks(campaign_id, campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_contact ON campaign_clicks(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_clicked_at ON campaign_clicks(clicked_at);
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation_id ON automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_contact_id ON automation_runs(contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started_at ON automation_runs(started_at);

-- Create function to update campaign revenue when order is attributed
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

-- Create trigger for campaign revenue updates
DROP TRIGGER IF EXISTS trigger_update_campaign_revenue ON shopify_orders;
CREATE TRIGGER trigger_update_campaign_revenue
AFTER INSERT OR UPDATE OF attributed_campaign_id, total_price ON shopify_orders
FOR EACH ROW
EXECUTE FUNCTION update_campaign_revenue();

-- Create function to update campaign click counts
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

-- Create trigger for click count updates
DROP TRIGGER IF EXISTS trigger_update_campaign_clicks ON campaign_clicks;
CREATE TRIGGER trigger_update_campaign_clicks
AFTER INSERT ON campaign_clicks
FOR EACH ROW
EXECUTE FUNCTION update_campaign_clicks();

-- ============================================================================
-- CREATE USAGE TRACKING TABLES
-- ============================================================================
-- This script creates tables to track email and SMS usage per user
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Track email usage per user (aggregated from email_campaigns)
CREATE TABLE IF NOT EXISTS email_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  emails_sent INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track SMS usage per user (aggregated from sms_campaigns)
CREATE TABLE IF NOT EXISTS sms_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES sms_campaigns(id) ON DELETE SET NULL,
  sms_sent INTEGER DEFAULT 0,
  cost DECIMAL(10,2) DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_email_usage_user_id ON email_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_email_usage_sent_at ON email_usage(sent_at);
CREATE INDEX IF NOT EXISTS idx_sms_usage_user_id ON sms_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_usage_sent_at ON sms_usage(sent_at);

-- Function to automatically track email usage when campaign is sent
CREATE OR REPLACE FUNCTION track_email_campaign_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from store
  SELECT user_id INTO v_user_id
  FROM stores
  WHERE id = NEW.store_id;

  -- Only track when status changes to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    INSERT INTO email_usage (user_id, store_id, campaign_id, emails_sent, sent_at)
    VALUES (v_user_id, NEW.store_id, NEW.id, NEW.recipient_count, NEW.sent_at);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically track SMS usage when campaign is sent
CREATE OR REPLACE FUNCTION track_sms_campaign_usage()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user_id from store
  SELECT user_id INTO v_user_id
  FROM stores
  WHERE id = NEW.store_id;

  -- Only track when status changes to 'sent'
  IF NEW.status = 'sent' AND (OLD.status IS NULL OR OLD.status != 'sent') THEN
    INSERT INTO sms_usage (user_id, store_id, campaign_id, sms_sent, cost, sent_at)
    VALUES (v_user_id, NEW.store_id, NEW.id, NEW.recipient_count, NEW.cost, NEW.sent_at);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically track usage
DROP TRIGGER IF EXISTS trigger_track_email_usage ON email_campaigns;
CREATE TRIGGER trigger_track_email_usage
  AFTER INSERT OR UPDATE ON email_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION track_email_campaign_usage();

DROP TRIGGER IF EXISTS trigger_track_sms_usage ON sms_campaigns;
CREATE TRIGGER trigger_track_sms_usage
  AFTER INSERT OR UPDATE ON sms_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION track_sms_campaign_usage();

-- Enable RLS
ALTER TABLE email_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_usage
CREATE POLICY "Users can view their own email usage"
  ON email_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert email usage"
  ON email_usage FOR INSERT
  WITH CHECK (true);

-- RLS Policies for sms_usage
CREATE POLICY "Users can view their own SMS usage"
  ON sms_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert SMS usage"
  ON sms_usage FOR INSERT
  WITH CHECK (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Usage tracking tables created successfully!';
  RAISE NOTICE '📊 Email and SMS usage will now be tracked automatically';
  RAISE NOTICE '🔄 Triggers are active on email_campaigns and sms_campaigns tables';
END $$;

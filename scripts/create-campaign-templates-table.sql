-- Create campaign_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('email', 'sms')),
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_campaign_templates_store_id ON campaign_templates(store_id);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_type ON campaign_templates(type);
CREATE INDEX IF NOT EXISTS idx_campaign_templates_updated_at ON campaign_templates(updated_at DESC);

-- Enable RLS
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view templates from their stores" ON campaign_templates;
CREATE POLICY "Users can view templates from their stores" ON campaign_templates
  FOR SELECT
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create templates for their stores" ON campaign_templates;
CREATE POLICY "Users can create templates for their stores" ON campaign_templates
  FOR INSERT
  WITH CHECK (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update templates from their stores" ON campaign_templates;
CREATE POLICY "Users can update templates from their stores" ON campaign_templates
  FOR UPDATE
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete templates from their stores" ON campaign_templates;
CREATE POLICY "Users can delete templates from their stores" ON campaign_templates
  FOR DELETE
  USING (
    store_id IN (
      SELECT store_id FROM user_stores WHERE user_id = auth.uid()
    )
  );

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campaign_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_campaign_templates_updated_at_trigger ON campaign_templates;
CREATE TRIGGER update_campaign_templates_updated_at_trigger
  BEFORE UPDATE ON campaign_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_templates_updated_at();

-- Create templates table for storing email and SMS templates
CREATE TABLE IF NOT EXISTS templates (
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
  variables TEXT, -- JSON array of variable names
  thumbnail TEXT,
  is_custom BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- Add template_id to campaigns table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN template_id TEXT;
  END IF;
END $$;

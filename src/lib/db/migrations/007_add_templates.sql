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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);

-- Add template_id to campaigns table
ALTER TABLE campaigns ADD COLUMN template_id TEXT;

-- Add template_id to automations table (if not exists)
-- Note: This might fail if column already exists, which is fine
-- ALTER TABLE automations ADD COLUMN template_id TEXT;

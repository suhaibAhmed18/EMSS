-- Migration: Create settings tables for email domains, sender addresses, and SMS settings

-- Email domains table
CREATE TABLE IF NOT EXISTS email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  business_email VARCHAR(255),
  type VARCHAR(50) DEFAULT 'email' CHECK (type IN ('email', 'sms')),
  verified BOOLEAN DEFAULT FALSE,
  auto_warmup BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  dns_records JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Sender email addresses table
CREATE TABLE IF NOT EXISTS sender_email_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Verified', 'Failed')),
  verified_on TIMESTAMP WITH TIME ZONE,
  is_shared BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- SMS settings table
CREATE TABLE IF NOT EXISTS sms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  keyword VARCHAR(50) DEFAULT 'JOIN',
  sender_name VARCHAR(11) DEFAULT 'TESTINGAPP',
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME DEFAULT '00:00',
  quiet_hours_end TIME DEFAULT '00:00',
  daily_limit INTEGER DEFAULT 400,
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_domains_user_id ON email_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_email_domains_verified ON email_domains(verified);
CREATE INDEX IF NOT EXISTS idx_sender_email_addresses_user_id ON sender_email_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_sender_email_addresses_status ON sender_email_addresses(status);
CREATE INDEX IF NOT EXISTS idx_sms_settings_user_id ON sms_settings(user_id);

-- Triggers
DROP TRIGGER IF EXISTS update_email_domains_updated_at ON email_domains;
CREATE TRIGGER update_email_domains_updated_at 
  BEFORE UPDATE ON email_domains 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sender_email_addresses_updated_at ON sender_email_addresses;
CREATE TRIGGER update_sender_email_addresses_updated_at 
  BEFORE UPDATE ON sender_email_addresses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_settings_updated_at ON sms_settings;
CREATE TRIGGER update_sms_settings_updated_at 
  BEFORE UPDATE ON sms_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE email_domains IS 'Custom email domains for sending campaigns';
COMMENT ON TABLE sender_email_addresses IS 'Verified sender email addresses';
COMMENT ON TABLE sms_settings IS 'SMS configuration settings per user';
COMMENT ON COLUMN email_domains.business_email IS 'Business email address associated with the verified domain';

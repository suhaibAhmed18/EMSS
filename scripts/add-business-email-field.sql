-- Add business_email field to email_domains table
-- This migration adds support for storing business email addresses associated with verified domains

-- Add the business_email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'email_domains' 
    AND column_name = 'business_email'
  ) THEN
    ALTER TABLE email_domains 
    ADD COLUMN business_email VARCHAR(255);
    
    COMMENT ON COLUMN email_domains.business_email IS 'Business email address associated with the verified domain';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'email_domains'
AND column_name = 'business_email';

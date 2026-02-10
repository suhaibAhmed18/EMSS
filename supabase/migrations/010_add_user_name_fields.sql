-- Add firstName and lastName columns to users table
-- This migration splits the name field into firstName and lastName for better data management

-- Add new columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);

-- Migrate existing data: split name into firstName and lastName
UPDATE users 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND position(' ' IN name) > 0 
    THEN split_part(name, ' ', 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND position(' ' IN name) > 0 
    THEN substring(name FROM position(' ' IN name) + 1)
    ELSE NULL
  END
WHERE first_name IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- Add comment for documentation
COMMENT ON COLUMN users.first_name IS 'User first name - set during registration and read-only in profile';
COMMENT ON COLUMN users.last_name IS 'User last name - set during registration and read-only in profile';

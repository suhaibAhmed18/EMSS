-- Ensure first_name and last_name columns exist in users table
-- This script is idempotent and safe to run multiple times

-- Add first_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
    COMMENT ON COLUMN users.first_name IS 'User first name - set during registration';
  END IF;
END $$;

-- Add last_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
    COMMENT ON COLUMN users.last_name IS 'User last name - set during registration';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

-- Optional: Remove redundant 'lastname' column if it exists
-- Uncomment the following lines if you want to clean up the redundant column
-- DO $$ 
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns 
--     WHERE table_name = 'users' AND column_name = 'lastname'
--   ) THEN
--     -- First migrate any data from lastname to last_name if needed
--     UPDATE users SET last_name = lastname WHERE last_name IS NULL AND lastname IS NOT NULL;
--     -- Then drop the redundant column
--     ALTER TABLE users DROP COLUMN lastname;
--   END IF;
-- END $$;

-- Verify the columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('first_name', 'last_name', 'name')
ORDER BY column_name;

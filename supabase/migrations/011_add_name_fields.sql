-- Migration: Add first_name and last_name fields to users table
-- This migration ensures proper name field structure

-- Add first_name column if it doesn't exist
DO $ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name VARCHAR(255);
    COMMENT ON COLUMN users.first_name IS 'User first name - set during registration';
  END IF;
END $;

-- Add last_name column if it doesn't exist
DO $ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name VARCHAR(255);
    COMMENT ON COLUMN users.last_name IS 'User last name - set during registration';
  END IF;
END $;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);

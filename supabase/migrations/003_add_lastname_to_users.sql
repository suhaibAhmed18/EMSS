-- Add lastname column to users table
ALTER TABLE users ADD COLUMN lastname VARCHAR(255);

-- Create index for faster lastname lookups (useful for searching)
CREATE INDEX idx_users_lastname ON users(lastname);

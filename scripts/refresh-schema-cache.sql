-- Refresh Supabase schema cache
-- This forces Supabase to reload the database schema

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the users table structure
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

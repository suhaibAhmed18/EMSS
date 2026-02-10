-- ============================================================================
-- CONSOLIDATED MIGRATION - ALL IN ONE
-- ============================================================================
-- This file contains all migrations in a single file for easy deployment
-- Run this if you want to apply all changes at once
-- ============================================================================

-- Note: This is a consolidated version of migrations 011-023
-- For granular control, use individual migration files instead

-- Individual migrations are available in:
-- - 011_add_name_fields.sql
-- - 012_add_subscription_fields.sql
-- - 013_add_email_verification.sql
-- - 014_subscription_plans.sql
-- - 015_subscription_expiry_tracking.sql
-- - 016_subscription_upgrade_system.sql
-- - 017_settings_tables.sql
-- - 018_usage_tracking.sql
-- - 019_campaign_templates.sql
-- - 020_shopify_checkouts.sql
-- - 021_payment_checkout_sessions.sql
-- - 022_payment_checkout_functions.sql
-- - 023_update_plans_daily_sms_limit.sql

-- ============================================================================
-- IMPORTANT: Run individual migration files in order instead of this file
-- This consolidated file is provided for reference only
-- ============================================================================

-- To apply migrations properly:
-- 1. Use Supabase CLI: supabase db push
-- 2. Or run each numbered file (011-023) in sequence via SQL Editor

SELECT 'Please run individual migration files 011-023 in order' as migration_note;

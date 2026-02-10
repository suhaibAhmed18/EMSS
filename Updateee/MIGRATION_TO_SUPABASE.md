# SQL Migration to Supabase - Complete Guide

## Overview
All SQL files from the `scripts/` directory have been migrated to proper Supabase migrations in `supabase/migrations/`.

## Migration Files Created

### Core User & Subscription Management
- **011_add_name_fields.sql** - Adds first_name and last_name fields to users table
- **012_add_subscription_fields.sql** - Adds subscription_plan, subscription_status, payment_id, telnyx_phone_number, stripe_subscription_id
- **013_add_email_verification.sql** - Adds email_verified and email_verified_at fields
- **014_subscription_plans.sql** - Creates subscription_plans table with Starter, Professional, and Enterprise plans
- **015_subscription_expiry_tracking.sql** - Adds expiry tracking fields and functions (extend_subscription, check_expired_subscriptions, etc.)
- **016_subscription_upgrade_system.sql** - Adds upgrade/downgrade functionality with prorated billing

### Settings & Configuration
- **017_settings_tables.sql** - Creates email_domains, sender_email_addresses, and sms_settings tables

### Campaign & Usage Tracking
- **018_usage_tracking.sql** - Creates email_usage and sms_usage tables with automatic tracking triggers
- **019_campaign_templates.sql** - Creates campaign_templates table with RLS policies
- **020_shopify_checkouts.sql** - Creates shopify_checkouts table for cart abandonment tracking

### Payment Processing
- **021_payment_checkout_sessions.sql** - Creates payment_checkout_sessions table
- **022_payment_checkout_functions.sql** - Adds payment session management functions
- **023_update_plans_daily_sms_limit.sql** - Updates subscription plans with daily SMS limits

## How to Apply Migrations

### Option 1: Using Supabase CLI (Recommended)
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Apply all pending migrations
supabase db push
```

### Option 2: Manual Application via Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run each migration file in order (011 → 023)
4. Copy and paste the contents of each file
5. Execute the SQL

### Option 3: Using the Migration Script
```bash
# Run the migration script (if you have Node.js setup)
node scripts/run-migration.js
```

## Migration Order
The migrations are numbered and should be applied in sequence:
1. 011 - Name fields (foundation)
2. 012 - Subscription fields (foundation)
3. 013 - Email verification (foundation)
4. 014 - Subscription plans (data)
5. 015 - Expiry tracking (functions)
6. 016 - Upgrade system (functions)
7. 017 - Settings tables (tables)
8. 018 - Usage tracking (tables + triggers)
9. 019 - Campaign templates (tables + RLS)
10. 020 - Shopify checkouts (tables)
11. 021 - Payment sessions (tables)
12. 022 - Payment functions (functions)
13. 023 - Update plans (data)

## Key Functions Created

### Subscription Management
- `extend_subscription(user_id, plan_name)` - Extends subscription by 1 month
- `check_expired_subscriptions()` - Marks expired subscriptions (run daily)
- `get_subscription_status(user_id)` - Check subscription validity
- `cancel_subscription(user_id)` - Cancel subscription

### Upgrade/Downgrade
- `calculate_upgrade_cost(user_id, new_plan)` - Calculate prorated upgrade cost
- `upgrade_subscription(user_id, new_plan, payment_id)` - Process immediate upgrade
- `schedule_downgrade(user_id, new_plan)` - Schedule downgrade for next billing
- `cancel_scheduled_downgrade(user_id)` - Cancel scheduled downgrade
- `process_scheduled_downgrades()` - Process scheduled downgrades (run at billing time)
- `get_available_upgrades(user_id)` - Get all available plans

### Payment Sessions
- `get_or_create_checkout_session(user_id, email, plan, price, provider)` - Get or create session
- `complete_checkout_session(session_id, stripe_session_id, stripe_customer_id, paypal_order_id)` - Mark as completed
- `expire_old_checkout_sessions()` - Expire old sessions (run as cron)
- `get_latest_checkout_session(user_id)` - Get user's latest session

## Views Created
- `subscriptions_expiring_soon` - Subscriptions expiring in next 7 days
- `subscription_upgrade_history` - History of upgrades/downgrades

## Triggers Created
- Auto-update `updated_at` on all tables
- Auto-track email campaign usage
- Auto-track SMS campaign usage

## Row Level Security (RLS)
RLS policies have been created for:
- `subscription_plans` - Anyone can view
- `campaign_templates` - Users can only access their store's templates
- `email_usage` - Users can only view their own usage
- `sms_usage` - Users can only view their own usage

## Original Script Files
The original files in `scripts/` directory have been preserved and can be used as reference:
- `add-all-payment-fields.sql`
- `add-business-email-field.sql`
- `add-email-verification-fields.sql`
- `add-stripe-subscription-field.sql`
- `add-subscription-expiry.sql`
- `add-subscription-fields.sql`
- `add-subscription-upgrade.sql`
- `create-campaign-templates-table.sql`
- `create-checkouts-table.sql`
- `create-payment-checkout-sessions.sql`
- `create-settings-tables.sql`
- `create-test-account.sql`
- `create-usage-tracking.sql`
- `ensure-name-fields.sql`
- `fix-test-account-verification.sql`
- `refresh-schema-cache.sql`
- `setup-complete-subscription-system.sql`
- `setup-subscription-plans.sql`
- `update-plans-daily-sms-limit.sql`

## Testing After Migration
After applying migrations, verify:
1. All tables exist: `\dt` in psql or check Supabase Table Editor
2. All functions exist: `\df` in psql or check Supabase SQL Editor
3. Test key functions:
   ```sql
   -- Test subscription status
   SELECT * FROM get_subscription_status('user-uuid');
   
   -- Test available upgrades
   SELECT * FROM get_available_upgrades('user-uuid');
   
   -- View expiring subscriptions
   SELECT * FROM subscriptions_expiring_soon;
   ```

## Rollback
If you need to rollback, you can drop tables/functions in reverse order. However, it's recommended to:
1. Backup your database first
2. Test migrations in a development environment
3. Use Supabase's point-in-time recovery if needed

## Notes
- All migrations are idempotent (safe to run multiple times)
- Uses `IF NOT EXISTS` and `IF EXISTS` checks
- Preserves existing data
- Adds indexes for performance
- Includes comprehensive comments

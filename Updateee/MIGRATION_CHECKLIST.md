# Migration Checklist

Use this checklist to ensure a smooth migration process.

## Pre-Migration

- [ ] Backup your current database
- [ ] Review all migration files in `supabase/migrations/`
- [ ] Ensure you have Supabase CLI installed (or access to Dashboard)
- [ ] Have your Supabase project reference ready
- [ ] Test in development environment first (if available)

## Migration Process

### Using Supabase CLI
- [ ] Install Supabase CLI: `npm install -g supabase`
- [ ] Link project: `supabase link --project-ref YOUR_PROJECT_REF`
- [ ] Push migrations: `supabase db push`
- [ ] Verify no errors in output

### Using Supabase Dashboard
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Run migration 011_add_name_fields.sql
- [ ] Run migration 012_add_subscription_fields.sql
- [ ] Run migration 013_add_email_verification.sql
- [ ] Run migration 014_subscription_plans.sql
- [ ] Run migration 015_subscription_expiry_tracking.sql
- [ ] Run migration 016_subscription_upgrade_system.sql
- [ ] Run migration 017_settings_tables.sql
- [ ] Run migration 018_usage_tracking.sql
- [ ] Run migration 019_campaign_templates.sql
- [ ] Run migration 020_shopify_checkouts.sql
- [ ] Run migration 021_payment_checkout_sessions.sql
- [ ] Run migration 022_payment_checkout_functions.sql
- [ ] Run migration 023_update_plans_daily_sms_limit.sql

## Post-Migration Verification

### Check Tables
- [ ] `subscription_plans` table exists
- [ ] `email_domains` table exists
- [ ] `sender_email_addresses` table exists
- [ ] `sms_settings` table exists
- [ ] `email_usage` table exists
- [ ] `sms_usage` table exists
- [ ] `campaign_templates` table exists
- [ ] `shopify_checkouts` table exists
- [ ] `payment_checkout_sessions` table exists

### Check User Table Columns
- [ ] `first_name` column exists
- [ ] `last_name` column exists
- [ ] `email_verified` column exists
- [ ] `subscription_plan` column exists
- [ ] `subscription_status` column exists
- [ ] `stripe_subscription_id` column exists
- [ ] `subscription_expiry_date` column exists
- [ ] `previous_plan` column exists

### Check Functions
- [ ] `extend_subscription()` function exists
- [ ] `check_expired_subscriptions()` function exists
- [ ] `get_subscription_status()` function exists
- [ ] `calculate_upgrade_cost()` function exists
- [ ] `upgrade_subscription()` function exists
- [ ] `schedule_downgrade()` function exists
- [ ] `get_or_create_checkout_session()` function exists
- [ ] `complete_checkout_session()` function exists

### Check Data
- [ ] 3 subscription plans exist (Starter, Professional, Enterprise)
- [ ] Plans have correct prices ($10, $20, $30)
- [ ] Plans have daily_sms_limit set (100, 400, 1000)

### Check Views
- [ ] `subscriptions_expiring_soon` view exists
- [ ] `subscription_upgrade_history` view exists

### Run Verification Script
- [ ] Execute `scripts/verify-migrations.sql` in SQL Editor
- [ ] All checks show ✅ PASS

## Test Functionality

### Test Subscription Functions
```sql
-- Replace 'user-uuid' with actual user ID
- [ ] SELECT * FROM get_subscription_status('user-uuid');
- [ ] SELECT * FROM get_available_upgrades('user-uuid');
- [ ] SELECT * FROM subscriptions_expiring_soon;
```

### Test Payment Functions
```sql
- [ ] SELECT get_or_create_checkout_session(
        'user-uuid', 'test@example.com', 
        'professional', 20.00, 'stripe'
      );
```

## Application Integration

- [ ] Update environment variables if needed
- [ ] Update application code to use new functions
- [ ] Test user registration flow
- [ ] Test subscription upgrade flow
- [ ] Test payment processing
- [ ] Test usage tracking
- [ ] Test campaign creation

## Documentation

- [ ] Review MIGRATION_TO_SUPABASE.md
- [ ] Review QUICK_MIGRATION_GUIDE.md
- [ ] Update team documentation
- [ ] Document any custom changes made

## Cleanup (Optional)

- [ ] Archive old script files if no longer needed
- [ ] Remove test data if any was created
- [ ] Document migration completion date
- [ ] Update project README with new database structure

## Rollback Plan (If Needed)

- [ ] Document current state before migration
- [ ] Have rollback SQL scripts ready
- [ ] Know how to restore from backup
- [ ] Test rollback in development first

## Sign-Off

- [ ] Migration completed successfully
- [ ] All verifications passed
- [ ] Application tested and working
- [ ] Team notified of completion
- [ ] Documentation updated

---

**Migration Date**: _________________

**Completed By**: _________________

**Notes**: 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

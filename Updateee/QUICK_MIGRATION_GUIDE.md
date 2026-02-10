# Quick Migration Guide

## 🚀 Fast Track: Apply All Migrations

### Using Supabase CLI (Fastest)
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Link your project
supabase link --project-ref YOUR_PROJECT_REF

# 3. Push all migrations
supabase db push
```

### Using Supabase Dashboard
1. Open Supabase Dashboard → SQL Editor
2. Run migrations in order (011 → 023)
3. Copy/paste each file from `supabase/migrations/`
4. Execute each one

## ✅ Verify Migrations
Run this in Supabase SQL Editor:
```sql
-- Quick verification
SELECT * FROM subscription_plans;
SELECT * FROM subscriptions_expiring_soon;
```

Or use the verification script:
```bash
# In Supabase SQL Editor, run:
-- Copy contents from scripts/verify-migrations.sql
```

## 📋 What Was Migrated

### From scripts/ → supabase/migrations/
- ✅ All user subscription fields
- ✅ Subscription plans (Starter, Professional, Enterprise)
- ✅ Email verification
- ✅ Payment checkout sessions
- ✅ Usage tracking (email & SMS)
- ✅ Campaign templates
- ✅ Settings tables (email domains, SMS settings)
- ✅ Shopify checkout tracking
- ✅ Upgrade/downgrade system

### Key Functions Available
```sql
-- Extend subscription by 1 month
SELECT * FROM extend_subscription('user-uuid', 'professional');

-- Check subscription status
SELECT * FROM get_subscription_status('user-uuid');

-- Calculate upgrade cost
SELECT * FROM calculate_upgrade_cost('user-uuid', 'enterprise');

-- Upgrade subscription
SELECT * FROM upgrade_subscription('user-uuid', 'enterprise', 'payment-id');

-- Schedule downgrade
SELECT * FROM schedule_downgrade('user-uuid', 'starter');
```

## 🔧 Troubleshooting

### Migration fails with "table already exists"
✅ Safe to ignore - migrations use `IF NOT EXISTS`

### Missing functions
Run migrations 015, 016, and 022 again

### Missing subscription plans
Run migration 014 again

## 📚 Full Documentation
See `MIGRATION_TO_SUPABASE.md` for complete details.

# Supabase Migrations

This directory contains all database migrations for the project.

## Migration Files

### Existing Migrations (001-010, 20240203*)
These migrations were already in place and handle:
- Initial schema setup
- RLS policies
- User profiles
- Performance and security tables
- Templates
- Campaign attribution
- Multi-store support
- Error logging

### New Migrations (011-023)
These migrations were created from the `scripts/` directory and add:

#### User & Subscription Management (011-016)
- **011** - Name fields (first_name, last_name)
- **012** - Subscription fields (plan, status, payment info)
- **013** - Email verification
- **014** - Subscription plans table with 3 tiers
- **015** - Expiry tracking and renewal functions
- **016** - Upgrade/downgrade system with prorated billing

#### Settings & Configuration (017)
- **017** - Email domains, sender addresses, SMS settings

#### Campaign & Usage (018-020)
- **018** - Email and SMS usage tracking with auto-triggers
- **019** - Campaign templates with RLS
- **020** - Shopify checkout tracking

#### Payment Processing (021-023)
- **021** - Payment checkout sessions table
- **022** - Payment session management functions
- **023** - Update subscription plans with SMS limits

## How to Apply Migrations

### Method 1: Supabase CLI (Recommended)
```bash
# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply all pending migrations
supabase db push
```

### Method 2: Supabase Dashboard
1. Open SQL Editor in Supabase Dashboard
2. Run each migration file in numerical order
3. Start with 011 and go through 023

### Method 3: Programmatic
```javascript
// Using the Supabase client
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration(filename) {
  const sql = fs.readFileSync(`./migrations/${filename}`, 'utf8');
  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) console.error(`Error in ${filename}:`, error);
  else console.log(`✅ ${filename} applied`);
}
```

## Migration Order

Migrations must be applied in order:
1. 011 → 012 → 013 (Foundation: user fields)
2. 014 (Data: subscription plans)
3. 015 → 016 (Functions: subscription management)
4. 017 (Tables: settings)
5. 018 → 019 → 020 (Tables: campaigns & tracking)
6. 021 → 022 (Tables & Functions: payments)
7. 023 (Data: update plans)

## Verification

After applying migrations, run:
```sql
-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check subscription plans
SELECT name, price FROM subscription_plans ORDER BY price;
```

Or use the verification script:
```bash
# Run in Supabase SQL Editor
-- Copy contents from ../scripts/verify-migrations.sql
```

## Rollback

To rollback a migration:
1. Identify the migration to rollback
2. Create a reverse migration
3. Drop tables/functions in reverse order

Example rollback for migration 023:
```sql
-- Reverse 023: Remove daily_sms_limit from plans
UPDATE subscription_plans 
SET features = features - 'daily_sms_limit'
WHERE name IN ('Starter', 'Professional', 'Enterprise');
```

## Safety Features

All migrations include:
- ✅ `IF NOT EXISTS` checks for tables
- ✅ `IF EXISTS` checks for drops
- ✅ Idempotent operations (safe to run multiple times)
- ✅ Comments explaining purpose
- ✅ Indexes for performance
- ✅ RLS policies for security

## Documentation

For detailed information, see:
- `../../MIGRATION_TO_SUPABASE.md` - Complete guide
- `../../QUICK_MIGRATION_GUIDE.md` - Fast track
- `../../MIGRATION_CHECKLIST.md` - Step-by-step checklist
- `../../MIGRATION_STRUCTURE.md` - Visual structure

## Support

If you encounter issues:
1. Check the migration file for comments
2. Review the main documentation files
3. Run the verification script
4. Check Supabase logs for errors

## Notes

- Migration 000 is a reference file only (do not run)
- Migrations are numbered for sequential execution
- Each migration is self-contained and documented
- Original script files are preserved in `../../scripts/`

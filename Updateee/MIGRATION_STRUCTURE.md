# Migration Structure Overview

## Directory Structure

```
project/
├── scripts/                          # Original SQL files (preserved)
│   ├── add-all-payment-fields.sql
│   ├── add-business-email-field.sql
│   ├── add-email-verification-fields.sql
│   ├── add-stripe-subscription-field.sql
│   ├── add-subscription-expiry.sql
│   ├── add-subscription-fields.sql
│   ├── add-subscription-upgrade.sql
│   ├── create-campaign-templates-table.sql
│   ├── create-checkouts-table.sql
│   ├── create-payment-checkout-sessions.sql
│   ├── create-settings-tables.sql
│   ├── create-test-account.sql
│   ├── create-usage-tracking.sql
│   ├── ensure-name-fields.sql
│   ├── fix-test-account-verification.sql
│   ├── refresh-schema-cache.sql
│   ├── setup-complete-subscription-system.sql
│   ├── setup-subscription-plans.sql
│   ├── update-plans-daily-sms-limit.sql
│   └── verify-migrations.sql        # NEW: Verification script
│
├── supabase/
│   └── migrations/                   # Supabase migration files
│       ├── 000_consolidated_migration.sql  # Reference only
│       ├── 001-010_*.sql            # Existing migrations
│       ├── 011_add_name_fields.sql           # NEW
│       ├── 012_add_subscription_fields.sql   # NEW
│       ├── 013_add_email_verification.sql    # NEW
│       ├── 014_subscription_plans.sql        # NEW
│       ├── 015_subscription_expiry_tracking.sql  # NEW
│       ├── 016_subscription_upgrade_system.sql   # NEW
│       ├── 017_settings_tables.sql           # NEW
│       ├── 018_usage_tracking.sql            # NEW
│       ├── 019_campaign_templates.sql        # NEW
│       ├── 020_shopify_checkouts.sql         # NEW
│       ├── 021_payment_checkout_sessions.sql # NEW
│       ├── 022_payment_checkout_functions.sql # NEW
│       └── 023_update_plans_daily_sms_limit.sql # NEW
│
└── Documentation/                    # Migration guides
    ├── MIGRATION_TO_SUPABASE.md     # Complete guide
    ├── QUICK_MIGRATION_GUIDE.md     # Fast track
    ├── MIGRATION_SUMMARY.md         # Summary
    ├── MIGRATION_CHECKLIST.md       # Checklist
    └── MIGRATION_STRUCTURE.md       # This file
```

## Migration Flow

```
Original Scripts (scripts/)
         ↓
    Analyzed & Organized
         ↓
Supabase Migrations (supabase/migrations/)
         ↓
    Applied to Database
         ↓
    Verified & Tested
```

## Database Schema After Migration

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS TABLE                          │
│  Core user data + subscription fields + payment fields       │
│  - first_name, last_name                                     │
│  - email_verified, email_verified_at                         │
│  - subscription_plan, subscription_status                    │
│  - subscription_expiry_date, next_billing_date               │
│  - stripe_subscription_id, payment_id                        │
│  - previous_plan, upgrade_date, scheduled_plan               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ├─────────────────────────────────┐
                              │                                 │
                              ↓                                 ↓
┌──────────────────────────────────────┐    ┌──────────────────────────────┐
│      SUBSCRIPTION_PLANS              │    │   PAYMENT_CHECKOUT_SESSIONS  │
│  - Starter ($10)                     │    │  - Tracks incomplete payments│
│  - Professional ($20)                │    │  - Stripe/PayPal sessions    │
│  - Enterprise ($30)                  │    │  - Session expiration        │
│  - Features & limits (JSONB)         │    └──────────────────────────────┘
└──────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SETTINGS TABLES                           │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────┐ │
│  │ EMAIL_DOMAINS  │  │ SENDER_ADDRESSES │  │ SMS_SETTINGS│ │
│  │ - Domain verify│  │ - Email verify   │  │ - Keywords  │ │
│  │ - DNS records  │  │ - Status         │  │ - Limits    │ │
│  └────────────────┘  └──────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    CAMPAIGN TABLES                           │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │ CAMPAIGN_        │  │ EMAIL_USAGE    │  │ SMS_USAGE   │ │
│  │ TEMPLATES        │  │ - Auto tracked │  │ - Auto track│ │
│  │ - Email/SMS      │  │ - Per campaign │  │ - With cost │ │
│  └──────────────────┘  └────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 SHOPIFY_CHECKOUTS                            │
│  - Cart abandonment tracking                                 │
│  - Checkout tokens                                           │
│  - Completion status                                         │
└─────────────────────────────────────────────────────────────┘
```

## Functions & Procedures

```
Subscription Management
├── extend_subscription()
├── check_expired_subscriptions()
├── get_subscription_status()
└── cancel_subscription()

Upgrade/Downgrade System
├── calculate_upgrade_cost()
├── upgrade_subscription()
├── schedule_downgrade()
├── cancel_scheduled_downgrade()
├── process_scheduled_downgrades()
└── get_available_upgrades()

Payment Processing
├── get_or_create_checkout_session()
├── complete_checkout_session()
├── expire_old_checkout_sessions()
└── get_latest_checkout_session()

Usage Tracking (Triggers)
├── track_email_campaign_usage()
└── track_sms_campaign_usage()
```

## Views

```
Analytics & Monitoring
├── subscriptions_expiring_soon
│   └── Shows subscriptions expiring in next 7 days
└── subscription_upgrade_history
    └── Shows all upgrades/downgrades
```

## Security (RLS Policies)

```
Row Level Security
├── subscription_plans
│   └── Anyone can view (public)
├── campaign_templates
│   └── Users can only access their store's templates
├── email_usage
│   └── Users can only view their own usage
└── sms_usage
    └── Users can only view their own usage
```

## Migration Dependencies

```
011 (Name Fields)
  ↓
012 (Subscription Fields) ← Foundation
  ↓
013 (Email Verification)
  ↓
014 (Subscription Plans) ← Data
  ↓
015 (Expiry Tracking) ← Functions
  ↓
016 (Upgrade System) ← Functions
  ↓
017 (Settings Tables) ← Tables
  ↓
018 (Usage Tracking) ← Tables + Triggers
  ↓
019 (Campaign Templates) ← Tables + RLS
  ↓
020 (Shopify Checkouts) ← Tables
  ↓
021 (Payment Sessions) ← Tables
  ↓
022 (Payment Functions) ← Functions
  ↓
023 (Update Plans) ← Data Update
```

## Key Relationships

```
users (1) ──→ (many) email_domains
users (1) ──→ (many) sender_email_addresses
users (1) ──→ (1) sms_settings
users (1) ──→ (many) email_usage
users (1) ──→ (many) sms_usage
users (1) ──→ (many) payment_checkout_sessions

stores (1) ──→ (many) campaign_templates
stores (1) ──→ (many) shopify_checkouts
stores (1) ──→ (many) email_usage
stores (1) ──→ (many) sms_usage

subscription_plans (1) ──→ (many) users
```

## Indexes Created

```
Performance Optimization
├── User table indexes (10+)
│   ├── subscription_status
│   ├── subscription_expiry_date
│   ├── stripe_subscription_id
│   └── ... more
├── Settings table indexes
│   ├── email_domains (user_id, verified)
│   ├── sender_addresses (user_id, status)
│   └── sms_settings (user_id)
├── Usage tracking indexes
│   ├── email_usage (user_id, sent_at)
│   └── sms_usage (user_id, sent_at)
└── Payment session indexes
    ├── user_id, email, status
    ├── stripe_session_id
    └── paypal_order_id
```

## Triggers

```
Auto-Update Triggers
├── update_updated_at_column() ← Generic function
│   ├── Applied to: subscription_plans
│   ├── Applied to: email_domains
│   ├── Applied to: sender_email_addresses
│   ├── Applied to: sms_settings
│   ├── Applied to: campaign_templates
│   └── Applied to: payment_checkout_sessions
│
└── Usage Tracking Triggers
    ├── track_email_campaign_usage()
    │   └── Fires on email_campaigns INSERT/UPDATE
    └── track_sms_campaign_usage()
        └── Fires on sms_campaigns INSERT/UPDATE
```

This structure provides a complete, scalable subscription and billing system integrated with your existing database.

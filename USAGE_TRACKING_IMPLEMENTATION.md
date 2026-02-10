# Usage Tracking Implementation Guide

## Overview
This document explains how email and SMS usage tracking works in your platform and how it updates in real-time according to the user's subscription plan.

## How It Works

### 1. Database Tables Created
Two new tables track usage:
- `email_usage` - Tracks every email campaign sent
- `sms_usage` - Tracks every SMS campaign sent with costs

### 2. Automatic Tracking via Triggers
When a campaign status changes to 'sent':
- **Email campaigns**: A trigger automatically inserts a record into `email_usage` with the recipient count
- **SMS campaigns**: A trigger automatically inserts a record into `sms_usage` with recipient count and cost

### 3. Real-Time Usage Display
The Pricing & Usage page (`/settings` → Pricing and usage tab) shows:

#### Email Usage
- **Emails sent**: Actual count from `email_usage` table for current billing cycle
- **Email limit**: From subscription plan features (e.g., Starter: 5,000, Professional: 20,000)
- **Progress bar**: Visual representation of usage percentage
- **Reset date**: Shows when the billing cycle ends and usage resets

#### SMS Usage
- **SMS sent**: Actual count from `sms_usage` table for current billing cycle
- **SMS limit**: From subscription plan features (e.g., Starter: 500, Professional: 2,000)
- **Progress bar**: Visual representation of usage percentage
- **Total cost**: Sum of all SMS costs for the billing cycle
- **Reset date**: Shows when the billing cycle ends and credits refill

## Installation Steps

### Step 1: Run the Usage Tracking Script
```bash
# In Supabase SQL Editor, run:
scripts/create-usage-tracking.sql
```

This creates:
- `email_usage` and `sms_usage` tables
- Automatic triggers on `email_campaigns` and `sms_campaigns`
- Indexes for fast queries
- Row-level security policies

### Step 2: Verify Tables Created
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('email_usage', 'sms_usage');

-- Check if triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name IN ('trigger_track_email_usage', 'trigger_track_sms_usage');
```

### Step 3: Test the System
1. Send a test email campaign
2. Check that usage appears in `/settings` → Pricing and usage
3. Send a test SMS campaign
4. Verify SMS usage updates

## How Usage Updates

### When Campaigns Are Sent
```
User sends campaign → Campaign status = 'sent' → Trigger fires → Usage recorded
```

### When User Views Usage
```
User visits /settings → API fetches usage → Queries email_usage/sms_usage → 
Filters by billing cycle → Sums totals → Returns to UI
```

## Billing Cycle Logic

### Current Implementation
- **Start date**: `subscription_start_date` from users table
- **End date**: `subscription_end_date` from users table
- **Fallback**: If dates not set, uses current month (1st to last day)

### Usage Resets
Usage automatically resets each billing cycle because the API only queries records within the current cycle dates.

## Plan Limits

Limits come from `subscription_plans.features` JSON:

```json
{
  "email_credits": 5000,
  "sms_credits": 500,
  "contacts": 1000,
  "automations": 5,
  "daily_sms_limit": 100
}
```

### Plan Comparison
| Plan | Email Credits | SMS Credits | Daily SMS Limit |
|------|--------------|-------------|-----------------|
| Starter | 5,000 | 500 | 100 |
| Professional | 20,000 | 2,000 | 400 |
| Enterprise | 100,000 | 10,000 | 1,000 |

## API Endpoint

### GET `/api/settings/pricing`
Returns current usage and plan details:

```json
{
  "plan": "Professional",
  "status": "active",
  "usage": {
    "emailsSent": 1250,
    "emailsLimit": 20000,
    "smsCredits": 2000,
    "smsUsed": 450,
    "smsCost": 22.50,
    "billingCycle": {
      "start": "2026-02-01T00:00:00Z",
      "end": "2026-03-01T00:00:00Z"
    }
  }
}
```

## Features

### ✅ Real-Time Tracking
- Usage updates immediately when campaigns are sent
- No manual tracking required
- Automatic via database triggers

### ✅ Plan-Based Limits
- Limits pulled from subscription plan
- Different limits for each tier
- Upgrades automatically increase limits

### ✅ Billing Cycle Aware
- Only counts usage in current cycle
- Automatically resets each month
- Shows reset date to users

### ✅ Visual Progress Bars
- Email usage progress bar
- SMS usage progress bar
- Color-coded (green → yellow → red as limit approaches)

### ✅ Cost Tracking
- SMS costs tracked per campaign
- Total cost displayed
- Useful for billing reconciliation

## Troubleshooting

### Usage Not Updating
1. Check if triggers are active:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name LIKE 'trigger_track%';
```

2. Verify campaign status is 'sent':
```sql
SELECT id, name, status, recipient_count 
FROM email_campaigns 
WHERE status = 'sent' 
ORDER BY sent_at DESC LIMIT 5;
```

3. Check usage records exist:
```sql
SELECT * FROM email_usage ORDER BY sent_at DESC LIMIT 5;
SELECT * FROM sms_usage ORDER BY sent_at DESC LIMIT 5;
```

### Wrong Limits Showing
Check subscription plan features:
```sql
SELECT name, features 
FROM subscription_plans 
WHERE name = 'Professional';
```

### Usage Not Resetting
Verify billing cycle dates in users table:
```sql
SELECT 
  email,
  subscription_plan,
  subscription_start_date,
  subscription_end_date
FROM users
WHERE id = 'user-id-here';
```

## Future Enhancements

### Potential Additions
- [ ] Usage alerts when approaching limits
- [ ] Email notifications at 80%, 90%, 100% usage
- [ ] Historical usage charts
- [ ] Export usage reports
- [ ] Overage billing for exceeding limits
- [ ] Usage analytics dashboard
- [ ] Per-campaign cost breakdown

## Security

### Row-Level Security (RLS)
- Users can only view their own usage
- System can insert usage records automatically
- No user can modify usage records directly

### Data Privacy
- Usage data tied to user_id
- Isolated per user
- No cross-user data leakage

## Summary

Your usage tracking system now:
1. ✅ Automatically tracks email and SMS usage
2. ✅ Shows exact usage according to subscription plan
3. ✅ Updates in real-time when campaigns are sent
4. ✅ Displays progress bars and limits
5. ✅ Resets each billing cycle
6. ✅ Tracks costs for SMS campaigns

Users can now see their exact usage at any time in Settings → Pricing and usage.

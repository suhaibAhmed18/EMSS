# Daily SMS Limit - Plan-Based Implementation

## Overview
The daily SMS sending limit is now determined by the user's subscription plan and is read-only. Users cannot modify this value directly - they must upgrade their plan to increase the limit.

## Implementation Details

### Database Changes

#### Subscription Plans
Each plan now includes a `daily_sms_limit` field in the `features` JSONB column:

- **Starter Plan**: 100 SMS per day per customer
- **Professional Plan**: 400 SMS per day per customer  
- **Enterprise Plan**: 1,000 SMS per day per customer

#### SMS Settings Table
The `daily_limit` field in the `sms_settings` table is now deprecated and no longer used. The limit is fetched from the user's subscription plan instead.

### API Changes

#### GET /api/settings/sms
- Now fetches the user's `subscription_plan` from the `users` table
- Queries the `subscription_plans` table to get the plan's `daily_sms_limit`
- Returns the plan-based limit instead of the stored value

#### POST /api/settings/sms
- No longer saves `daily_limit` to the database
- The field is ignored if sent in the request

### Frontend Changes

#### SmsSettings Component
- Daily limit input is now **read-only** with visual indicators:
  - Disabled styling (opacity, cursor-not-allowed)
  - Background color shows it's not editable
- Added an info banner explaining that the limit is plan-based
- Users are informed they need to upgrade their plan to increase the limit

## Migration Steps

### 1. Update Subscription Plans
Run the migration script to add daily SMS limits to existing plans:

```bash
# In Supabase SQL Editor
scripts/update-plans-daily-sms-limit.sql
```

Or re-run the setup script:

```bash
scripts/setup-subscription-plans.sql
```

### 2. Deploy Code Changes
The following files have been updated:
- `src/app/api/settings/sms/route.ts` - API logic
- `src/components/settings/SmsSettings.tsx` - Frontend UI
- `scripts/setup-subscription-plans.sql` - Plan definitions

### 3. Verify Implementation
1. Check that subscription plans have `daily_sms_limit` in features
2. Test the SMS settings page - limit should be read-only
3. Verify different plans show different limits
4. Confirm saving settings doesn't update the daily limit

## Plan Limits Summary

| Plan | Daily SMS Limit |
|------|----------------|
| Starter | 100 |
| Professional | 400 |
| Enterprise | 1,000 |

## User Experience

When users view their SMS settings:
1. They see their current daily limit based on their plan
2. The input field is grayed out and cannot be edited
3. An info message explains the limit is plan-based
4. Users are directed to upgrade their plan for higher limits

## Future Enhancements

Consider adding:
- A link to the pricing/upgrade page in the info message
- Display the current plan name next to the limit
- Show what limit they would get with each plan upgrade
- Real-time usage tracking against the daily limit

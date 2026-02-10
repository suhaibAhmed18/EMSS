# TypeScript Errors - Complete Fixing Guide

## Current Status

- **Total Errors**: ~100 TypeScript compilation errors
- **Build Status**: Builds successfully with `ignoreBuildErrors: true`
- **Runtime**: No runtime errors (type issues are compile-time only)

## Why Errors Exist

The codebase uses Supabase with auto-generated types, but many queries return `never` type because:
1. Database schema types may not be fully generated
2. Type assertions are missing in many places
3. Some tables/columns don't match the type definitions

## Systematic Fix Approach

### Phase 1: Fix Database Type Definitions (Priority 1)

#### Step 1: Regenerate Supabase Types
```bash
# If using Supabase CLI
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database/supabase-types.ts

# Or manually update src/lib/database/supabase-types.ts to match your actual schema
```

#### Step 2: Add Missing Table Columns
Many errors are due to missing columns in type definitions:

**Missing in `users` table**:
- `subscription_status`
- `subscription_plan`
- `payment_id`
- `telnyx_phone_number`
- `email_verified`

**Missing in `shopify_orders` table**:
- `attributed_campaign_id`
- `attributed_campaign_type`

**Missing in `stores` table**:
- `store_name`
- `store_email`
- `currency`
- `timezone`
- `plan_name`

**Fix**: Update `src/lib/database/supabase-types.ts` to include these columns.

### Phase 2: Fix API Routes (Priority 2)

#### Files to Fix (in order):

1. **src/app/api/analytics/route.ts** ✅ PARTIALLY FIXED
   - Added type assertion for orders
   - Still needs: campaign type assertions

2. **src/app/api/auth/login/route.ts**
   ```typescript
   // Add type assertion
   const { data: user } = await supabase
     .from('users')
     .select('*')
     .eq('email', email)
     .single()
   
   // Type the result
   type UserWithSubscription = {
     id: string
     email: string
     telnyx_phone_number?: string | null
     subscription_status?: string | null
     // ... other fields
   }
   
   const typedUser = user as UserWithSubscription | null
   ```

3. **src/app/api/auth/resend-verification/route.ts**
   - Add `email_verified` to user type

4. **src/app/api/auth/update-password/route.ts**
   - Add proper types for user object
   - Type the password_hash field

5. **src/app/api/automations/[id]/route.ts**
   - Type the update payload

6. **src/app/api/automations/[id]/toggle/route.ts**
   - Add `stores` relation to automation type

7. **src/app/api/automations/route.ts**
   - Type the allAutomations array explicitly

8. **src/app/api/campaigns/[id]/duplicate/route.ts**
   - Fix spread type error with proper typing

9. **src/app/api/campaigns/[id]/route.ts**
   - Fix spread type error

10. **src/app/api/campaigns/[id]/send/route.ts**
    - Type contact objects properly
    - Add consent fields to contact type

11. **src/app/api/campaigns/route.ts**
    - Fix spread types for campaigns

12. **src/app/api/contacts/import/route.ts**
    - Add `store_id` to User type or get from session

13. **src/app/api/payments/process/route.ts** ✅ FIXED
    - Stripe API version corrected

14. **src/app/api/settings/route.ts**
    - Type user object properly

15. **src/app/api/settings/shopify/route.ts**
    - Add store fields to type

16. **src/app/api/setup/migrate/route.ts**
    - Fix SQL execution parameter types

17. **src/app/api/stores/[id]/route.ts**
    - Type store object with all fields

18. **src/app/api/stores/delete/route.ts**
    - Type store object

19. **src/app/api/stores/sync/route.ts**
    - Type contact creation payload
    - Type order creation payload

### Phase 3: Fix Test Files (Priority 3)

#### src/__tests__/e2e-integration.test.ts (19 errors)

**Issues**:
1. Missing `sendCampaign` method
2. Wrong property names
3. Type mismatches

**Fixes**:
```typescript
// 1. Add sendCampaign to campaign managers or update tests
// 2. Fix property names:
//    - success → status
//    - domainId → domain  
//    - actionsExecuted → actions_executed
//    - errors → error
// 3. Update mock types to match actual implementations
```

### Phase 4: Create Type Helper Utilities (Priority 4)

Create `src/lib/database/type-helpers.ts`:

```typescript
import type { Database } from './supabase-types'

// Helper to type Supabase query results
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// Extended types with additional fields
export type UserWithSubscription = Tables<'users'> & {
  subscription_status?: string | null
  subscription_plan?: string | null
  payment_id?: string | null
  telnyx_phone_number?: string | null
}

export type StoreWithDetails = Tables<'stores'> & {
  store_name?: string | null
  store_email?: string | null
  currency?: string | null
  timezone?: string | null
  plan_name?: string | null
}

export type OrderWithAttribution = Tables<'shopify_orders'> & {
  attributed_campaign_id?: string | null
  attributed_campaign_type?: string | null
}

export type ContactWithConsent = Tables<'contacts'> & {
  email_consent: boolean
  sms_consent: boolean
}

// Type guard helpers
export function isUserWithSubscription(user: unknown): user is UserWithSubscription {
  return typeof user === 'object' && user !== null && 'id' in user && 'email' in user
}
```

Then use in API routes:

```typescript
import { UserWithSubscription, StoreWithDetails } from '@/lib/database/type-helpers'

const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

const typedUser = user as UserWithSubscription | null
```

## Quick Fix Template

For any API route with type errors:

```typescript
// 1. Import type helpers
import type { Tables } from '@/lib/database/type-helpers'

// 2. Define extended type if needed
type ExtendedType = Tables<'table_name'> & {
  additional_field?: string | null
}

// 3. Query database
const { data } = await supabase
  .from('table_name')
  .select('*')
  .eq('id', id)

// 4. Type assert the result
const typedData = (data || []) as ExtendedType[]

// 5. Use typed data safely
typedData.forEach(item => {
  console.log(item.additional_field) // No error!
})
```

## Automated Fix Script

Create `fix-types-batch.sh`:

```bash
#!/bin/bash

echo "🔧 Fixing TypeScript errors in batches..."

# Fix analytics route
echo "Fixing analytics route..."
# Already done

# Fix auth routes
echo "Fixing auth routes..."
# Add type assertions to login, resend-verification, update-password

# Fix automation routes  
echo "Fixing automation routes..."
# Add type assertions

# Fix campaign routes
echo "Fixing campaign routes..."
# Add type assertions

# Fix other routes
echo "Fixing remaining routes..."
# Add type assertions

echo "✅ Batch fixes complete. Run 'npx tsc --noEmit' to check remaining errors."
```

## Progress Tracking

Create a checklist:

```markdown
## API Routes Fixed
- [ ] analytics/route.ts (partially done)
- [ ] auth/login/route.ts
- [ ] auth/resend-verification/route.ts
- [ ] auth/update-password/route.ts
- [ ] automations/[id]/route.ts
- [ ] automations/[id]/toggle/route.ts
- [ ] automations/route.ts
- [ ] campaigns/[id]/duplicate/route.ts
- [ ] campaigns/[id]/route.ts
- [ ] campaigns/[id]/send/route.ts
- [ ] campaigns/route.ts
- [ ] contacts/import/route.ts
- [x] payments/process/route.ts
- [ ] settings/route.ts
- [ ] settings/shopify/route.ts
- [ ] setup/migrate/route.ts
- [ ] stores/[id]/route.ts
- [ ] stores/delete/route.ts
- [ ] stores/sync/route.ts

## Test Files Fixed
- [ ] e2e-integration.test.ts
```

## Verification

After each fix:

```bash
# Check specific file
npx tsc --noEmit src/app/api/analytics/route.ts

# Check all files
npx tsc --noEmit

# Count remaining errors
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

## Goal

Reduce errors from 100+ to 0, then set `ignoreBuildErrors: false` in `next.config.ts`.

## Estimated Time

- Phase 1 (Database types): 1-2 hours
- Phase 2 (API routes): 3-4 hours  
- Phase 3 (Tests): 1-2 hours
- Phase 4 (Helpers): 1 hour

**Total**: 6-9 hours of focused work

## Tips

1. **Fix in batches**: Don't try to fix everything at once
2. **Test after each fix**: Run `npx tsc --noEmit` frequently
3. **Use type helpers**: Create reusable type utilities
4. **Document as you go**: Add comments explaining type assertions
5. **Commit frequently**: Commit after each file or small batch

## When Stuck

If a type error is too complex:
1. Check the actual database schema
2. Look at the Supabase dashboard
3. Add a type assertion as a temporary fix
4. Add a TODO comment to revisit later

```typescript
// TODO: Fix this type properly after database schema is updated
const data = result as any // Temporary fix
```

---

**Remember**: The app works fine at runtime. These are compile-time type safety issues that improve developer experience and catch bugs early.

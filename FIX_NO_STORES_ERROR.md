# Fix: "No stores connected" Error

## Problem
When trying to add a contact, you get the error:
```
No stores connected. Please connect a Shopify store first.
```

## Root Cause
The contacts API requires at least one active Shopify store to be connected to your account. The system checks for stores where `is_active = true` for the current user.

## Quick Solutions

### Option 1: Use the Automated Script (Recommended)
Run this command with your user email:

```bash
node scripts/create-test-store.js your-email@example.com
```

This script will:
- Find your user account
- Check for existing stores
- Activate any inactive stores
- Create a test store if needed

### Option 2: Run SQL Directly
1. Open Supabase SQL Editor
2. Run the diagnostic script:
   ```bash
   # Copy contents of scripts/fix-no-stores-error.sql
   ```
3. Follow the solutions in the comments

### Option 3: Connect a Real Shopify Store
1. Go to Settings → Shopify Integration
2. Click "Connect Shopify Store"
3. Complete the OAuth flow

## Verification Steps

After applying a fix, verify it worked:

1. Check stores in database:
   ```sql
   SELECT id, user_id, shop_domain, store_name, is_active 
   FROM stores 
   WHERE user_id = 'YOUR_USER_ID';
   ```

2. Try adding a contact again through the UI

3. Check browser console for any errors

## Common Issues

### Issue: "stores table does not exist"
**Solution:** Run database migrations first:
```bash
# Run the complete schema setup
psql -h YOUR_DB_HOST -U postgres -d postgres -f COMPLETE_DATABASE_SCHEMA.sql
```

### Issue: User ID unknown
**Solution:** Find your user ID:
```sql
SELECT id, email, full_name FROM users ORDER BY created_at DESC;
```

### Issue: Store exists but is inactive
**Solution:** Activate the store:
```sql
UPDATE stores 
SET is_active = true, updated_at = NOW()
WHERE user_id = 'YOUR_USER_ID';
```

## Technical Details

The error occurs in `/src/app/api/contacts/route.ts` at line 119:
```typescript
const stores = await databaseService.getStoresByUserId(user.id)

if (stores.length === 0) {
  return NextResponse.json(
    { error: 'No stores connected. Please connect a Shopify store first.' },
    { status: 400 }
  )
}
```

The `getStoresByUserId` function filters for active stores:
```typescript
.eq('is_active', true)
```

## Prevention

To avoid this in the future:
1. Always ensure new users have a default store created
2. Consider adding a "demo mode" that doesn't require stores
3. Add better onboarding flow for store connection

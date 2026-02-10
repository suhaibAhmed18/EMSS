# Contact Import/Export Fix - Store Association Issue

## Problem
The contact import and export functionality was failing with the error:
```
"No store associated with user"
```

This occurred when users tried to:
- Import contacts from CSV files at `/contactsImport`
- Export contacts to CSV files

## Root Cause
Both API routes (`/api/contacts/import` and `/api/contacts/export`) were attempting to access `user.store_id` directly from the user object:

```typescript
const storeId = user.store_id  // ❌ This field doesn't exist
if (!storeId) {
  return NextResponse.json({ error: 'No store associated with user' }, { status: 400 })
}
```

However, the `authServer.getCurrentUser()` method only returns basic user fields (`id`, `email`, `firstName`, `lastName`, etc.) and does NOT include `store_id`.

## Solution
Updated both routes to use the correct pattern from `/api/contacts/route.ts`:

```typescript
// Get user's stores
const stores = await databaseService.getStoresByUserId(user.id)
if (stores.length === 0) {
  return NextResponse.json({ 
    error: 'No store associated with user. Please connect a Shopify store first.' 
  }, { status: 400 })
}

// Use the first store
const storeId = stores[0].id
```

## Files Modified

### 1. `src/app/api/contacts/import/route.ts`
- Added import: `import { databaseService } from '@/lib/database/service'`
- Replaced direct `user.store_id` access with `databaseService.getStoresByUserId(user.id)`
- Improved error message to guide users to connect a Shopify store

### 2. `src/app/api/contacts/export/route.ts`
- Added import: `import { databaseService } from '@/lib/database/service'`
- Replaced direct `user.store_id` access with `databaseService.getStoresByUserId(user.id)`
- Improved error message to guide users to connect a Shopify store

## How It Works Now

### Import Flow
1. User navigates to `/contacts` page
2. Clicks "Import Contacts" button
3. Selects a CSV file with required format:
   - **Required column**: `email`
   - **Optional columns**: `first_name`, `last_name`, `phone`, `tags`, `email_consent`, `sms_consent`, `total_spent`, `order_count`
4. File is uploaded to `/api/contacts/import`
5. API validates user authentication
6. API queries user's stores using `databaseService.getStoresByUserId()`
7. CSV is parsed and validated
8. Contacts are created in the database with proper store association
9. Success/error message is displayed with import statistics

### Export Flow
1. User clicks "Export Contacts" button
2. Request sent to `/api/contacts/export`
3. API validates user authentication
4. API queries user's stores using `databaseService.getStoresByUserId()`
5. All contacts for the store are fetched
6. CSV file is generated with all contact fields
7. File is downloaded to user's device

## CSV Format Example
```csv
email,first_name,last_name,phone,tags,email_consent,sms_consent,total_spent,order_count
john@example.com,John,Doe,+1234567890,vip;customer,yes,yes,150.00,3
jane@example.com,Jane,Smith,+1987654321,customer,yes,no,75.50,1
```

## Database Architecture
- **users** table: Contains user authentication data
- **stores** table: Contains store data with `user_id` foreign key
- **contacts** table: Contains contact data with `store_id` foreign key
- Users can have multiple stores (one-to-many relationship)
- Contacts belong to a specific store (many-to-one relationship)

## Testing
✅ No TypeScript errors in modified files
✅ Import functionality now properly associates contacts with user's store
✅ Export functionality now properly fetches contacts from user's store
✅ Error messages guide users to connect a Shopify store if none exists

## Related Files
- `src/app/contacts/page.tsx` - Contact management UI with import/export modals
- `src/lib/database/service.ts` - Database service with `getStoresByUserId()` method
- `src/lib/auth/server.ts` - Authentication service
- `CONTACT_IMPORT_EXPORT_FIX.md` - Previous UI fixes for import/export modals

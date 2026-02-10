# Store Connect/Disconnect Feature Update

## Summary
Updated the store settings page to show a "Connect Store" button when no store is connected, and a "Disconnect Store" button that permanently deletes the store and all associated data when a store is connected.

## Changes Made

### 1. StoreInformation Component (`src/components/settings/StoreInformation.tsx`)

#### Error State (No Store Connected)
- **Changed**: Replaced "Retry" button with "Connect Store" button
- **Behavior**: Redirects to `/stores/connect` page for store connection
- **Icon**: Added Store icon to the button

#### Disconnect Functionality
- **Updated**: Enhanced confirmation message to warn about permanent data deletion
- **Message**: "Are you sure you want to disconnect your store? This will permanently delete all store data including contacts, campaigns, and settings. This action cannot be undone."
- **Behavior**: After successful disconnect, shows the "No Store Connected" state with the "Connect Store" button

### 2. Disconnect API Route (`src/app/api/auth/shopify/disconnect/route.ts`)

- **Changed**: Updated from `deactivateStore()` to `deleteStore()`
- **Behavior**: Now permanently deletes the store instead of just marking it as inactive
- **Response**: Updated success message to "Store and all associated data deleted successfully"

### 3. Store Manager (`src/lib/shopify/store-manager.ts`)

#### New Method: `deleteStore()`
```typescript
async deleteStore(storeId: string): Promise<void>
```

- **Purpose**: Permanently delete a store and all associated data
- **Implementation**: Uses Supabase DELETE operation
- **Cascade Deletion**: Relies on database foreign key constraints with `ON DELETE CASCADE` to automatically delete:
  - Contacts
  - Email campaigns
  - SMS campaigns
  - Automations
  - Campaign templates
  - User store associations
  - All other related data

## Database Schema Considerations

The deletion works through PostgreSQL's `ON DELETE CASCADE` constraints defined in the database schema:

```sql
-- Example from schema
CREATE TABLE contacts (
  ...
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  ...
);
```

All tables with `store_id` foreign keys have `ON DELETE CASCADE`, ensuring complete data cleanup when a store is deleted.

## User Flow

### When No Store is Connected:
1. User sees "No Store Connected" message
2. Clicks "Connect Store" button
3. Redirects to `/stores/connect` page
4. Completes Shopify OAuth flow
5. Returns to dashboard with connected store

### When Store is Connected:
1. User sees store information and details
2. Clicks "Disconnect Store" button in Store Actions section
3. Sees confirmation dialog with warning about permanent deletion
4. If confirmed, store and all data are permanently deleted
5. UI updates to show "No Store Connected" state
6. User can click "Connect Store" to connect a new store

## Security & Safety

- ✅ Requires user authentication
- ✅ Shows clear warning about permanent deletion
- ✅ Requires explicit confirmation
- ✅ Cannot be undone
- ✅ Cascade deletes all related data to prevent orphaned records

## Testing Recommendations

1. Test disconnect with a store that has:
   - Contacts
   - Email campaigns
   - SMS campaigns
   - Automations
   - Campaign templates

2. Verify all related data is deleted from database

3. Test reconnecting a store after disconnection

4. Verify the "Connect Store" button redirects correctly

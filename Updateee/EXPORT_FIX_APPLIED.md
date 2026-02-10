# Contact Export Fix - February 10, 2026

## Issue
Export functionality was failing silently at http://localhost:3000/contacts with no clear error message to the user.

## Root Cause
The `getStoreContacts` method in `ContactRepository` was failing the entire export if ANY single contact failed to decrypt. This all-or-nothing approach meant that one corrupted contact would prevent all contacts from being exported.

## Changes Applied

### 1. `src/lib/database/repositories.ts`
**Changed**: Modified `getStoreContacts` to handle decryption failures gracefully
- Now iterates through contacts individually instead of using `Promise.all`
- Skips contacts that fail to decrypt instead of failing the entire export
- Logs which specific contact IDs fail to decrypt
- Logs warning with count of skipped contacts
- Returns all successfully decrypted contacts

### 2. `src/app/api/contacts/export/route.ts`
**Changed**: Added better logging and error details
- Added console.log for successful exports showing contact count
- Added console.log when no contacts are found
- Included error details in JSON response for better debugging
- Better error messages returned to frontend

### 3. `src/app/contacts/page.tsx`
**Changed**: Improved error handling in `handleExport`
- Now parses error response JSON to get specific error message
- Logs export errors to browser console for debugging
- Shows specific error message from API to user

## Benefits
1. **Partial Exports**: Users can now export contacts even if some are corrupted
2. **Better Debugging**: Console logs show exactly which contacts fail and why
3. **User Feedback**: Clear error messages instead of silent failures
4. **Resilience**: One bad contact doesn't break the entire export feature

## Testing
To verify the fix:
1. Navigate to http://localhost:3000/contacts
2. Click the "Export" button
3. Check browser console for any error logs
4. Check server logs for decryption warnings
5. Verify CSV file downloads with available contacts

## Next Steps
If export still fails:
1. Check server console for "Failed to decrypt contact" messages with specific IDs
2. Verify contacts exist in database: `SELECT COUNT(*) FROM contacts WHERE store_id = 'your-store-id'`
3. Check if contact data is properly base64 encoded in database
4. Verify user has a valid store associated with their account

# Contact Import/Export Fixes

## Issues Fixed

### 1. Import Contacts
**Problem**: CSV file was being imported immediately upon selection without user confirmation.

**Solution**: 
- Added `selectedFile` state to store the selected file
- Added `importing` state to show loading status
- Modified the file input to only store the file, not trigger import
- Added "Apply Contacts" button that triggers the import when clicked
- Shows selected filename after file selection
- Button is disabled until a file is selected

### 2. Export Contacts
**Problem**: Export was returning dummy data instead of actual contacts from the database.

**Solution**:
- Integrated with ContactManager to fetch real contacts from database
- Properly escapes CSV values containing commas, quotes, or newlines
- Exports all contact fields including tags (semicolon-separated)
- Handles empty contact list gracefully
- CSV format is Excel-compatible with proper UTF-8 encoding

## Changes Made

### Files Modified:
1. `src/app/contacts/page.tsx`
   - Added `selectedFile` state variable
   - Added `importing` state variable
   - Modified `handleImportContacts` to work with stored file instead of parameter
   - Updated Import Modal UI with "Apply Contacts" button
   - Shows selected filename in modal
   - Proper loading states and button disabling

2. `src/app/api/contacts/export/route.ts`
   - Removed dummy data implementation
   - Added ContactManager integration
   - Fetches real contacts from database using store_id
   - Proper CSV escaping for Excel compatibility
   - Handles tags as semicolon-separated values
   - Better error handling

## How It Works Now

### Import Process:
1. User clicks "Import CSV" button
2. Modal opens with file selector
3. User selects a CSV file
4. Filename is displayed
5. User clicks "Apply Contacts" button
6. Contacts are imported and added to database
7. Success/error notification is shown
8. Contact list refreshes automatically

### Export Process:
1. User clicks "Export" button
2. System fetches all contacts from database for current store
3. Generates properly formatted CSV with all contact data
4. Downloads file as `contacts-YYYY-MM-DD.csv`
5. File can be opened directly in Excel
6. Success notification is shown

## CSV Format

### Import Format (email required):
```csv
email,first_name,last_name,phone,tags,email_consent,sms_consent,total_spent,order_count
john@example.com,John,Doe,+1234567890,vip;customer,yes,yes,150.00,3
jane@example.com,Jane,Smith,+1987654321,customer,yes,no,75.50,1
```

### Export Format:
```csv
First Name,Last Name,Email,Phone,Tags,Email Consent,SMS Consent,Total Spent,Order Count,Last Order Date
John,Doe,john@example.com,+1234567890,vip;customer,Yes,Yes,150.00,3,12/15/2024
Jane,Smith,jane@example.com,+1987654321,customer,Yes,No,75.50,1,12/10/2024
```

## Testing

To test the fixes:
1. Navigate to the Contacts page
2. Click "Import CSV" and select the `sample-contacts.csv` file
3. Click "Apply Contacts" to import
4. Verify contacts appear in the list
5. Click "Export" to download all contacts
6. Open the downloaded CSV in Excel to verify data

# Contact Creation Troubleshooting Guide

## Error: "Failed to Add Contact"

This error can occur for several reasons. Follow these steps to diagnose and fix the issue.

---

## Quick Diagnosis

Run the diagnostic script to identify the issue:

```bash
node scripts/diagnose-contact-issue.js
```

This will check:
- ✅ Database connection
- ✅ Stores exist
- ✅ Users exist
- ✅ Store-user relationships are valid
- ✅ Contact creation works

---

## Common Causes & Solutions

### 1. No Store Connected (Most Common)

**Symptom**: Error message says "No stores connected"

**Cause**: Your user account doesn't have any Shopify stores associated with it.

**Solution**:
```bash
# Run the fix script to create a test store
node scripts/fix-contact-creation.js
```

Or manually connect a Shopify store through the app.

---

### 2. Orphaned Store (User ID Mismatch)

**Symptom**: Contacts page is empty even though stores exist

**Cause**: The store's `user_id` points to a non-existent user in the auth.users table.

**Solution**:
```bash
# Run the fix script to update store user_id
node scripts/fix-contact-creation.js
```

---

### 3. Duplicate Email

**Symptom**: Error message says "A contact with this email already exists"

**Cause**: You're trying to add a contact with an email that already exists in your store.

**Solution**:
- Use a different email address
- Or update the existing contact instead of creating a new one

---

### 4. Database Tables Not Set Up

**Symptom**: Error message says "Database tables not set up yet"

**Cause**: The required database tables haven't been created.

**Solution**:
```bash
# Run the database migrations
node scripts/run-migration.js
```

---

### 5. Authentication Required

**Symptom**: Error message says "Authentication required"

**Cause**: You're not logged in or your session has expired.

**Solution**:
- Log out and log back in
- Clear browser cookies and try again

---

### 6. Validation Errors

**Symptom**: Form shows validation errors

**Cause**: Invalid data in the form fields.

**Solution**:
- **Email**: Must be a valid email format (e.g., user@example.com)
- **First Name**: Only letters, spaces, hyphens, and apostrophes
- **Last Name**: Only letters, spaces, hyphens, and apostrophes
- **Phone**: Only numbers, spaces, parentheses, hyphens, and plus sign

---

## Step-by-Step Troubleshooting

### Step 1: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try adding a contact
4. Look for error messages in red

Common errors you might see:
- `401 Unauthorized` → You're not logged in
- `400 Bad Request` → Validation error or no store connected
- `500 Internal Server Error` → Database or server issue

### Step 2: Check Network Tab

1. Open Developer Tools (F12)
2. Go to the Network tab
3. Try adding a contact
4. Click on the `/api/contacts` request
5. Look at the Response tab to see the exact error message

### Step 3: Check Server Logs

If you're running the development server, check the terminal for error messages:
- Look for lines starting with `❌`
- These will show the exact database error

### Step 4: Verify Database State

Run the diagnostic script:
```bash
node scripts/diagnose-contact-issue.js
```

This will show you:
- How many users exist
- How many stores exist
- If stores are properly linked to users
- If contact creation works

### Step 5: Apply Fixes

If the diagnostic script finds issues, run the fix script:
```bash
node scripts/fix-contact-creation.js
```

This will:
- Create a test user if none exist
- Create a test store if none exist
- Fix orphaned stores
- Test contact creation

---

## Manual Fixes

### Create a Test User

```sql
-- Run this in Supabase SQL Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@example.com',
  crypt('Admin123!@#', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);
```

### Create a Test Store

```sql
-- Replace USER_ID with your actual user ID
INSERT INTO stores (
  user_id,
  store_name,
  shop_domain,
  access_token,
  is_active
) VALUES (
  'USER_ID',
  'Test Store',
  'test-store.myshopify.com',
  'test_token',
  true
);
```

### Fix Orphaned Store

```sql
-- Replace STORE_ID and USER_ID with actual values
UPDATE stores
SET user_id = 'USER_ID'
WHERE id = 'STORE_ID';
```

---

## Testing Contact Creation

After applying fixes, test contact creation:

1. **Login** to the app
2. **Navigate** to the Contacts page
3. **Click** "Add Contact" button
4. **Fill in** the form:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@example.com
   - Phone: +1234567890
5. **Click** "Add Contact"
6. **Verify** the contact appears in the list

---

## API Improvements Made

### Better Error Messages

The API now returns specific error messages:
- "Email is required"
- "No stores connected. Please connect a Shopify store first."
- "A contact with this email already exists in your store."
- "Database tables not set up yet. Please run the database migrations first."

### Enhanced Logging

The API now logs:
- User ID when creating contacts
- Number of stores found
- Store being used
- Success/failure messages

### Frontend Error Display

The frontend now:
- Shows the actual error message from the API
- Logs errors to the browser console
- Displays user-friendly error notifications

---

## Database Schema

### Relationships

```
auth.users (id)
    ↓
stores (user_id, id)
    ↓
contacts (store_id)
```

### Constraints

- `stores.user_id` → `auth.users.id` (CASCADE DELETE)
- `contacts.store_id` → `stores.id` (CASCADE DELETE)
- `contacts` has UNIQUE constraint on (store_id, email)

---

## Prevention

To avoid these issues in the future:

1. **Always connect a store** before adding contacts
2. **Don't manually delete users** without deleting their stores first
3. **Use the app's delete functions** instead of direct database manipulation
4. **Run migrations** after pulling new code
5. **Check browser console** for errors during development

---

## Still Having Issues?

If you're still experiencing problems:

1. **Check the logs** in your terminal
2. **Run the diagnostic script** again
3. **Check the database** directly in Supabase
4. **Verify environment variables** in `.env.local`
5. **Restart the development server**

### Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Related Documentation

- `USER_ISOLATION_FIX.md` - User isolation and store relationships
- `CONTACT_IMPORT_FIX.md` - Contact import/export fixes
- `CONTACT_PAGE_ACTIONS_FIX.md` - Contact page functionality
- `supabase_complete_schema.sql` - Database schema

---

**Last Updated**: February 10, 2026

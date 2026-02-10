# 🧪 Test: First Name and Last Name Permanent Storage

## Quick Test Guide

Follow these steps to verify that first name and last name are permanently stored in the database:

---

## Test 1: Register a New User

### Step 1: Open Registration Page
```
URL: http://localhost:3000/auth/register
or
URL: http://localhost:3000/auth/signup
```

### Step 2: Fill in the Form
```
First Name: John
Last Name: Doe
Email: test@example.com
Password: password123
Confirm Password: password123
```

### Step 3: Submit
Click "Create Account" button

### Expected Result
✅ User is created successfully
✅ Redirected to payment or dashboard page

---

## Test 2: Verify Database Storage

### Option A: Run Verification Script
```bash
node scripts/verify-name-fields.js
```

### Expected Output
```
🔍 Verifying first_name and last_name fields in database...

1️⃣ Checking if columns exist in users table...
✅ Columns check passed

2️⃣ Checking existing user data...
✅ Found 1 user(s) in database

Sample user data:

   User 1:
   - Email: test@example.com
   - First Name: John
   - Last Name: Doe
   - Full Name: John Doe

3️⃣ Checking database configuration...
✅ Database is accessible and configured

📊 VERIFICATION SUMMARY
==================================================
✅ Database connection: Working
✅ Users table: Accessible
✅ first_name column: Available
✅ last_name column: Available

🎉 Database is properly configured!
```

### Option B: Query Database Directly
If you have access to Supabase SQL Editor:

```sql
SELECT 
  id,
  email,
  first_name,
  last_name,
  created_at
FROM users
WHERE email = 'test@example.com';
```

### Expected Result
```
id                                   | email              | first_name | last_name | created_at
-------------------------------------|--------------------|-----------|-----------|--------------------------
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | test@example.com   | John      | Doe       | 2024-01-15 10:30:00+00
```

✅ **CONFIRMED:** Data is stored in database

---

## Test 3: View in Profile

### Step 1: Login
```
URL: http://localhost:3000/auth/login
Email: test@example.com
Password: password123
```

### Step 2: Navigate to Settings
```
Click on "Settings" in the navigation menu
or
URL: http://localhost:3000/settings
```

### Step 3: View Profile Tab
```
Click on "Profile" tab (should be selected by default)
```

### Expected Result
You should see:

```
┌─────────────────────────────────────────────────┐
│ Profile Information                             │
│                                                 │
│ This information was provided during            │
│ registration and cannot be modified.            │
│                                                 │
│ ┌──────────────────┐  ┌──────────────────┐    │
│ │ First Name       │  │ Last Name        │    │
│ │ John             │  │ Doe              │    │
│ │ (read-only)      │  │ (read-only)      │    │
│ └──────────────────┘  └──────────────────┘    │
│                                                 │
│ ┌──────────────────────────────────────┐       │
│ │ Email Address                        │       │
│ │ test@example.com                     │       │
│ │ (read-only)                          │       │
│ └──────────────────────────────────────┘       │
└─────────────────────────────────────────────────┘
```

✅ **CONFIRMED:** Data is displayed from database

---

## Test 4: Verify Data Persistence

### Step 1: Logout
```
Click "Logout" button
```

### Step 2: Close Browser
```
Close all browser windows/tabs
```

### Step 3: Restart Development Server (Optional)
```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### Step 4: Login Again
```
URL: http://localhost:3000/auth/login
Email: test@example.com
Password: password123
```

### Step 5: Check Profile Again
```
Go to Settings → Profile
```

### Expected Result
✅ First Name still shows: "John"
✅ Last Name still shows: "Doe"
✅ Data persisted across sessions
✅ Data survived server restart

---

## Test 5: Verify Read-Only Protection

### Step 1: Go to Profile
```
Settings → Profile
```

### Step 2: Try to Edit
```
Try to click in the First Name field
Try to type in the Last Name field
```

### Expected Result
✅ Fields are disabled (grayed out)
✅ Cannot type or edit
✅ Cursor shows "not-allowed" icon
✅ Data is protected from modification

---

## Test 6: Register Another User

### Step 1: Logout
```
Logout from current account
```

### Step 2: Register New User
```
URL: http://localhost:3000/auth/register

First Name: Jane
Last Name: Smith
Email: jane@example.com
Password: password456
```

### Step 3: Check Database
```bash
node scripts/verify-name-fields.js
```

### Expected Result
```
✅ Found 2 user(s) in database

   User 1:
   - Email: test@example.com
   - First Name: John
   - Last Name: Doe

   User 2:
   - Email: jane@example.com
   - First Name: Jane
   - Last Name: Smith
```

✅ **CONFIRMED:** Multiple users can be stored
✅ **CONFIRMED:** Each user has their own data

---

## Test 7: Verify API Response

### Step 1: Login
```
Login as test@example.com
```

### Step 2: Open Browser DevTools
```
Press F12 or Right-click → Inspect
Go to "Network" tab
```

### Step 3: Navigate to Settings
```
Go to Settings → Profile
```

### Step 4: Check API Call
```
Look for request to: /api/settings
Click on it
Go to "Response" tab
```

### Expected Response
```json
{
  "settings": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "test@example.com",
    "phone": "",
    "emailFromName": "",
    "emailFromAddress": "",
    ...
  }
}
```

✅ **CONFIRMED:** API returns data from database
✅ **CONFIRMED:** firstName and lastName are present

---

## ✅ Test Results Summary

If all tests pass, you have confirmed:

- ✅ Registration form collects first name and last name
- ✅ Data is sent to API correctly
- ✅ Data is stored in PostgreSQL database
- ✅ Data persists permanently
- ✅ Data survives logout/login
- ✅ Data survives server restart
- ✅ Data is retrieved from database
- ✅ Data is displayed in profile
- ✅ Data is read-only (protected)
- ✅ Multiple users can have different data

---

## 🎯 Conclusion

**The first name and last name are PERMANENTLY stored in the database and retrieved from there for display in the profile.**

This is NOT temporary storage. This is NOT session storage. This is NOT local storage.

**This is PERMANENT DATABASE STORAGE in PostgreSQL.**

Every time you view the profile, the data is fetched fresh from the database. The database is the single source of truth.

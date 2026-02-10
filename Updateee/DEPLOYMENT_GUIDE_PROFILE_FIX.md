# Deployment Guide - Profile Read-Only Fix

## Quick Start

This guide will help you deploy the profile read-only fix to your environment.

---

## Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Database access (Supabase admin)
- [ ] Node.js environment set up
- [ ] Git repository access
- [ ] Backup of current database (recommended)

### ✅ Files to Deploy
- [ ] `supabase/migrations/010_add_user_name_fields.sql`
- [ ] `src/lib/auth/server.ts`
- [ ] `src/app/api/settings/route.ts`
- [ ] `src/app/settings/page.tsx`

---

## Step-by-Step Deployment

### Step 1: Backup Database (Recommended)

```bash
# If using Supabase CLI
supabase db dump > backup_before_profile_fix.sql

# Or use your database backup tool
```

### Step 2: Review Changes

```bash
# Check what files were modified
git status

# Review the changes
git diff src/lib/auth/server.ts
git diff src/app/api/settings/route.ts
git diff src/app/settings/page.tsx
```

### Step 3: Run Database Migration

```bash
# Navigate to project root
cd /path/to/your/project

# Run the migration script
node scripts/run-migration.js
```

**Expected Output:**
```
✅ Migration completed successfully
✅ Added first_name column
✅ Added last_name column
✅ Created indexes
✅ Migrated existing data
```

**If Migration Fails:**
```bash
# Check the error message
# Common issues:
# - Database connection failed
# - Columns already exist
# - Permission denied

# To manually run migration:
psql -h your-db-host -U your-user -d your-database -f supabase/migrations/010_add_user_name_fields.sql
```

### Step 4: Verify Database Changes

```sql
-- Connect to your database and run:

-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('first_name', 'last_name');

-- Check if data was migrated
SELECT id, email, name, first_name, last_name 
FROM users 
LIMIT 5;

-- Verify indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'users' 
AND indexname IN ('idx_users_first_name', 'idx_users_last_name');
```

**Expected Results:**
- ✅ `first_name` column exists (VARCHAR 255)
- ✅ `last_name` column exists (VARCHAR 255)
- ✅ Existing names are split into first/last
- ✅ Indexes are created

### Step 5: Build and Test Locally

```bash
# Install dependencies (if needed)
npm install

# Build the project
npm run build

# Run locally
npm run dev
```

### Step 6: Test the Changes

#### Test 1: New User Registration
1. Go to registration page
2. Enter: First Name, Last Name, Email, Password
3. Complete registration
4. Verify user is created in database:
   ```sql
   SELECT first_name, last_name, email FROM users WHERE email = 'test@example.com';
   ```

#### Test 2: Profile Display
1. Log in as a user
2. Navigate to Settings → Profile
3. Verify:
   - ✅ First Name is displayed and disabled
   - ✅ Last Name is displayed and disabled
   - ✅ Email is displayed and disabled
   - ✅ Fields are grayed out
   - ✅ Explanatory text is shown
   - ✅ No Company Information section
   - ✅ No Save button

#### Test 3: API Protection
1. Open browser DevTools → Network tab
2. Try to save settings with profile fields:
   ```javascript
   fetch('/api/settings', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       settings: {
         firstName: 'Hacker',
         lastName: 'Attempt',
         email: 'hacker@evil.com',
         phone: '555-1234'
       }
     })
   })
   ```
3. Verify:
   - ✅ Request succeeds (200 OK)
   - ✅ firstName, lastName, email are NOT updated
   - ✅ Only phone is updated (if editable)

#### Test 4: Existing Users
1. Log in as an existing user
2. Check their profile displays correctly
3. Verify their name was split properly

### Step 7: Deploy to Production

#### Option A: Manual Deployment
```bash
# Build production bundle
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, AWS, etc.)
```

#### Option B: Git-based Deployment
```bash
# Commit changes
git add .
git commit -m "feat: implement read-only profile with company info removal"

# Push to production branch
git push origin main

# Your CI/CD will handle deployment
```

#### Option C: Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod

# Or use Vercel CLI
vercel deploy --prod
```

### Step 8: Run Migration in Production

```bash
# Connect to production database
# Run migration script with production credentials

# Option 1: Using Supabase CLI
supabase db push

# Option 2: Using migration script
NODE_ENV=production node scripts/run-migration.js

# Option 3: Manual SQL execution
psql -h production-db-host -U user -d database -f supabase/migrations/010_add_user_name_fields.sql
```

### Step 9: Verify Production Deployment

1. **Check Database:**
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('first_name', 'last_name');
   ```

2. **Test Registration:**
   - Create a new test account
   - Verify data is stored correctly

3. **Test Profile Display:**
   - Log in and check Settings → Profile
   - Verify read-only behavior

4. **Monitor Logs:**
   ```bash
   # Check application logs for errors
   # Check database logs for issues
   ```

### Step 10: Post-Deployment Verification

#### Smoke Tests
- [ ] New user registration works
- [ ] Login works
- [ ] Profile page loads
- [ ] Profile fields are read-only
- [ ] No company information visible
- [ ] API rejects profile updates
- [ ] No console errors
- [ ] No TypeScript errors

#### User Acceptance Testing
- [ ] Test with real user accounts
- [ ] Verify existing users see correct data
- [ ] Confirm read-only behavior
- [ ] Check mobile responsiveness
- [ ] Test different browsers

---

## Rollback Plan

If issues occur, follow these steps:

### Step 1: Revert Code Changes
```bash
# Revert to previous commit
git revert HEAD

# Or reset to previous version
git reset --hard <previous-commit-hash>

# Redeploy
git push origin main --force
```

### Step 2: Revert Database (Optional)
```sql
-- Only if absolutely necessary
-- This will lose the first_name/last_name columns

ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;
DROP INDEX IF EXISTS idx_users_first_name;
DROP INDEX IF EXISTS idx_users_last_name;
```

**⚠️ Warning:** Reverting database changes will lose the split name data. Only do this if critical issues occur.

---

## Monitoring

### What to Monitor

1. **Error Rates:**
   - Watch for increased 500 errors
   - Check for API failures
   - Monitor database errors

2. **User Behavior:**
   - Registration completion rate
   - Settings page load time
   - User complaints/support tickets

3. **Database Performance:**
   - Query performance on users table
   - Index usage statistics
   - Connection pool status

### Monitoring Commands

```sql
-- Check query performance
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%users%' 
ORDER BY total_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan 
FROM pg_stat_user_indexes 
WHERE tablename = 'users';

-- Check table size
SELECT pg_size_pretty(pg_total_relation_size('users'));
```

---

## Troubleshooting

### Issue: Migration Fails

**Symptoms:**
- Error: "column already exists"
- Error: "permission denied"

**Solution:**
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users';

-- If columns exist, skip migration
-- If permission denied, check database user permissions
```

### Issue: Profile Page Shows Errors

**Symptoms:**
- Console errors
- Blank profile section
- "Cannot read property" errors

**Solution:**
1. Check browser console for specific error
2. Verify API is returning correct data
3. Check network tab for failed requests
4. Verify user has data in database

### Issue: API Returns 500 Error

**Symptoms:**
- Settings page fails to load
- "Failed to get settings" error

**Solution:**
1. Check server logs
2. Verify database connection
3. Check if users table has required columns
4. Verify user has associated store

### Issue: Existing Users See Blank Names

**Symptoms:**
- firstName/lastName are empty
- Only email is shown

**Solution:**
```sql
-- Check if migration ran
SELECT first_name, last_name FROM users WHERE email = 'user@example.com';

-- If empty, manually migrate
UPDATE users 
SET 
  first_name = split_part(name, ' ', 1),
  last_name = substring(name FROM position(' ' IN name) + 1)
WHERE first_name IS NULL AND name IS NOT NULL;
```

---

## Success Criteria

Deployment is successful when:

- ✅ Database migration completed without errors
- ✅ All tests pass
- ✅ Profile page displays read-only fields
- ✅ Company information is removed
- ✅ API protection works
- ✅ No increase in error rates
- ✅ Users can register and log in
- ✅ Existing users see their data correctly

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the documentation files:
   - `PROFILE_READONLY_FIX.md` - Technical details
   - `PROFILE_CHANGES_SUMMARY.md` - Quick reference
   - `PROFILE_ARCHITECTURE.md` - System architecture
3. Check application logs
4. Review database logs
5. Contact development team

---

## Timeline

**Estimated Deployment Time:**
- Database migration: 5-10 minutes
- Code deployment: 10-15 minutes
- Testing: 15-20 minutes
- **Total: 30-45 minutes**

**Recommended Deployment Window:**
- Low-traffic period
- With team available for support
- With rollback plan ready

---

## Conclusion

This deployment guide provides step-by-step instructions for deploying the profile read-only fix. Follow each step carefully and verify at each stage.

**Remember:**
- ✅ Backup before deployment
- ✅ Test thoroughly
- ✅ Monitor after deployment
- ✅ Have rollback plan ready

**Status:** Ready for deployment 🚀

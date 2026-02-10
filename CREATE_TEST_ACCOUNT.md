# Create Test Account - Quick Guide

## One Command Setup

```bash
npm run create-test-user
```

That's it! 🎉

## What This Does

Creates a fully functional test account with:
- ✅ Email: `test@example.com`
- ✅ Password: `Test123456`
- ✅ Email verified
- ✅ Active Professional subscription
- ✅ SMS settings configured
- ✅ Phone number assigned (+15551234567)
- ✅ Ready to login immediately

## Login Now

1. Go to: http://localhost:3000/auth/login
2. Enter:
   - Email: `test@example.com`
   - Password: `Test123456`
3. Click "Sign in"
4. You're in! 🚀

## What You Can Do

With this account, you have full access to:

- **Dashboard** - Analytics and overview
- **Contacts** - Customer management
- **Campaigns** - Email & SMS campaigns
- **Automations** - Workflow automation
- **Analytics** - Performance metrics
- **Settings** - All configuration options

## Troubleshooting

### Command not found?
```bash
# Use the full command:
node scripts/create-test-user.js
```

### Database error?
```bash
# Make sure tables exist. Run in Supabase SQL Editor:
# 1. scripts/create-settings-tables.sql
# 2. Then run: npm run create-test-user
```

### Still can't login?
Check the script output for errors. It should show:
```
✨ TEST ACCOUNT READY!
```

## Reset Account

To reset or recreate the account:
```bash
npm run create-test-user
```

It will delete the old one and create a fresh account.

## Files Created

- `scripts/create-test-user.js` - Node.js script
- `scripts/create-test-account.sql` - SQL script (alternative)
- `TEST_ACCOUNT_SETUP.md` - Detailed guide
- `CREATE_TEST_ACCOUNT.md` - This file

## Quick Test

After creating the account:

```bash
# 1. Create account
npm run create-test-user

# 2. Start server (if not running)
npm run dev

# 3. Open browser
# http://localhost:3000/auth/login

# 4. Login with:
# test@example.com / Test123456

# 5. You should see the dashboard!
```

## Success Indicators

✅ Script shows "TEST ACCOUNT READY!"
✅ Login page accepts credentials
✅ Redirects to /dashboard
✅ Can navigate to all pages
✅ Settings page shows Professional plan
✅ SMS settings show phone number

## Need Help?

1. Check script output for errors
2. Verify `.env.local` has Supabase credentials
3. Make sure database tables exist
4. Check browser console for errors
5. See `TEST_ACCOUNT_SETUP.md` for detailed troubleshooting

---

**That's it!** You now have a working test account. Happy testing! 🎉

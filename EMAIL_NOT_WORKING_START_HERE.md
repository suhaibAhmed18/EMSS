# 🚨 Email Not Working? START HERE

## Quick Fix - Run This Command Now:

```bash
npm run test-email your-email@gmail.com
```

**Replace `your-email@gmail.com` with your actual email!**

---

## What This Does:

✅ Tests your Resend API key
✅ Sends a test email to your inbox  
✅ Shows exactly what's wrong
✅ Gives you specific fix instructions

---

## Expected Result:

### ✅ If Successful:
```
✅ SUCCESS! Email Configuration is Working

Check your inbox: your-email@gmail.com
```

**Then:**
1. Check your inbox
2. Check spam folder
3. Look for email from "MarketingPro"

### ❌ If Failed:
You'll see a specific error message like:
- "RESEND_API_KEY is not configured"
- "Invalid API key"
- "Domain not verified"

**Then:**
Follow the fix instructions shown in the error message.

---

## Common Fixes:

### Fix 1: API Key Not Set
```bash
# Go to: https://resend.com/api-keys
# Create new API key
# Update .env.local:
RESEND_API_KEY=re_YOUR_NEW_KEY_HERE
# Restart app: Ctrl+C then npm run dev
```

### Fix 2: Email in Spam
- Check spam/junk folder
- Mark as "Not Spam"
- Add sender to contacts

### Fix 3: App Not Restarted
```bash
# After changing .env.local, restart:
Ctrl+C
npm run dev
```

---

## 📚 Detailed Guides:

- **FIX_EMAIL_NOW.md** - Complete troubleshooting guide
- **TROUBLESHOOT_EMAIL_NOT_RECEIVED.md** - Detailed diagnostics
- **test-email-sending.js** - Test script (runs with npm run test-email)

---

## 🆘 Still Not Working?

Tell me:
1. What happened when you ran `npm run test-email`?
2. Did you check spam folder?
3. What error message did you see?

---

## 🚀 Run This Now:

```bash
npm run test-email your-email@gmail.com
```

This will tell us exactly what's wrong! 🔍


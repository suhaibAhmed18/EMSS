# Fix Email Not Received - Quick Guide

## 🚨 You're Not Receiving Emails - Let's Fix It Now!

---

## ⚡ Quick Test (2 Minutes)

### Step 1: Test Your Email Configuration

Run this command with **your real email address**:

```bash
npm run test-email your-email@gmail.com
```

**Example:**
```bash
npm run test-email john@gmail.com
```

### What This Does:
- ✅ Checks your Resend API key
- ✅ Sends a test email to your inbox
- ✅ Shows detailed error messages if something is wrong
- ✅ Confirms if email system is working

### Expected Result:
```
✅ SUCCESS! Email Configuration is Working

Next steps:
1. Check your inbox: your-email@gmail.com
2. If not there, check spam/junk folder
3. Look for email from: onboarding@resend.dev
4. Subject: "🧪 Test Email - MarketingPro Email Verification"
```

---

## 🔍 What to Check

### 1. Check Your Inbox (30 seconds)
- Open your email
- Look for email from "MarketingPro" or "onboarding@resend.dev"
- Subject: "🧪 Test Email - MarketingPro Email Verification"

### 2. Check Spam Folder (30 seconds)
- Open spam/junk folder
- Search for "MarketingPro"
- If found, mark as "Not Spam"

### 3. Wait a Bit (1-2 minutes)
- Email delivery can take 1-2 minutes
- Refresh your inbox
- Check again

---

## ❌ If Test Email Failed

### Error: "RESEND_API_KEY is not configured"

**Fix:**
1. Go to: https://resend.com/api-keys
2. Login to your Resend account
3. Click "Create API Key"
4. Copy the key (starts with `re_`)
5. Open `.env.local` in your project
6. Update this line:
   ```
   RESEND_API_KEY=re_YOUR_NEW_KEY_HERE
   ```
7. Save the file
8. Restart your app: Press `Ctrl+C` then run `npm run dev`
9. Run test again: `npm run test-email your-email@gmail.com`

### Error: "Invalid API key"

**Fix:**
Your API key is invalid or expired.

1. Go to: https://resend.com/api-keys
2. Delete the old key
3. Create a new API key
4. Copy the new key
5. Update `.env.local`:
   ```
   RESEND_API_KEY=re_YOUR_NEW_KEY_HERE
   ```
6. Save and restart app
7. Test again

### Error: "Domain not verified"

**Fix:**
You're using a custom domain that's not verified.

**Quick fix:** Use Resend's test domain:
```
EMAIL_FROM_ADDRESS=onboarding@resend.dev
```

**Long-term fix:**
1. Go to: https://resend.com/domains
2. Add your domain
3. Verify DNS records
4. Update `.env.local` with your domain

---

## ✅ If Test Email Succeeded But Registration Emails Don't Work

### Check 1: Is Email Service Being Called?

Start your app and watch the logs:

```bash
npm run dev
```

Then register a user and look for these messages:
- ✅ "Verification email sent to: [email]"
- ✅ "Email sent successfully"
- ❌ "Failed to send email"

### Check 2: Check Registration Route

The registration should call the email service. Let me check if it's configured correctly.

### Check 3: Restart Your App

After changing `.env.local`, you MUST restart:

```bash
# Press Ctrl+C to stop
# Then start again:
npm run dev
```

---

## 🎯 Most Common Issues (90% of Problems)

### Issue 1: Resend API Key Not Set
**Symptom:** Test fails with "not configured"
**Fix:** Add API key to `.env.local` and restart

### Issue 2: Email in Spam Folder
**Symptom:** Test succeeds but you don't see email
**Fix:** Check spam folder, mark as "Not Spam"

### Issue 3: App Not Restarted
**Symptom:** Changed `.env.local` but still not working
**Fix:** Press `Ctrl+C` and run `npm run dev` again

### Issue 4: Wrong Email Address
**Symptom:** Email sent but not received
**Fix:** Double-check email spelling, try different provider

### Issue 5: Resend Account Issue
**Symptom:** API key valid but emails not sending
**Fix:** Check Resend dashboard for account status

---

## 📊 Check Resend Dashboard

### View Sent Emails:

1. Go to: https://resend.com/emails
2. Login to your account
3. See all sent emails
4. Check delivery status
5. View error messages

### What to Look For:
- ✅ "Delivered" - Email was sent successfully
- ⏳ "Queued" - Email is being sent
- ❌ "Failed" - Check error message
- ❌ "Bounced" - Invalid email address

---

## 🔧 Step-by-Step Fix

### Step 1: Verify Resend API Key (2 minutes)

```bash
# Check current key
cat .env.local | grep RESEND_API_KEY
```

Should show:
```
RESEND_API_KEY=re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB
```

**Verify this key:**
1. Go to: https://resend.com/api-keys
2. Check if this key exists
3. If not, create new key
4. Update `.env.local`

### Step 2: Test Email Sending (1 minute)

```bash
npm run test-email your-email@gmail.com
```

**If it works:** ✅ Email system is fine, issue is in registration flow
**If it fails:** ❌ Fix the error shown, then test again

### Step 3: Check Spam Folder (30 seconds)

- Open spam/junk folder
- Search for "MarketingPro"
- Mark as "Not Spam" if found

### Step 4: Try Different Email (1 minute)

Test with different email providers:
- Gmail: your-email@gmail.com
- Outlook: your-email@outlook.com
- Yahoo: your-email@yahoo.com

Some providers have stricter spam filters.

### Step 5: Check Registration Flow (2 minutes)

1. Start app: `npm run dev`
2. Register a user
3. Watch console logs
4. Look for email-related messages

---

## 🆘 Still Not Working?

### Get Detailed Diagnostics:

Run the test script and copy the output:

```bash
npm run test-email your-email@gmail.com > email-test-results.txt
```

Then check `email-test-results.txt` for detailed information.

### Check These:

1. **Resend Dashboard:**
   - https://resend.com/emails
   - See if emails are being sent
   - Check delivery status

2. **Application Logs:**
   - Run `npm run dev`
   - Register a user
   - Copy all console output

3. **Email Provider:**
   - Try different email (Gmail, Outlook)
   - Check spam settings
   - Check email quotas

---

## 📞 What to Tell Me

If still not working, tell me:

1. **Test result:** What happened when you ran `npm run test-email`?
2. **Spam folder:** Did you check spam/junk folder?
3. **Console logs:** What do you see when registering a user?
4. **Resend dashboard:** Do you see emails in https://resend.com/emails?
5. **Email provider:** Which email are you using? (Gmail, Outlook, etc.)

---

## ✅ Success Checklist

- [ ] Ran `npm run test-email your-email@gmail.com`
- [ ] Test showed "SUCCESS"
- [ ] Checked inbox for test email
- [ ] Checked spam folder
- [ ] Marked as "Not Spam" if in spam
- [ ] Waited 1-2 minutes for delivery
- [ ] Tried different email provider
- [ ] Restarted app after changing `.env.local`
- [ ] Checked Resend dashboard

---

## 🚀 Quick Commands

```bash
# Test email sending
npm run test-email your-email@gmail.com

# Check Resend API key
cat .env.local | grep RESEND_API_KEY

# Restart app
# Press Ctrl+C, then:
npm run dev

# Check if Resend is installed
npm list resend
```

---

## 🎯 Next Step

**Run this command NOW:**

```bash
npm run test-email your-email@gmail.com
```

Replace `your-email@gmail.com` with your actual email address.

This will tell us exactly what's wrong! 🔍


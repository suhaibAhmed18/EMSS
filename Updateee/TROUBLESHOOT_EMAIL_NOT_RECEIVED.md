# Troubleshooting: Email Not Received

## 🔍 Current Situation

You're not receiving verification emails. Let's diagnose and fix this step by step.

---

## ✅ Step 1: Check Which System You're Using

You have **TWO** email verification systems:

### Option A: Custom System (Currently Active)
- Uses Resend API for sending emails
- Custom verification tokens
- Custom email templates
- API Key: `re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB`

### Option B: Supabase Auth (Recommended)
- Uses Supabase's built-in email system
- Automatic email sending
- Professional templates
- Needs configuration in Supabase Dashboard

**Which one are you trying to use?**

---

## 🔧 Fix for Custom System (Resend)

### Check 1: Verify Resend API Key

Your `.env.local` shows:
```
RESEND_API_KEY=re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB
```

**Test if it's valid:**

1. Go to: https://resend.com/api-keys
2. Login to your Resend account
3. Check if this API key exists and is active
4. If not, create a new one and update `.env.local`

### Check 2: Verify Email Domain

Your current sender:
```
EMAIL_FROM_ADDRESS=onboarding@resend.dev
```

**This is Resend's test domain** - it should work for testing!

**To verify:**
1. Go to: https://resend.com/domains
2. Check if `resend.dev` is listed
3. For production, add your own domain

### Check 3: Test Resend API

Create a test file: `test-resend.js`

```javascript
const { Resend } = require('resend');

const resend = new Resend('re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB');

async function testEmail() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'MarketingPro <onboarding@resend.dev>',
      to: ['YOUR_EMAIL@gmail.com'], // Replace with your email
      subject: 'Test Email from Resend',
      html: '<h1>Test Email</h1><p>If you receive this, Resend is working!</p>',
    });

    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Email sent successfully:', data);
    }
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}

testEmail();
```

**Run it:**
```bash
npm install resend
node test-resend.js
```

### Check 4: Check Application Logs

When you register a user, check the console logs:

**Look for:**
- ✅ "Email sent successfully"
- ✅ "Verification email sent to: [email]"
- ❌ "Failed to send email"
- ❌ "Resend error"

### Check 5: Verify Email Service is Called

Check if registration is calling the email service:

```bash
# Check the registration route
cat src/app/api/auth/register/route.ts | grep -i "email"
```

---

## 🔧 Fix for Supabase Auth

### Check 1: Is Email Confirmation Enabled?

1. Go to: https://app.supabase.com
2. Select your project: `liorqdqfcmeinxbtlxtt`
3. Go to: **Authentication** → **Settings**
4. Find: **"Enable Email Confirmations"**
5. Make sure it's **ON** (toggle should be blue/green)
6. Click **Save**

### Check 2: Is Email Template Configured?

1. Go to: **Authentication** → **Email Templates**
2. Click: **"Confirm signup"**
3. Check if you see custom HTML or default template
4. If empty or default, paste the template from `COPY_PASTE_EMAIL_TEMPLATE.md`
5. Click **Save**

### Check 3: Check Supabase Auth Logs

1. Go to: **Authentication** → **Logs**
2. Filter by: "Email" or "Signup"
3. Look for recent email send attempts
4. Check for errors

### Check 4: Test User Creation in Dashboard

1. Go to: **Authentication** → **Users**
2. Click: **"Add user"** → **"Create new user"**
3. Enter your email
4. **UNCHECK** "Auto Confirm User" ⚠️
5. Click **"Create user"**
6. Check your inbox (and spam folder)

---

## 🔍 Diagnostic Steps

### Step 1: Check Which System is Active

Run this command to see which email service is being used:

```bash
# Check if Resend is configured
grep -r "resend" src/lib/email/
```

### Step 2: Check Registration Flow

```bash
# Check registration route
cat src/app/api/auth/register/route.ts
```

Look for:
- `emailService.sendVerificationEmail()` - Custom system
- `supabase.auth.signUp()` - Supabase Auth

### Step 3: Test Email Sending

Create `test-email-system.js`:

```javascript
const { emailService } = require('./src/lib/email/service');

async function test() {
  try {
    console.log('Testing email service...');
    const result = await emailService.sendVerificationEmail(
      'YOUR_EMAIL@gmail.com',
      'test-token-12345'
    );
    console.log('✅ Result:', result);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

test();
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Resend API Key Invalid

**Symptoms:**
- Console shows "Failed to send email"
- Error: "Invalid API key"

**Fix:**
1. Go to: https://resend.com/api-keys
2. Create new API key
3. Update `.env.local`:
   ```
   RESEND_API_KEY=re_YOUR_NEW_KEY_HERE
   ```
4. Restart your app: `npm run dev`

### Issue 2: Email Going to Spam

**Symptoms:**
- No email in inbox
- Email found in spam folder

**Fix:**
1. Check spam folder
2. Mark as "Not Spam"
3. Add sender to contacts
4. For production: Use custom domain with SPF/DKIM

### Issue 3: Wrong Email Address

**Symptoms:**
- Email sent but not received
- No errors in logs

**Fix:**
1. Double-check email address spelling
2. Try different email provider (Gmail, Outlook)
3. Check email quotas

### Issue 4: Supabase Auth Not Configured

**Symptoms:**
- Using Supabase Auth but no emails sent
- No errors in logs

**Fix:**
1. Enable Email Confirmations in Supabase Dashboard
2. Configure email template
3. Add redirect URLs
4. Test with Dashboard user creation

### Issue 5: Development Mode

**Symptoms:**
- Console shows "Development mode: Email would be sent"
- No actual email sent

**Fix:**
This is expected in development! Check console for email content.

To send real emails in development:
1. Make sure `RESEND_API_KEY` is valid
2. Make sure it's not the placeholder value
3. Restart your app

---

## 🧪 Quick Tests

### Test 1: Resend API (30 seconds)

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "MarketingPro <onboarding@resend.dev>",
    "to": ["YOUR_EMAIL@gmail.com"],
    "subject": "Test Email",
    "html": "<p>Test</p>"
  }'
```

**Expected:** Email received in inbox

### Test 2: Supabase Auth (1 minute)

1. Go to Supabase Dashboard
2. Authentication → Users
3. Add user with your email
4. Uncheck "Auto Confirm"
5. Check inbox

**Expected:** Verification email received

### Test 3: Check Logs (10 seconds)

```bash
# Start your app and watch logs
npm run dev

# In another terminal, register a user
# Watch for email-related logs
```

**Expected:** See "Email sent" or "Verification email sent"

---

## 📋 Checklist

### For Custom System (Resend):
- [ ] Resend API key is valid
- [ ] API key is in `.env.local`
- [ ] App restarted after adding key
- [ ] Email service is being called
- [ ] Check console logs for errors
- [ ] Test with curl command
- [ ] Check spam folder

### For Supabase Auth:
- [ ] Email confirmations enabled
- [ ] Email template configured
- [ ] Template saved (clicked Save button)
- [ ] Redirect URLs added
- [ ] Test user created in Dashboard
- [ ] Check Supabase Auth logs
- [ ] Check spam folder

---

## 🔧 Immediate Actions

### Action 1: Verify Resend API Key (2 minutes)

1. Go to: https://resend.com/api-keys
2. Check if key `re_gE8GZWD3_5AfdUz4DG3U1H5sLanpxnPMB` exists
3. If not, create new key
4. Update `.env.local`
5. Restart app: `Ctrl+C` then `npm run dev`

### Action 2: Test Resend Directly (1 minute)

Use the curl command above with your email address.

If you receive the email → Resend works, issue is in your app
If you don't receive → Resend API key issue

### Action 3: Check Spam Folder (10 seconds)

Check your spam/junk folder for emails from:
- `onboarding@resend.dev`
- `MarketingPro`
- Your Supabase project name

### Action 4: Try Different Email (30 seconds)

Register with a different email provider:
- Gmail
- Outlook
- Yahoo
- ProtonMail

Some email providers have stricter spam filters.

---

## 🆘 Still Not Working?

### Get More Information:

1. **Check Resend Dashboard:**
   - Go to: https://resend.com/emails
   - See all sent emails
   - Check delivery status
   - View error messages

2. **Check Supabase Logs:**
   - Go to: Supabase Dashboard → Authentication → Logs
   - Filter by email events
   - Check for errors

3. **Check Application Logs:**
   - Run: `npm run dev`
   - Register a user
   - Copy all console output
   - Look for email-related messages

4. **Test Email Service Directly:**
   - Create the test file above
   - Run it
   - Check if email is received

---

## 📞 Next Steps

**Tell me:**
1. Which system are you using? (Custom/Resend or Supabase Auth)
2. Did you check spam folder?
3. What do you see in console logs when registering?
4. Did the curl test work?
5. Is your Resend API key valid?

**I can help you:**
- Debug the specific issue
- Test your email configuration
- Switch to Supabase Auth if needed
- Set up proper email delivery

---

## 🎯 Quick Fix (Most Common)

**90% of the time, it's one of these:**

1. **Resend API key not valid** → Get new key from Resend
2. **Email in spam folder** → Check spam
3. **Email confirmations not enabled** → Enable in Supabase
4. **App not restarted** → Restart after changing `.env.local`
5. **Wrong email address** → Double-check spelling

**Try these first!** ✅


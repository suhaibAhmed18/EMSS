# Quick Supabase Auth Configuration Guide

## 1-Minute Setup

### Step 1: Open Supabase Dashboard
Go to: https://app.supabase.com/project/YOUR_PROJECT/auth/templates

### Step 2: Configure "Confirm signup" Template

Click on **"Confirm signup"** template and paste:

**Subject:**
```
Verify your MarketingPro account
```

**Message (HTML):** Use the template from `SUPABASE_AUTH_SETUP.md`

### Step 3: Save and Test

1. Click **Save**
2. Register a new test account
3. Check your email
4. Click verification link
5. Done! ✅

## Quick Test

```bash
# 1. Go to your app
http://localhost:3000/auth/register

# 2. Register with your real email
Email: your-email@gmail.com
Password: Test123456

# 3. Check your email inbox
# 4. Click "Verify Email Address"
# 5. Should redirect to dashboard
```

## Verification Email Preview

Your users will receive a beautiful email with:
- ✅ Professional design
- ✅ Clear "Verify Email Address" button
- ✅ Fallback link
- ✅ Security information
- ✅ 24-hour expiration notice

## Common Issues

### Email not received?
- Check spam folder
- Verify email template is saved in Supabase
- Check Supabase Auth logs

### Wrong redirect URL?
- Go to: Authentication → URL Configuration
- Add: `http://localhost:3000/auth/callback`

### Template not working?
- Make sure you clicked **Save**
- Check for HTML syntax errors
- Test with a real email address

## Production Checklist

Before going live:
- [ ] Configure custom SMTP
- [ ] Set up SPF/DKIM records
- [ ] Test email deliverability
- [ ] Update redirect URLs to production domain
- [ ] Test verification flow end-to-end

## Support

Need help? Check:
1. Supabase Dashboard → Auth → Logs
2. Browser console for errors
3. Network tab for API calls
4. `SUPABASE_AUTH_SETUP.md` for detailed guide

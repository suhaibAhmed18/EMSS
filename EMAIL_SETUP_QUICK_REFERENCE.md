# Email Verification Quick Reference Card

## 🎯 5-Minute Setup

### 1. Open Supabase Dashboard
```
https://app.supabase.com → Your Project → Authentication → Email Templates
```

### 2. Configure "Confirm signup"
**Subject:**
```
Verify your MarketingPro account
```

**HTML:** Copy from `COPY_PASTE_EMAIL_TEMPLATE.md`

**Click:** Save ✅

### 3. Enable Confirmations
```
Authentication → Settings → Enable Email Confirmations → ON → Save
```

### 4. Add Redirect URLs
```
Authentication → Settings → URL Configuration

Site URL: http://localhost:3000

Redirect URLs:
- http://localhost:3000/auth/callback
- http://localhost:3000/dashboard
- http://localhost:3000
```

### 5. Test
```
Authentication → Users → Add user → Create new user
Email: your-email@gmail.com
Password: Test123456
Auto Confirm: UNCHECK ❌
Create → Check inbox 📧
```

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| Email not received | Check spam, verify template saved, check logs |
| Template not showing | Click Save again, check HTML syntax |
| Wrong redirect | Add callback URL in Settings |
| Can login without verify | Enable Email Confirmations in Settings |

---

## 📊 Check Status

### View Logs:
```
Authentication → Logs → Filter: Email
```

### Check User:
```
Authentication → Users → Email Confirmed column
```

### Resend Email:
```
Authentication → Users → ... menu → Send verification email
```

---

## 🎨 Customization

### Change Colors:
- Background: `#0a0f0d` → Your color
- Button: `#16a085` → Your brand color

### Change Text:
- Company: "MarketingPro" → Your name
- Support: `support@marketingpro.com` → Your email

---

## 📚 Full Guides

| Need | Open This File |
|------|----------------|
| Copy template | `COPY_PASTE_EMAIL_TEMPLATE.md` |
| Visual guide | `SUPABASE_EMAIL_SETUP_VISUAL_GUIDE.md` |
| Quick start | `QUICK_START_SUPABASE_EMAIL.md` |
| Full migration | `SUPABASE_AUTH_MIGRATION_GUIDE.md` |
| Technical docs | `SUPABASE_AUTH_SETUP.md` |
| Overview | `START_HERE_EMAIL_VERIFICATION.md` |

---

## ✅ Success Checklist

- [ ] Template pasted and saved
- [ ] Email confirmations enabled
- [ ] Redirect URLs added
- [ ] Test email received
- [ ] Email looks professional
- [ ] Verification link works
- [ ] User can login after verify

---

## 🚀 Production

### Before Launch:
1. Configure custom SMTP
2. Update URLs to production domain
3. Set up SPF/DKIM records
4. Test deliverability
5. Check spam folder

### SMTP Providers:
- SendGrid (100/day free)
- Mailgun (5k/month free)
- Amazon SES (cheap)
- Resend (modern)

---

## 📞 Support

- **Docs:** https://supabase.com/docs/guides/auth
- **Discord:** https://discord.supabase.com
- **Logs:** Authentication → Logs

---

## 🎉 Done!

Once you see the verification email in your inbox, you're all set! 🚀


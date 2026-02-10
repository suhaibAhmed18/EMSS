# Copy & Paste: Email Verification Template

## 🎯 Quick Instructions

1. Go to Supabase Dashboard → **Authentication** → **Email Templates**
2. Click **"Confirm signup"**
3. Copy the Subject and HTML below
4. Paste into Supabase
5. Click **Save**
6. Done! ✅

---

## 📧 Subject Line

Copy this into the **"Subject"** field:

```
Verify your MarketingPro account
```

---

## 🎨 HTML Template

Copy this ENTIRE code into the **"Message (HTML)"** field:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0f0d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0f0d; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(4,31,26,0.4)); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, rgba(22,160,133,0.1), rgba(4,31,26,0.3));">
              <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #16a085, #0d7a68); border-radius: 16px; margin-bottom: 20px;">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="padding: 16px;">
                  <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="white"/>
                </svg>
              </div>
              <h1 style="margin: 0; font-size: 32px; font-weight: 600; color: #ffffff; letter-spacing: -0.5px;">
                Verify Your Email
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px; color: rgba(255,255,255,0.9);">
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                Welcome to <strong style="color: #ffffff;">MarketingPro</strong>! We're excited to have you on board.
              </p>
              
              <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                To complete your registration and start creating powerful email and SMS campaigns, please verify your email address by clicking the button below:
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #16a085, #0d7a68); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(22,160,133,0.3);">
                      Verify Email Address
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.6);">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="margin: 0 0 32px; padding: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; font-size: 13px; color: rgba(255,255,255,0.7); word-break: break-all; border: 1px solid rgba(255,255,255,0.1);">
                {{ .ConfirmationURL }}
              </p>
              
              <div style="padding: 20px; background: rgba(22,160,133,0.1); border-left: 3px solid #16a085; border-radius: 8px; margin-bottom: 32px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                  <strong style="color: #16a085;">⚡ Quick Tip:</strong> This link will expire in 24 hours for security reasons. If it expires, you can request a new verification email from the login page.
                </p>
              </div>
              
              <p style="margin: 0 0 8px; font-size: 14px; line-height: 1.6; color: rgba(255,255,255,0.6);">
                If you didn't create an account with MarketingPro, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 16px; font-size: 13px; color: rgba(255,255,255,0.5); text-align: center;">
                Need help? Contact us at <a href="mailto:support@marketingpro.com" style="color: #16a085; text-decoration: none;">support@marketingpro.com</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.4); text-align: center;">
                © 2024 MarketingPro. All rights reserved.<br>
                Premium email & SMS marketing for Shopify
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## ⚙️ Enable Email Confirmations

After pasting the template:

1. Go to **Authentication** → **Settings**
2. Find **"Enable Email Confirmations"**
3. Toggle it **ON**
4. Click **Save**

---

## 🔗 Add Redirect URLs

1. Still in **Authentication** → **Settings**
2. Find **"URL Configuration"**
3. Set **Site URL:** `http://localhost:3000`
4. Add **Redirect URLs:**
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   http://localhost:3000
   ```
5. Click **Save**

---

## 🧪 Test It

### Quick Test in Dashboard:

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter your email: `your-email@gmail.com`
4. Enter password: `Test123456`
5. **UNCHECK** "Auto Confirm User"
6. Click **"Create user"**
7. Check your email! 📧

---

## 🎨 Customization Options

### Change Brand Name:
Replace `MarketingPro` with your brand name

### Change Support Email:
Replace `support@marketingpro.com` with your email

### Change Button Color:
Replace `#16a085` with your brand color

### Change Background:
Replace `#0a0f0d` with your background color

---

## ✅ What You'll Get

**Professional Email with:**
- ✅ Dark theme design
- ✅ Teal accent button (#16a085)
- ✅ Email icon in header
- ✅ Clear call-to-action
- ✅ Security notice (24-hour expiration)
- ✅ Fallback text link
- ✅ Support contact info
- ✅ Mobile responsive
- ✅ Professional footer

---

## 🚨 Important Notes

1. **Don't forget to click Save!** After pasting the template
2. **Enable Email Confirmations** in Settings
3. **Add Redirect URLs** for proper callback
4. **Test with real email** to verify it works
5. **Check spam folder** if email not received

---

## 📱 Email Preview

The email will look like this:

```
┌─────────────────────────────────────┐
│         [Email Icon]                │
│      Verify Your Email              │
├─────────────────────────────────────┤
│                                     │
│  Welcome to MarketingPro!           │
│  We're excited to have you...       │
│                                     │
│  To complete your registration...   │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Verify Email Address         │ │
│  └───────────────────────────────┘ │
│                                     │
│  Or copy and paste this link:       │
│  ┌───────────────────────────────┐ │
│  │ https://your-link...          │ │
│  └───────────────────────────────┘ │
│                                     │
│  ⚡ Quick Tip: This link expires   │
│     in 24 hours...                  │
│                                     │
│  If you didn't create an account... │
│                                     │
├─────────────────────────────────────┤
│  Need help? support@marketingpro... │
│  © 2024 MarketingPro...             │
└─────────────────────────────────────┘
```

---

## 🎉 Done!

Once you've:
1. ✅ Pasted the template
2. ✅ Clicked Save
3. ✅ Enabled email confirmations
4. ✅ Added redirect URLs
5. ✅ Tested with real email

You're all set! Your users will receive professional verification emails automatically. 🚀


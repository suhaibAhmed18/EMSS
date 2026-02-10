# Supabase Auth Email Verification Setup

## Step 1: Configure Supabase Auth Email Templates

Go to your Supabase Dashboard:
1. Navigate to: **Authentication** → **Email Templates**
2. Configure each template below

### 1. Confirm Signup Template

**Subject:**
```
Verify your MarketingPro account
```

**Body (HTML):**
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

### 2. Magic Link Template

**Subject:**
```
Your MarketingPro sign-in link
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign In to MarketingPro</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0f0d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0f0d; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(4,31,26,0.4)); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <h1 style="margin: 0 0 24px; font-size: 28px; font-weight: 600; color: #ffffff;">
                Sign in to MarketingPro
              </h1>
              <p style="margin: 0 0 32px; font-size: 16px; color: rgba(255,255,255,0.8);">
                Click the button below to securely sign in to your account:
              </p>
              <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #16a085, #0d7a68); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                Sign In
              </a>
              <p style="margin: 32px 0 0; font-size: 14px; color: rgba(255,255,255,0.6);">
                This link expires in 1 hour.
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

### 3. Reset Password Template

**Subject:**
```
Reset your MarketingPro password
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0f0d;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0f0d; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(4,31,26,0.4)); border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 28px; font-weight: 600; color: #ffffff; text-align: center;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; color: rgba(255,255,255,0.8);">
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px;">
                    <a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #16a085, #0d7a68); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 16px; font-size: 14px; color: rgba(255,255,255,0.6);">
                This link will expire in 1 hour for security reasons.
              </p>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.6);">
                If you didn't request a password reset, you can safely ignore this email.
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

## Step 2: Configure Supabase Auth Settings

In Supabase Dashboard → **Authentication** → **Settings**:

### Email Auth Settings
- ✅ Enable Email Confirmations
- ✅ Enable Email Change Confirmations
- ✅ Secure Email Change (recommended)

### URL Configuration
Set these URLs:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs (add all):**
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/verify-email
http://localhost:3000/dashboard
```

### Email Template Variables
Available variables you can use:
- `{{ .ConfirmationURL }}` - Verification/magic link URL
- `{{ .Token }}` - Verification token
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email

## Step 3: Update Environment Variables

Add to your `.env.local`:

```env
# Supabase Auth Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Email Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
COMPANY_NAME=MarketingPro
COMPANY_SUPPORT_EMAIL=support@marketingpro.com
```

## Step 4: Test Email Verification

### Test Flow:
1. Register a new account
2. Check your email inbox
3. Click "Verify Email Address" button
4. Should redirect to dashboard
5. Account is now verified

### Test with Real Email:
```bash
# Use your real email for testing
Email: your-email@gmail.com
Password: Test123456
```

### Check Logs:
- Supabase Dashboard → **Authentication** → **Logs**
- See all email sends and verification attempts

## Troubleshooting

### Emails Not Sending?

**Check:**
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Verify templates are saved
3. Check **Logs** for errors

### Wrong Redirect URL?

**Fix:**
1. Go to **Authentication** → **URL Configuration**
2. Add your redirect URLs
3. Make sure Site URL matches your app URL

### Email Goes to Spam?

**Solutions:**
1. Use custom SMTP (recommended for production)
2. Configure SPF/DKIM records
3. Use a verified sending domain

## Production Setup

For production, configure custom SMTP:

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your email provider:
   - **Provider**: Custom SMTP
   - **Host**: smtp.your-provider.com
   - **Port**: 587
   - **Username**: your-smtp-username
   - **Password**: your-smtp-password
   - **Sender Email**: noreply@yourdomain.com
   - **Sender Name**: MarketingPro

### Recommended SMTP Providers:
- **SendGrid** - 100 emails/day free
- **Mailgun** - 5,000 emails/month free
- **Amazon SES** - Very cheap, reliable
- **Resend** - Modern, developer-friendly

## Email Preview

The verification email will look like:
- ✅ Professional design matching your brand
- ✅ Clear call-to-action button
- ✅ Fallback link for accessibility
- ✅ Security information
- ✅ Support contact
- ✅ Mobile responsive

## Next Steps

1. ✅ Configure email templates in Supabase
2. ✅ Set redirect URLs
3. ✅ Test with real email
4. ✅ Verify emails are delivered
5. ✅ Check spam folder if needed
6. ✅ Configure custom SMTP for production

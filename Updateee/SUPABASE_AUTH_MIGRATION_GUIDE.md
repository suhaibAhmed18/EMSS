# Migrating to Supabase Auth Email Verification

## Current Situation

Your app currently uses a **custom email verification system** with:
- Custom verification tokens stored in memory
- Custom email templates sent via Resend
- Custom verification routes (`/api/auth/verify`, `/api/auth/resend-verification`)

## Why Switch to Supabase Auth?

Supabase Auth provides:
- ✅ Built-in email verification with secure tokens
- ✅ Automatic email sending (no need for Resend)
- ✅ Professional email templates (customizable)
- ✅ Token expiration and security handled automatically
- ✅ Email change verification
- ✅ Magic link authentication
- ✅ Password reset flows
- ✅ Production-ready infrastructure

## Migration Steps

### Step 1: Configure Supabase Auth Email Templates

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to: **Authentication** → **Email Templates**
3. Configure the **"Confirm signup"** template

**Copy the template from `SUPABASE_AUTH_SETUP.md`** - it includes:
- Professional design matching your brand
- Dark theme with teal accents
- Clear call-to-action button
- Security information
- Mobile responsive

### Step 2: Configure URL Settings

In Supabase Dashboard → **Authentication** → **URL Configuration**:

**Site URL:**
```
http://localhost:3000
```

**Redirect URLs (add all):**
```
http://localhost:3000/auth/callback
http://localhost:3000/dashboard
http://localhost:3000
```

### Step 3: Enable Email Confirmations

In Supabase Dashboard → **Authentication** → **Settings**:

- ✅ **Enable Email Confirmations** - Turn this ON
- ✅ **Enable Email Change Confirmations** - Turn this ON
- ✅ **Secure Email Change** - Turn this ON (recommended)

### Step 4: Update Your Code

#### A. Update Registration to Use Supabase Auth

Replace your current registration in `src/app/api/auth/register/route.ts`:

```typescript
// OLD: Custom user creation
const { data: user, error } = await supabase
  .from('users')
  .insert({ ... })

// NEW: Use Supabase Auth
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name,
      first_name: firstName,
      last_name: lastName,
      subscription_plan: plan || 'starter'
    },
    emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
  }
})
```

#### B. Create Auth Callback Route

Create `src/app/auth/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard after verification
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
```

#### C. Update Login to Check Supabase Auth

```typescript
// Check if email is verified using Supabase Auth
const { data: { user } } = await supabase.auth.getUser()

if (user && !user.email_confirmed_at) {
  return NextResponse.json({
    error: 'Please verify your email address to continue.',
    needsVerification: true
  }, { status: 403 })
}
```

### Step 5: Test the Flow

1. **Register a new account** with your real email
2. **Check your inbox** for the verification email
3. **Click "Verify Email Address"** button
4. Should redirect to `/auth/callback` then to `/dashboard`
5. **Try logging in** - should work without verification errors

### Step 6: Remove Old Custom Code (Optional)

Once Supabase Auth is working, you can remove:
- `src/lib/auth/tokens.ts` (custom token service)
- `src/app/api/auth/verify/route.ts` (custom verification)
- `src/app/api/auth/resend-verification/route.ts` (custom resend)
- Custom verification email templates in `src/lib/email/service.ts`

## Quick Test Without Code Changes

If you want to test Supabase Auth emails **right now** without changing code:

### Option 1: Use Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter email and password
4. Uncheck **"Auto Confirm User"**
5. Click **"Create user"**
6. Check your email for the verification email!

### Option 2: Use Supabase CLI

```bash
# Send a test verification email
supabase auth send-verification-email your-email@example.com
```

## Troubleshooting

### Emails Not Sending?

**Check:**
1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Verify template is saved (click Save button)
3. Check **Authentication** → **Logs** for errors
4. Verify **Enable Email Confirmations** is ON

### Emails Going to Spam?

**Solutions:**
1. Check spam folder
2. For production: Configure custom SMTP
3. Set up SPF/DKIM records for your domain

### Wrong Redirect URL?

**Fix:**
1. Go to **Authentication** → **URL Configuration**
2. Add your callback URL: `http://localhost:3000/auth/callback`
3. Make sure Site URL matches your app URL

### Template Not Showing?

**Fix:**
1. Make sure you clicked **Save** after pasting template
2. Check for HTML syntax errors
3. Try the default template first to verify emails work

## Production Setup

For production, configure custom SMTP:

1. Go to **Project Settings** → **Auth**
2. Scroll to **SMTP Settings**
3. Configure your email provider:
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

## Benefits After Migration

✅ **No more custom token management**
✅ **Automatic email sending**
✅ **Professional templates out of the box**
✅ **Better security** (Supabase handles token expiration)
✅ **Magic link authentication** (bonus feature)
✅ **Email change verification** (bonus feature)
✅ **Production-ready infrastructure**
✅ **Detailed logs and monitoring**

## Next Steps

1. ✅ Configure email templates in Supabase Dashboard
2. ✅ Set redirect URLs
3. ✅ Enable email confirmations
4. ✅ Test with real email
5. ✅ Update code to use Supabase Auth (optional)
6. ✅ Remove old custom verification code (optional)

## Support

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Email Templates**: https://supabase.com/docs/guides/auth/auth-email-templates
- **SMTP Setup**: https://supabase.com/docs/guides/auth/auth-smtp


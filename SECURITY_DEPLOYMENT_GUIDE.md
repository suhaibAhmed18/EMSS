# 🚀 SECURITY DEPLOYMENT GUIDE

**All 25 security issues have been fixed!** Follow this guide to deploy the fixes.

---

## ⚡ QUICK START (5 Minutes)

### Step 1: Run Database Migrations (2 minutes)

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to SQL Editor
3. Copy and paste the contents of `scripts/run-security-migrations.sql`
4. Click "Run"
5. Verify success message

### Step 2: Generate Encryption Key (1 minute)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output (looks like: `xK7mP9vR2wN5qT8yU3jH6kL1mN4pQ7sV9xA2bC5dE8f=`)

### Step 3: Update Environment Variables (1 minute)

Open `.env.local` and add/update:

```env
DATA_ENCRYPTION_KEY=<paste_your_generated_key_here>
```

### Step 4: Install Dependencies (1 minute)

```bash
npm install
```

### Step 5: Test (Optional but recommended)

```bash
npm run build
```

If build succeeds, you're ready to deploy!

---

## 📋 DETAILED DEPLOYMENT STEPS

### 1. Database Setup

**Run the migration script:**

```sql
-- In Supabase SQL Editor, run:
scripts/run-security-migrations.sql
```

**This creates:**
- `auth_tokens` - Secure token storage
- `user_sessions` - Session management
- `audit_logs` - Security monitoring
- `processed_webhooks` - Webhook idempotency

**Verify tables created:**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('auth_tokens', 'user_sessions', 'audit_logs', 'processed_webhooks');
```

Should return 4 rows.

---

### 2. Environment Configuration

**Generate secure keys:**

```bash
# Encryption key (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Auth secret (if not set)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Update `.env.local`:**

```env
# Required - Add this new key
DATA_ENCRYPTION_KEY=<your_generated_key>

# Verify these exist
NEXTAUTH_SECRET=<your_auth_secret>
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
STRIPE_SECRET_KEY=<your_stripe_key>
STRIPE_WEBHOOK_SECRET=<your_webhook_secret>
```

**⚠️ IMPORTANT:** Never commit `.env.local` to git!

---

### 3. Install Dependencies

```bash
npm install
```

**New packages installed:**
- `isomorphic-dompurify` - XSS protection

---

### 4. Build and Test

```bash
# Build the application
npm run build

# If build fails, check TypeScript errors:
npm run lint
```

**Common issues:**
- Missing environment variables → Check `.env.local`
- TypeScript errors → Fix or temporarily set `ignoreBuildErrors: true`

---

### 5. Test Security Features

**Test 1: Strong Password Requirement**
```bash
# Try registering with weak password
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","password":"weak"}'

# Should return error about password requirements
```

**Test 2: Rate Limiting**
```bash
# Try 6 login attempts rapidly
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# 6th request should return 429 Too Many Requests
```

**Test 3: Payment Validation**
```bash
# Try to pay $1 for enterprise plan
curl -X POST http://localhost:3000/api/payments/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-id","email":"test@example.com","plan":"enterprise","amount":1}'

# Should return error about invalid amount
```

**Test 4: XSS Protection**
1. Create a campaign with HTML: `<script>alert('XSS')</script>`
2. View the campaign
3. Script should be stripped, no alert shown

**Test 5: Session Security**
1. Login
2. Check browser cookies - should see `session-token`
3. Restart server
4. Refresh page - should still be logged in (session in database)

---

### 6. Deploy to Production

**Vercel Deployment:**

```bash
# Set environment variables in Vercel dashboard
vercel env add DATA_ENCRYPTION_KEY production

# Deploy
vercel --prod
```

**Other Platforms:**

1. Set all environment variables
2. Run database migrations on production database
3. Deploy application
4. Test critical flows

---

## 🔍 POST-DEPLOYMENT VERIFICATION

### Check Security Headers

```bash
curl -I https://your-domain.com

# Should see:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Content-Security-Policy: ...
```

### Monitor Audit Logs

```sql
-- Check recent security events
SELECT * FROM audit_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test Authentication

1. Register new account
2. Verify email
3. Login
4. Check session persists
5. Logout
6. Verify session cleared

### Test Payment Flow

1. Select a plan
2. Proceed to checkout
3. Verify correct amount charged
4. Confirm subscription activated

---

## 🛡️ SECURITY MONITORING

### Daily Checks

```sql
-- Failed login attempts
SELECT COUNT(*), ip_address 
FROM audit_logs 
WHERE action = 'login_failed' 
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address 
HAVING COUNT(*) > 10;

-- Suspicious activity
SELECT * FROM audit_logs 
WHERE success = false 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Weekly Maintenance

```sql
-- Cleanup expired tokens
SELECT cleanup_expired_tokens();
SELECT cleanup_expired_sessions();

-- Cleanup old logs (keeps 90 days)
SELECT cleanup_old_audit_logs();
SELECT cleanup_old_webhooks();
```

### Monthly Reviews

1. Run `npm audit` and fix vulnerabilities
2. Review audit logs for patterns
3. Update dependencies
4. Review and rotate API keys if needed

---

## 🚨 ROLLBACK PLAN

If something goes wrong:

### 1. Revert Code Changes

```bash
git revert HEAD
git push
```

### 2. Restore Database (if needed)

```sql
-- Drop new tables (only if absolutely necessary)
DROP TABLE IF EXISTS processed_webhooks;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS auth_tokens;
```

### 3. Restore Environment

Remove `DATA_ENCRYPTION_KEY` from `.env.local`

---

## 📊 SECURITY IMPROVEMENTS SUMMARY

| Feature | Status | Impact |
|---------|--------|--------|
| Password Hashing | ✅ bcrypt | Prevents password cracking |
| Data Encryption | ✅ AES-256-GCM | Protects PII |
| Token Storage | ✅ Database | Survives restarts |
| Session Security | ✅ Random tokens | Prevents hijacking |
| Payment Validation | ✅ Server-side | Prevents fraud |
| XSS Protection | ✅ DOMPurify | Prevents script injection |
| Rate Limiting | ✅ All endpoints | Prevents abuse |
| Security Headers | ✅ Full suite | Defense in depth |
| Password Strength | ✅ 12+ chars | Stronger passwords |
| User Enumeration | ✅ Fixed | Prevents reconnaissance |

---

## 🎯 SUCCESS CRITERIA

Your deployment is successful when:

- [ ] All database tables created
- [ ] Environment variables set
- [ ] Application builds without errors
- [ ] Login/registration works
- [ ] Sessions persist across restarts
- [ ] Payment validation works
- [ ] XSS attempts are blocked
- [ ] Rate limiting triggers after 5 attempts
- [ ] Security headers present
- [ ] No console errors

---

## 📞 TROUBLESHOOTING

### Issue: "DATA_ENCRYPTION_KEY is required"

**Solution:** Generate and set the key in `.env.local`

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Issue: "Table auth_tokens does not exist"

**Solution:** Run the migration script in Supabase SQL Editor

### Issue: "Cannot find module 'isomorphic-dompurify'"

**Solution:** Install dependencies

```bash
npm install
```

### Issue: Login not working

**Solution:** Check these:
1. Database migrations ran successfully
2. `user_sessions` table exists
3. No errors in server logs
4. Cookies are being set (check browser dev tools)

### Issue: TypeScript build errors

**Solution:** Temporarily set in `next.config.ts`:

```typescript
ignoreBuildErrors: true
```

Then fix errors gradually.

---

## 🎉 CONGRATULATIONS!

You've successfully deployed all 25 security fixes! Your application is now:

- ✅ Protected against password cracking
- ✅ Encrypting sensitive data properly
- ✅ Using secure session management
- ✅ Validating payment amounts
- ✅ Protected against XSS attacks
- ✅ Rate limiting all critical endpoints
- ✅ Using strong password requirements
- ✅ Protected against user enumeration
- ✅ Implementing security headers
- ✅ Production-ready!

---

**Need help?** Check:
- `SECURITY_AUDIT_REPORT.md` - Full audit details
- `SECURITY_ISSUES_DETAILED.md` - Technical deep dive
- `SECURITY_FIXES_COMPLETED.md` - What was fixed
- `SECURITY_FIX_CHECKLIST.md` - Detailed checklist

**Last Updated:** February 11, 2026

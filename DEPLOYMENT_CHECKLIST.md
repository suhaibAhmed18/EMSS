# ✅ SECURITY DEPLOYMENT CHECKLIST

Use this checklist to track your deployment progress.

---

## 📋 PRE-DEPLOYMENT (Complete these first)

### Database Setup
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy contents of `scripts/run-security-migrations.sql`
- [ ] Execute the script
- [ ] Verify 4 tables created: `auth_tokens`, `user_sessions`, `audit_logs`, `processed_webhooks`
- [ ] Check for any errors in execution

### Environment Configuration
- [ ] Generate encryption key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- [ ] Copy the generated key
- [ ] Open `.env.local` file
- [ ] Add line: `DATA_ENCRYPTION_KEY=<your_generated_key>`
- [ ] Save `.env.local`
- [ ] Verify `.env.local` is in `.gitignore`

### Dependencies
- [ ] Run `npm install`
- [ ] Verify `isomorphic-dompurify` installed
- [ ] Check for any installation errors
- [ ] Run `npm audit` - should show 0 vulnerabilities

### Build & Test
- [ ] Run `npm run build`
- [ ] Build completes successfully
- [ ] No critical errors in build output
- [ ] Run `npm run lint` (optional)

---

## 🧪 LOCAL TESTING (Test before deploying)

### Authentication Tests
- [ ] Register new account with weak password - should fail
- [ ] Register with strong password (12+ chars, mixed case, number, special) - should succeed
- [ ] Verify email verification email sent
- [ ] Login with correct credentials - should succeed
- [ ] Login with wrong password - should fail with generic error
- [ ] Try 6 login attempts - 6th should be rate limited (429 error)
- [ ] Logout - should clear session
- [ ] Restart server - session should persist (database storage)

### Payment Tests
- [ ] Navigate to payment page
- [ ] Select a plan
- [ ] Open browser dev tools → Network tab
- [ ] Modify payment amount in request to $1
- [ ] Submit payment
- [ ] Should receive error: "Invalid amount for selected plan"

### XSS Protection Tests
- [ ] Create new email campaign
- [ ] Add HTML content: `<script>alert('XSS')</script>`
- [ ] Save campaign
- [ ] View campaign
- [ ] Script should be stripped, no alert shown
- [ ] Check page source - script tag should be removed

### Security Headers Tests
- [ ] Open terminal
- [ ] Run: `curl -I http://localhost:3000`
- [ ] Verify headers present:
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Content-Security-Policy: ...`

### Rate Limiting Tests
- [ ] Test registration endpoint (5 attempts in 15 min)
- [ ] Test forgot password endpoint (5 attempts in 15 min)
- [ ] Test contact import endpoint (20 attempts in 1 hour)
- [ ] Verify 429 responses after limits exceeded

---

## 🚀 DEPLOYMENT

### Production Database
- [ ] Access production Supabase dashboard
- [ ] Run `scripts/run-security-migrations.sql` in production
- [ ] Verify tables created successfully
- [ ] Check for any errors

### Production Environment Variables
- [ ] Generate NEW encryption key for production
- [ ] Add to production environment variables:
  - [ ] `DATA_ENCRYPTION_KEY=<production_key>`
- [ ] Verify all other env vars are set:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `RESEND_API_KEY`
  - [ ] `NEXTAUTH_SECRET`

### Deploy Application
- [ ] Commit all changes to git
- [ ] Push to repository
- [ ] Deploy to production (Vercel/other platform)
- [ ] Wait for deployment to complete
- [ ] Check deployment logs for errors

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Smoke Tests
- [ ] Visit production URL
- [ ] Homepage loads correctly
- [ ] No console errors in browser
- [ ] Register new account
- [ ] Receive verification email
- [ ] Login successfully
- [ ] Navigate to dashboard
- [ ] Create a campaign
- [ ] View campaign (XSS protection working)

### Security Verification
- [ ] Check security headers: `curl -I https://your-domain.com`
- [ ] Verify HTTPS redirect working
- [ ] Test rate limiting on production
- [ ] Test payment validation
- [ ] Check session persistence

### Database Verification
```sql
-- Run in production Supabase:

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('auth_tokens', 'user_sessions', 'audit_logs', 'processed_webhooks');

-- Check sessions are being created
SELECT COUNT(*) FROM user_sessions;

-- Check tokens are being created
SELECT COUNT(*) FROM auth_tokens;
```

### Monitoring Setup
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Create alerts for:
  - [ ] Failed login attempts (>10/hour)
  - [ ] Rate limit triggers
  - [ ] Payment validation failures
  - [ ] Server errors (500s)

---

## 📊 METRICS TO TRACK

### Week 1
- [ ] Monitor error rates
- [ ] Check failed login attempts
- [ ] Review audit logs daily
- [ ] Track rate limit triggers
- [ ] Monitor payment success rate

### Week 2-4
- [ ] Review security metrics weekly
- [ ] Check for unusual patterns
- [ ] Verify no security incidents
- [ ] Collect user feedback
- [ ] Document any issues

---

## 🚨 ROLLBACK PLAN (If needed)

### If Critical Issues Occur
- [ ] Identify the issue
- [ ] Check error logs
- [ ] Determine if rollback needed
- [ ] If yes, execute rollback:
  - [ ] Revert code deployment
  - [ ] Restore previous environment variables
  - [ ] (Optional) Drop new database tables if causing issues
  - [ ] Verify application working
  - [ ] Investigate root cause
  - [ ] Fix and redeploy

---

## 📝 DOCUMENTATION

### Update Documentation
- [ ] Update README with security features
- [ ] Document new environment variables
- [ ] Update deployment guide
- [ ] Add security section to docs
- [ ] Document monitoring procedures

### Team Communication
- [ ] Notify team of deployment
- [ ] Share security improvements
- [ ] Provide training on new features
- [ ] Document any issues encountered
- [ ] Schedule security review meeting

---

## 🎯 SUCCESS CRITERIA

Deployment is successful when ALL of these are true:

- [ ] All database tables created
- [ ] All environment variables set
- [ ] Application builds without errors
- [ ] All tests passing
- [ ] Login/registration working
- [ ] Sessions persist across restarts
- [ ] Payment validation working
- [ ] XSS protection active
- [ ] Rate limiting functional
- [ ] Security headers present
- [ ] No critical errors in logs
- [ ] Monitoring configured
- [ ] Team notified

---

## 📞 SUPPORT CONTACTS

### If You Need Help

**Database Issues:**
- Check Supabase dashboard for errors
- Review migration script syntax
- Verify permissions

**Environment Issues:**
- Verify all variables set correctly
- Check for typos in variable names
- Ensure encryption key is base64 encoded

**Build Issues:**
- Check TypeScript errors
- Verify dependencies installed
- Review build logs

**Runtime Issues:**
- Check application logs
- Review error monitoring
- Check database connections

---

## 🎉 COMPLETION

When all items are checked:

1. **Celebrate!** 🎊 You've successfully deployed enterprise-grade security
2. **Monitor closely** for the first 48 hours
3. **Document lessons learned**
4. **Schedule security review** in 30 days
5. **Plan next security improvements**

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Verified By:** _______________  
**Status:** ⬜ In Progress | ⬜ Complete | ⬜ Rolled Back

---

**Last Updated:** February 11, 2026

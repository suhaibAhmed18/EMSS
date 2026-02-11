# ✅ SECURITY FIX CHECKLIST

Quick reference for fixing all identified security issues. Check off items as you complete them.

---

## 🔴 CRITICAL FIXES (DO FIRST - Week 1)

### [ ] 1. Replace SHA-256 with bcrypt
- [ ] Update `src/lib/auth/server.ts` hashPassword method
- [ ] Update verifyPassword method to async
- [ ] Update all calling methods to use await
- [ ] Create migration script for existing passwords
- [ ] Test login with new hashing
- [ ] Deploy migration

**Files to modify:**
- `src/lib/auth/server.ts`
- `src/app/api/auth/login/route.ts`
- `src/app/api/auth/register/route.ts`

---

### [ ] 2. Implement Real AES-256-GCM Encryption
- [ ] Update `src/lib/database/client.ts` DataEncryption class
- [ ] Implement proper encrypt() method
- [ ] Implement proper decrypt() method
- [ ] Update hashForIndex() to use HMAC
- [ ] Generate new DATA_ENCRYPTION_KEY
- [ ] Create migration script to re-encrypt data
- [ ] Test encryption/decryption
- [ ] Run migration on production

**Files to modify:**
- `src/lib/database/client.ts`
- `.env.local` (generate new key)

**Command to generate key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

### [ ] 3. Move Token Storage to Database
- [ ] Create `auth_tokens` table in Supabase
- [ ] Update `src/lib/auth/tokens.ts` to use database
- [ ] Update createVerificationToken to async
- [ ] Update createPasswordResetToken to async
- [ ] Update validateToken to async
- [ ] Update all calling code to use await
- [ ] Set up cron job for token cleanup
- [ ] Test email verification flow
- [ ] Test password reset flow

**SQL to run:**
```sql
CREATE TABLE auth_tokens (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('verification', 'password_reset')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);
CREATE INDEX idx_auth_tokens_email ON auth_tokens(email);
CREATE INDEX idx_auth_tokens_expires ON auth_tokens(expires_at);
```

---

### [ ] 4. Fix Session Token Security
- [ ] Create `user_sessions` table
- [ ] Create `src/lib/auth/sessions.ts`
- [ ] Update login to use SessionManager
- [ ] Update getCurrentUser to validate session from DB
- [ ] Update logout to delete session from DB
- [ ] Add session cleanup cron job
- [ ] Test login/logout flow

**SQL to run:**
```sql
CREATE TABLE user_sessions (
  session_token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
```

---

### [ ] 5. Add Payment Amount Validation
- [ ] Create `src/lib/pricing/plans.ts` with PLAN_PRICES
- [ ] Add validatePlanPrice function
- [ ] Update `src/app/api/payments/create-checkout/route.ts`
- [ ] Validate plan exists
- [ ] Validate amount matches plan
- [ ] Use server-side price only
- [ ] Test payment flow
- [ ] Try to bypass with modified amount (should fail)

**Files to modify:**
- `src/app/api/payments/create-checkout/route.ts`
- Create `src/lib/pricing/plans.ts`

---

### [ ] 6. Fix XSS Vulnerabilities
- [ ] Install DOMPurify: `npm install isomorphic-dompurify`
- [ ] Create `src/lib/security/sanitize.ts`
- [ ] Update `src/app/campaigns/[type]/[id]/view/page.tsx`
- [ ] Update `src/app/campaigns/email/new/page.tsx`
- [ ] Update `src/components/campaigns/EmailBuilder.tsx`
- [ ] Update `src/components/campaigns/TemplateEditor.tsx`
- [ ] Test campaign creation and viewing
- [ ] Try XSS payload (should be sanitized)

**Install command:**
```bash
npm install isomorphic-dompurify
npm install --save-dev @types/dompurify
```

---

## 🟠 HIGH PRIORITY FIXES (Week 2)

### [ ] 7. Add Rate Limiting to All Endpoints
- [ ] Update `src/lib/security/rate-limiter.ts` if needed
- [ ] Create rate limit middleware
- [ ] Apply to `/api/auth/register`
- [ ] Apply to `/api/auth/forgot-password`
- [ ] Apply to `/api/contacts/import`
- [ ] Apply to `/api/campaigns/send`
- [ ] Apply to all POST endpoints
- [ ] Test rate limiting
- [ ] Verify 429 responses

**Endpoints to protect:**
- `/api/auth/register`
- `/api/auth/forgot-password`
- `/api/auth/resend-verification`
- `/api/contacts/import`
- `/api/campaigns/send`
- `/api/email/send`
- `/api/sms/send`

---

### [ ] 8. Implement CSRF Protection
- [ ] Install csrf library: `npm install csrf`
- [ ] Create CSRF token generation endpoint
- [ ] Add CSRF token to all forms
- [ ] Validate CSRF token on POST requests
- [ ] Update frontend to include CSRF token
- [ ] Test form submissions
- [ ] Try CSRF attack (should fail)

---

### [ ] 9. Strengthen Password Requirements
- [ ] Update `src/app/api/auth/register/route.ts`
- [ ] Add password complexity regex
- [ ] Require 12+ characters
- [ ] Require uppercase, lowercase, number, special char
- [ ] Update frontend validation
- [ ] Update error messages
- [ ] Test registration with weak passwords

**Regex to use:**
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/
```

---

### [ ] 10. Fix User Enumeration
- [ ] Update `src/app/api/auth/login/route.ts`
- [ ] Use same error message for all failures
- [ ] Remove "Invalid credentials" vs "Email not found"
- [ ] Add timing attack protection (constant-time comparison)
- [ ] Test login with invalid email
- [ ] Test login with invalid password
- [ ] Verify same error message

---

### [ ] 11. Add Security Headers
- [ ] Create `src/middleware.ts`
- [ ] Add X-Frame-Options: DENY
- [ ] Add X-Content-Type-Options: nosniff
- [ ] Add Referrer-Policy
- [ ] Add Permissions-Policy
- [ ] Add Content-Security-Policy
- [ ] Test headers in browser dev tools
- [ ] Verify CSP doesn't break functionality

---

### [ ] 12. Fix Secure Cookie Flag
- [ ] Update `src/app/api/auth/login/route.ts`
- [ ] Set `secure: true` always (use HTTPS in dev)
- [ ] Set `sameSite: 'strict'`
- [ ] Test login
- [ ] Verify cookie flags in browser

---

### [ ] 13. Add Input Length Limits
- [ ] Install Zod schemas for all endpoints
- [ ] Add max length to all string fields
- [ ] Add max size to file uploads
- [ ] Update campaign creation
- [ ] Update contact creation
- [ ] Test with oversized inputs
- [ ] Verify 400 errors

---

### [ ] 14. Fix CSV Injection
- [ ] Update `src/app/api/contacts/import/route.ts`
- [ ] Escape cells starting with =, +, -, @, \t, \r
- [ ] Update CSV export to escape formulas
- [ ] Test import with malicious CSV
- [ ] Verify formulas are escaped

---

### [ ] 15. Enforce Subscription Checks
- [ ] Audit all API endpoints
- [ ] Add `requireActiveSubscription` to:
  - [ ] `/api/contacts/route.ts` (POST)
  - [ ] `/api/campaigns/[id]` (PUT)
  - [ ] `/api/analytics/*`
  - [ ] `/api/email/send`
  - [ ] `/api/sms/send`
- [ ] Test with expired subscription
- [ ] Verify 403 responses

---

## 🟡 MEDIUM PRIORITY FIXES (Week 3)

### [ ] 16. Call Environment Validation on Startup
- [ ] Update `src/app/layout.tsx` or create startup script
- [ ] Call `validateConfig()` from `src/lib/config.ts`
- [ ] Test with missing env vars
- [ ] Verify app fails to start

---

### [ ] 17. Sanitize Error Messages
- [ ] Audit all error responses
- [ ] Remove detailed error messages in production
- [ ] Log detailed errors server-side only
- [ ] Return generic errors to client
- [ ] Test error scenarios
- [ ] Verify no info leakage

---

### [ ] 18. Implement Audit Logging
- [ ] Create `audit_logs` table
- [ ] Create audit logging service
- [ ] Log failed login attempts
- [ ] Log permission denials
- [ ] Log data exports
- [ ] Log subscription changes
- [ ] Log payment events
- [ ] Set up log monitoring

**SQL to run:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

---

### [ ] 19. Add Webhook Idempotency
- [ ] Create `processed_webhooks` table
- [ ] Update `src/app/api/webhooks/stripe-upgrade/route.ts`
- [ ] Check if webhook already processed
- [ ] Store webhook ID after processing
- [ ] Test duplicate webhook delivery
- [ ] Verify no duplicate processing

---

### [ ] 20. Fix TypeScript Errors
- [ ] Set `ignoreBuildErrors: false` in `next.config.ts`
- [ ] Run `npm run build`
- [ ] Fix all TypeScript errors
- [ ] Run build again
- [ ] Verify no errors

---

### [ ] 21. Add Request Size Limits
- [ ] Update `next.config.ts`
- [ ] Add body size limit (1MB)
- [ ] Test with large payloads
- [ ] Verify 413 errors

---

### [ ] 22. Remove Sensitive Logging
- [ ] Search for `console.log` with sensitive data
- [ ] Remove password logging
- [ ] Remove token logging
- [ ] Remove API key logging
- [ ] Use proper logger (Winston/Pino)

---

### [ ] 23. Add HTTPS Redirect
- [ ] Create middleware for HTTPS redirect
- [ ] Test HTTP requests
- [ ] Verify redirect to HTTPS

---

### [ ] 24. Set Up Dependency Scanning
- [ ] Run `npm audit`
- [ ] Fix vulnerabilities: `npm audit fix`
- [ ] Add to CI/CD pipeline
- [ ] Set up Snyk or Dependabot
- [ ] Configure automated PRs for updates

---

### [ ] 25. Add Email Verification Enforcement
- [ ] Audit all API endpoints
- [ ] Check `emailVerified` flag
- [ ] Block operations if not verified
- [ ] Test with unverified account
- [ ] Verify 403 responses

---

## 🧪 TESTING CHECKLIST

### [ ] Security Testing
- [ ] Run `npm audit`
- [ ] Test SQL injection attempts
- [ ] Test XSS payloads
- [ ] Test CSRF attacks
- [ ] Test rate limiting
- [ ] Test authentication bypass
- [ ] Test payment manipulation
- [ ] Test session hijacking
- [ ] Test privilege escalation
- [ ] Run OWASP ZAP scan

### [ ] Penetration Testing
- [ ] Hire security firm for pentest
- [ ] Fix identified issues
- [ ] Re-test
- [ ] Get security certification

---

## 🚀 DEPLOYMENT CHECKLIST

### [ ] Pre-Deployment
- [ ] All critical fixes completed
- [ ] All high priority fixes completed
- [ ] Security testing passed
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Backup database
- [ ] Test rollback procedure

### [ ] Deployment
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Monitor security logs
- [ ] Verify all features working

### [ ] Post-Deployment
- [ ] Run security scan
- [ ] Monitor for 24 hours
- [ ] Check audit logs
- [ ] Verify no regressions
- [ ] Update security documentation

---

## 📊 PROGRESS TRACKING

**Critical Issues:** 0/6 completed  
**High Priority:** 0/9 completed  
**Medium Priority:** 0/10 completed  
**Total Progress:** 0/25 (0%)

---

## 🔄 WEEKLY GOALS

### Week 1: Critical Fixes
- Complete issues #1-6
- Target: 6/6 critical issues fixed

### Week 2: High Priority
- Complete issues #7-15
- Target: 9/9 high priority issues fixed

### Week 3: Medium Priority
- Complete issues #16-25
- Target: 10/10 medium priority issues fixed

### Week 4: Testing & Deployment
- Complete all testing
- Deploy to production
- Monitor and verify

---

## 📞 SUPPORT

If you need help with any fixes:
1. Check SECURITY_ISSUES_DETAILED.md for detailed instructions
2. Check SECURITY_AUDIT_REPORT.md for context
3. Consult with security team
4. Review OWASP guidelines

---

**Last Updated:** February 11, 2026  
**Next Review:** After Week 1 fixes completed

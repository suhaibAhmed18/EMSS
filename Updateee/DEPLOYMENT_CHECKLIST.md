# Deployment Checklist: Registration-Payment-Login Flow

Use this checklist to ensure everything is properly configured before going to production.

## ✅ Pre-Deployment Checklist

### 1. Environment Configuration

#### Development
- [ ] `.env.local` file created from `.env.local.example`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `NEXTAUTH_SECRET` generated (32+ characters)
- [ ] `DATA_ENCRYPTION_KEY` generated (32+ characters)
- [ ] `STRIPE_PUBLISHABLE_KEY` set (test mode: `pk_test_...`)
- [ ] `STRIPE_SECRET_KEY` set (test mode: `sk_test_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` set (from Stripe CLI)
- [ ] `NEXT_PUBLIC_APP_URL` set to `http://localhost:3000`

#### Production
- [ ] All environment variables set in hosting platform
- [ ] `NEXTAUTH_SECRET` changed from development
- [ ] `DATA_ENCRYPTION_KEY` changed from development
- [ ] `STRIPE_PUBLISHABLE_KEY` set (live mode: `pk_live_...`)
- [ ] `STRIPE_SECRET_KEY` set (live mode: `sk_live_...`)
- [ ] `STRIPE_WEBHOOK_SECRET` set (from production webhook)
- [ ] `NEXT_PUBLIC_APP_URL` set to production domain
- [ ] `RESEND_API_KEY` set for real emails
- [ ] `TELNYX_API_KEY` set for SMS (optional)

### 2. Database Setup

- [ ] Supabase project created
- [ ] `scripts/setup-subscription-plans.sql` executed
- [ ] 3 subscription plans created (Starter, Professional, Enterprise)
- [ ] Plans verified with query:
  ```sql
  SELECT name, price, features FROM subscription_plans ORDER BY price;
  ```
- [ ] Row-Level Security (RLS) enabled
- [ ] RLS policies created for subscription_plans
- [ ] Users table exists with all required fields
- [ ] Database indexes created for performance

### 3. Stripe Configuration

#### Test Mode (Development)
- [ ] Stripe account created
- [ ] Test mode enabled
- [ ] Test API keys obtained
- [ ] Stripe CLI installed
- [ ] Webhook forwarding started:
  ```bash
  stripe listen --forward-to localhost:3000/api/payments/webhook
  ```
- [ ] Webhook secret copied to `.env.local`
- [ ] Test payment completed successfully
- [ ] Webhook events received and processed

#### Live Mode (Production)
- [ ] Business information completed in Stripe
- [ ] Bank account connected for payouts
- [ ] Live mode enabled
- [ ] Live API keys obtained
- [ ] Production webhook endpoint created:
  - URL: `https://yourdomain.com/api/payments/webhook`
  - Events selected:
    - [ ] `checkout.session.completed`
    - [ ] `customer.subscription.updated`
    - [ ] `customer.subscription.deleted`
    - [ ] `invoice.payment_failed`
- [ ] Webhook secret copied to production environment
- [ ] Test payment in live mode completed
- [ ] Webhook events verified in Stripe Dashboard

### 4. Email Configuration

#### Development
- [ ] Email service logs to console
- [ ] Verification emails appear in console
- [ ] Verification links work correctly

#### Production
- [ ] Resend account created
- [ ] Domain verified in Resend
- [ ] API key obtained
- [ ] `RESEND_API_KEY` set in production
- [ ] `EMAIL_FROM_ADDRESS` set to verified domain
- [ ] Test email sent successfully
- [ ] Email deliverability tested
- [ ] Spam score checked

### 5. Application Testing

#### Registration Flow
- [ ] Pricing page loads correctly
- [ ] All 3 plans display properly
- [ ] "Get Started" redirects to registration
- [ ] Registration form validates input
- [ ] Password requirements enforced
- [ ] Account created successfully
- [ ] Redirect to payment page works

#### Payment Flow
- [ ] Payment page displays order summary
- [ ] Stripe Checkout session created
- [ ] Redirect to Stripe works
- [ ] Test card payment succeeds
- [ ] Redirect to success page works
- [ ] Payment verification works

#### Webhook Processing
- [ ] Webhook receives events
- [ ] Signature verification works
- [ ] User subscription status updated
- [ ] Stripe IDs saved to database
- [ ] Verification email sent

#### Email Verification
- [ ] Verification email received
- [ ] Verification link works
- [ ] Token validation works
- [ ] Email marked as verified
- [ ] Redirect to login works

#### Login Flow
- [ ] Login page loads correctly
- [ ] Credentials validated
- [ ] Email verification checked
- [ ] Payment verification checked
- [ ] Rate limiting works (5 attempts)
- [ ] Session cookie set
- [ ] Telnyx number assigned
- [ ] Redirect to dashboard works

#### Error Handling
- [ ] Invalid credentials show error
- [ ] Unverified email shows error with resend option
- [ ] Unpaid account shows error with pricing link
- [ ] Rate limit shows lockout message
- [ ] Payment failure handled gracefully
- [ ] Cancelled payment handled correctly

### 6. Security Testing

#### Authentication
- [ ] Passwords hashed (SHA-256)
- [ ] Session cookies HTTP-only
- [ ] Session cookies secure in production
- [ ] Rate limiting active
- [ ] CSRF protection enabled
- [ ] SQL injection prevented
- [ ] XSS attacks prevented

#### Payment Security
- [ ] Stripe PCI compliance verified
- [ ] Webhook signatures validated
- [ ] Payment metadata secure
- [ ] Subscription data encrypted

#### Data Protection
- [ ] Row-Level Security (RLS) active
- [ ] User data isolated
- [ ] Sensitive data encrypted
- [ ] Input validation working
- [ ] Output sanitization working

### 7. Performance Testing

- [ ] Page load times acceptable (<3s)
- [ ] API response times fast (<500ms)
- [ ] Database queries optimized
- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Lazy loading working
- [ ] CDN configured (if applicable)

### 8. UI/UX Testing

#### Desktop
- [ ] Pricing page responsive
- [ ] Registration form usable
- [ ] Payment page clear
- [ ] Login page functional
- [ ] Dashboard accessible

#### Mobile
- [ ] All pages mobile-friendly
- [ ] Forms easy to fill
- [ ] Buttons easily tappable
- [ ] Text readable
- [ ] Navigation smooth

#### Browsers
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Edge tested
- [ ] Mobile browsers tested

### 9. Monitoring & Logging

- [ ] Error tracking set up (Sentry, etc.)
- [ ] Performance monitoring enabled
- [ ] Log aggregation configured
- [ ] Webhook event logging active
- [ ] Payment event logging active
- [ ] User action logging active
- [ ] Alerts configured for:
  - [ ] Payment failures
  - [ ] Webhook failures
  - [ ] High error rates
  - [ ] Performance issues

### 10. Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment guide created
- [ ] Troubleshooting guide available
- [ ] User guide created (optional)

### 11. Backup & Recovery

- [ ] Database backups enabled
- [ ] Backup schedule configured
- [ ] Recovery procedure documented
- [ ] Backup restoration tested
- [ ] Disaster recovery plan created

### 12. Compliance

- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] Cookie policy updated
- [ ] GDPR compliance verified (if applicable)
- [ ] CCPA compliance verified (if applicable)
- [ ] PCI DSS compliance verified (Stripe)
- [ ] Data retention policy defined

### 13. Production Deployment

#### Pre-Deployment
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Staging environment tested
- [ ] Rollback plan prepared

#### Deployment
- [ ] Code deployed to production
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Stripe webhook configured
- [ ] DNS configured
- [ ] SSL/TLS certificates installed
- [ ] CDN configured (if applicable)

#### Post-Deployment
- [ ] Production smoke tests passed
- [ ] Registration flow tested
- [ ] Payment flow tested
- [ ] Email delivery tested
- [ ] Monitoring active
- [ ] Logs being collected
- [ ] Alerts working

### 14. Launch Preparation

- [ ] Beta users invited
- [ ] Feedback collected
- [ ] Issues resolved
- [ ] Marketing materials ready
- [ ] Support channels set up
- [ ] Launch announcement prepared

## 🚨 Critical Items (Must Complete)

These items are **absolutely required** before going to production:

1. **Security**
   - [ ] Change `NEXTAUTH_SECRET` from development
   - [ ] Change `DATA_ENCRYPTION_KEY` from development
   - [ ] Use production Stripe keys
   - [ ] Enable HTTPS/SSL

2. **Payment**
   - [ ] Configure production Stripe webhook
   - [ ] Test live payment
   - [ ] Verify webhook processing

3. **Email**
   - [ ] Set up real email service (Resend)
   - [ ] Verify domain
   - [ ] Test email delivery

4. **Database**
   - [ ] Enable backups
   - [ ] Verify RLS policies
   - [ ] Test data isolation

5. **Monitoring**
   - [ ] Set up error tracking
   - [ ] Configure alerts
   - [ ] Test alert delivery

## 📋 Testing Checklist

### Manual Testing

- [ ] Complete registration with Starter plan
- [ ] Complete registration with Professional plan
- [ ] Complete registration with Enterprise plan
- [ ] Try login before email verification
- [ ] Try login before payment
- [ ] Resend verification email
- [ ] Test payment failure
- [ ] Test payment cancellation
- [ ] Test rate limiting
- [ ] Test invalid credentials
- [ ] Test password reset (if implemented)

### Automated Testing (Optional)

- [ ] Unit tests written
- [ ] Integration tests written
- [ ] E2E tests written
- [ ] All tests passing
- [ ] Test coverage >80%

## 🎯 Launch Day Checklist

### Morning of Launch
- [ ] Verify all systems operational
- [ ] Check database connectivity
- [ ] Verify Stripe webhook active
- [ ] Test email delivery
- [ ] Review monitoring dashboards
- [ ] Prepare support team

### During Launch
- [ ] Monitor error rates
- [ ] Watch payment processing
- [ ] Check email delivery
- [ ] Monitor server performance
- [ ] Track user registrations
- [ ] Respond to issues quickly

### After Launch
- [ ] Review metrics
- [ ] Analyze user feedback
- [ ] Fix critical issues
- [ ] Plan improvements
- [ ] Celebrate success! 🎉

## 📞 Emergency Contacts

Document these before launch:

- **Hosting Provider Support**: _______________
- **Stripe Support**: _______________
- **Email Service Support**: _______________
- **Database Support**: _______________
- **On-Call Developer**: _______________

## 🔧 Rollback Procedure

If something goes wrong:

1. **Immediate Actions**
   - [ ] Stop new deployments
   - [ ] Assess impact
   - [ ] Notify team

2. **Rollback Steps**
   - [ ] Revert to previous deployment
   - [ ] Verify rollback successful
   - [ ] Test critical flows
   - [ ] Monitor for issues

3. **Post-Rollback**
   - [ ] Identify root cause
   - [ ] Fix issue
   - [ ] Test fix thoroughly
   - [ ] Plan re-deployment

## ✅ Final Sign-Off

Before going to production, confirm:

- [ ] All critical items completed
- [ ] All tests passing
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Team trained and ready
- [ ] Support channels active
- [ ] Monitoring configured
- [ ] Rollback plan ready

**Signed off by**: _______________
**Date**: _______________

---

## 🎉 You're Ready to Launch!

Once all items are checked, you're ready to deploy your professional registration-payment-login flow to production.

**Good luck with your launch!** 🚀

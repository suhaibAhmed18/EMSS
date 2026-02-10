# Production Deployment Checklist - Subscription Upgrade System

## Pre-Deployment Checklist

### 🔐 Security

- [ ] **Replace all test Stripe keys with production keys**
  - [ ] Update `STRIPE_SECRET_KEY` with `sk_live_...`
  - [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with `pk_live_...`
  - [ ] Verify keys are from the same Stripe account

- [ ] **Set up production webhook endpoint**
  - [ ] Add webhook endpoint in Stripe Dashboard
  - [ ] URL: `https://yourdomain.com/api/webhooks/stripe`
  - [ ] Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - [ ] Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

- [ ] **Update environment variables**
  - [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
  - [ ] Generate new `NEXTAUTH_SECRET` (32+ characters)
  - [ ] Generate new `DATA_ENCRYPTION_KEY` (32+ characters)
  - [ ] Verify all secrets are secure and unique

- [ ] **Enable HTTPS**
  - [ ] SSL certificate installed
  - [ ] Force HTTPS redirect
  - [ ] Update all URLs to use HTTPS

- [ ] **Review security settings**
  - [ ] CORS configured correctly
  - [ ] Rate limiting enabled
  - [ ] API authentication working
  - [ ] Webhook signature verification enabled

### 💾 Database

- [ ] **Run production migrations**
  ```sql
  -- In Supabase SQL Editor
  -- 1. Create subscription_plans table
  -- 2. Insert production plans
  -- 3. Create get_available_upgrades function
  -- 4. Set up RLS policies
  ```

- [ ] **Verify database schema**
  - [ ] `subscription_plans` table exists
  - [ ] `users` table has subscription fields
  - [ ] `get_available_upgrades` function works
  - [ ] RLS policies are correct

- [ ] **Set up production plans**
  - [ ] Review plan pricing
  - [ ] Update plan features
  - [ ] Set correct billing periods
  - [ ] Mark plans as active

- [ ] **Database backups**
  - [ ] Automated backups enabled
  - [ ] Backup retention policy set
  - [ ] Test restore procedure

### 💳 Stripe Configuration

- [ ] **Activate Stripe account**
  - [ ] Complete business verification
  - [ ] Add bank account for payouts
  - [ ] Set up tax settings
  - [ ] Configure billing details

- [ ] **Create production products**
  - [ ] Create products for each plan
  - [ ] Set up recurring prices
  - [ ] Configure billing intervals
  - [ ] Add product descriptions

- [ ] **Configure webhooks**
  - [ ] Add production webhook endpoint
  - [ ] Test webhook delivery
  - [ ] Set up webhook monitoring
  - [ ] Configure retry logic

- [ ] **Set up customer portal** (optional)
  - [ ] Enable customer portal
  - [ ] Configure allowed actions
  - [ ] Customize branding
  - [ ] Test portal access

### 🧪 Testing

- [ ] **Test upgrade flow end-to-end**
  - [ ] Modal opens correctly
  - [ ] Plans load from database
  - [ ] Can select and upgrade
  - [ ] Stripe checkout works
  - [ ] Payment processes successfully
  - [ ] Webhook updates database
  - [ ] User redirected correctly
  - [ ] Success message appears

- [ ] **Test with real payment methods**
  - [ ] Credit card payment
  - [ ] Debit card payment
  - [ ] International cards
  - [ ] 3D Secure authentication

- [ ] **Test error scenarios**
  - [ ] Declined payment
  - [ ] Expired card
  - [ ] Insufficient funds
  - [ ] Network timeout
  - [ ] Webhook failure

- [ ] **Test edge cases**
  - [ ] User already on highest plan
  - [ ] Concurrent upgrade attempts
  - [ ] Browser back button
  - [ ] Session timeout
  - [ ] Duplicate payments

### 📱 User Experience

- [ ] **Test on all devices**
  - [ ] Desktop (Chrome, Firefox, Safari, Edge)
  - [ ] Mobile (iOS Safari, Android Chrome)
  - [ ] Tablet (iPad, Android tablets)

- [ ] **Verify responsive design**
  - [ ] Modal displays correctly on mobile
  - [ ] Buttons are clickable
  - [ ] Text is readable
  - [ ] Images load properly

- [ ] **Check loading states**
  - [ ] Loading spinner shows
  - [ ] Buttons disable during processing
  - [ ] Error messages display
  - [ ] Success messages appear

- [ ] **Accessibility**
  - [ ] Keyboard navigation works
  - [ ] Screen reader compatible
  - [ ] Color contrast sufficient
  - [ ] Focus indicators visible

### 📧 Notifications

- [ ] **Set up email notifications**
  - [ ] Upgrade confirmation email
  - [ ] Payment receipt email
  - [ ] Subscription renewal reminder
  - [ ] Payment failure notification

- [ ] **Configure email templates**
  - [ ] Branded email design
  - [ ] Clear call-to-actions
  - [ ] Unsubscribe link
  - [ ] Contact information

- [ ] **Test email delivery**
  - [ ] Emails send successfully
  - [ ] No spam folder issues
  - [ ] Links work correctly
  - [ ] Images display properly

### 📊 Monitoring

- [ ] **Set up error tracking**
  - [ ] Sentry or similar tool configured
  - [ ] Error alerts enabled
  - [ ] Source maps uploaded
  - [ ] Team notifications set

- [ ] **Configure analytics**
  - [ ] Track upgrade button clicks
  - [ ] Monitor conversion rates
  - [ ] Track payment success/failure
  - [ ] Measure time to upgrade

- [ ] **Set up logging**
  - [ ] API request logging
  - [ ] Webhook event logging
  - [ ] Error logging
  - [ ] Performance logging

- [ ] **Create dashboards**
  - [ ] Subscription metrics
  - [ ] Revenue tracking
  - [ ] Conversion funnel
  - [ ] Error rates

### 🔔 Alerts

- [ ] **Set up critical alerts**
  - [ ] Webhook failures
  - [ ] Payment processing errors
  - [ ] Database connection issues
  - [ ] API downtime

- [ ] **Configure alert channels**
  - [ ] Email notifications
  - [ ] Slack integration
  - [ ] SMS alerts (critical only)
  - [ ] PagerDuty (if applicable)

### 📝 Documentation

- [ ] **Update internal documentation**
  - [ ] Deployment procedures
  - [ ] Troubleshooting guide
  - [ ] API documentation
  - [ ] Database schema

- [ ] **Create runbooks**
  - [ ] Webhook failure recovery
  - [ ] Payment dispute handling
  - [ ] Subscription cancellation
  - [ ] Refund processing

- [ ] **Document support procedures**
  - [ ] How to check subscription status
  - [ ] How to manually upgrade user
  - [ ] How to process refunds
  - [ ] How to handle disputes

### 💼 Business

- [ ] **Legal compliance**
  - [ ] Terms of service updated
  - [ ] Privacy policy includes payment info
  - [ ] Refund policy documented
  - [ ] GDPR compliance verified

- [ ] **Financial setup**
  - [ ] Accounting system integration
  - [ ] Revenue recognition configured
  - [ ] Tax calculation enabled
  - [ ] Invoice generation working

- [ ] **Customer support**
  - [ ] Support team trained
  - [ ] FAQ updated
  - [ ] Help documentation created
  - [ ] Contact methods available

## Deployment Steps

### 1. Pre-Deployment (1 day before)

```bash
# 1. Create production branch
git checkout -b production

# 2. Update environment variables
# Edit .env.production with production values

# 3. Run final tests
npm run test
npm run build

# 4. Review changes
git diff main production
```

### 2. Deployment Day

```bash
# 1. Deploy to production
npm run deploy
# or
vercel --prod
# or your deployment command

# 2. Verify deployment
curl https://yourdomain.com/api/health

# 3. Test webhook endpoint
curl -X POST https://yourdomain.com/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# 4. Monitor logs
# Check your logging service
```

### 3. Post-Deployment (First hour)

- [ ] **Verify all systems operational**
  - [ ] Website loads correctly
  - [ ] API endpoints responding
  - [ ] Database connections working
  - [ ] Webhooks receiving events

- [ ] **Test critical paths**
  - [ ] User can view plans
  - [ ] User can initiate upgrade
  - [ ] Stripe checkout loads
  - [ ] Test payment succeeds

- [ ] **Monitor metrics**
  - [ ] Error rates normal
  - [ ] Response times acceptable
  - [ ] No spike in failed requests
  - [ ] Webhooks processing

### 4. First Week Monitoring

- [ ] **Daily checks**
  - [ ] Review error logs
  - [ ] Check webhook delivery
  - [ ] Monitor conversion rates
  - [ ] Review customer feedback

- [ ] **Weekly review**
  - [ ] Analyze upgrade metrics
  - [ ] Review failed payments
  - [ ] Check support tickets
  - [ ] Optimize as needed

## Rollback Plan

If issues occur:

```bash
# 1. Immediate rollback
git revert HEAD
git push origin main

# 2. Or deploy previous version
vercel rollback

# 3. Notify team
# Send alert to team channels

# 4. Investigate issue
# Review logs and errors

# 5. Fix and redeploy
# Once fixed, deploy again
```

## Success Criteria

✅ **Technical**
- [ ] Zero critical errors in first 24 hours
- [ ] 99.9% uptime
- [ ] < 2 second page load time
- [ ] < 500ms API response time
- [ ] 100% webhook delivery rate

✅ **Business**
- [ ] At least 1 successful upgrade
- [ ] No payment disputes
- [ ] No customer complaints
- [ ] Positive user feedback
- [ ] Revenue tracking accurate

✅ **User Experience**
- [ ] Modal loads in < 1 second
- [ ] Smooth checkout flow
- [ ] Clear success messaging
- [ ] No user confusion
- [ ] Mobile experience excellent

## Emergency Contacts

| Role | Contact | When to Contact |
|------|---------|-----------------|
| Tech Lead | [Name/Email] | Critical bugs |
| DevOps | [Name/Email] | Infrastructure issues |
| Stripe Support | support@stripe.com | Payment issues |
| Database Admin | [Name/Email] | Database problems |
| Customer Support | [Name/Email] | User complaints |

## Post-Launch Optimization

### Week 1
- [ ] Analyze conversion funnel
- [ ] Identify drop-off points
- [ ] Review error patterns
- [ ] Gather user feedback

### Week 2-4
- [ ] A/B test pricing display
- [ ] Optimize loading times
- [ ] Improve error messages
- [ ] Add analytics events

### Month 2-3
- [ ] Add proration support
- [ ] Implement downgrade flow
- [ ] Add annual billing
- [ ] Create comparison tool

## Maintenance Schedule

### Daily
- Check error logs
- Monitor webhook delivery
- Review failed payments

### Weekly
- Analyze metrics
- Review support tickets
- Update documentation

### Monthly
- Security audit
- Performance review
- Cost optimization
- Feature planning

---

## Final Checklist Before Go-Live

- [ ] All tests passing
- [ ] Production keys configured
- [ ] Webhooks working
- [ ] Database migrated
- [ ] Monitoring enabled
- [ ] Alerts configured
- [ ] Team notified
- [ ] Documentation updated
- [ ] Rollback plan ready
- [ ] Support team trained

**Ready to launch? Let's go! 🚀**

---

## Post-Launch Celebration 🎉

Once everything is running smoothly:
- [ ] Celebrate with team
- [ ] Document lessons learned
- [ ] Share success metrics
- [ ] Plan next improvements

**Congratulations on your successful deployment!**

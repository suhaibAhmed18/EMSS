# Payment System Deployment Checklist

Use this checklist to ensure your payment system is properly configured before going live.

## Pre-Deployment Checklist

### Database Setup
- [ ] Run migration: `node scripts/run-migration.js scripts/add-stripe-subscription-field.sql`
- [ ] Verify `stripe_subscription_id` column exists in users table
- [ ] Check database indexes are created
- [ ] Backup database before deployment

### Stripe Configuration
- [ ] Create Stripe account (or use existing)
- [ ] Complete Stripe account verification
- [ ] Get test API keys for development
- [ ] Get live API keys for production
- [ ] Set up webhook endpoint in Stripe dashboard
- [ ] Configure webhook events:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
  - [ ] invoice.payment_failed
- [ ] Copy webhook signing secret

### Environment Variables
- [ ] Set `STRIPE_PUBLISHABLE_KEY` (test for dev, live for prod)
- [ ] Set `STRIPE_SECRET_KEY` (test for dev, live for prod)
- [ ] Set `STRIPE_WEBHOOK_SECRET`
- [ ] Set `NEXT_PUBLIC_APP_URL` to correct domain
- [ ] Verify `RESEND_API_KEY` is set
- [ ] Verify `EMAIL_FROM_ADDRESS` is set

### Code Review
- [ ] Review pricing amounts in `src/app/pricing/page.tsx`
- [ ] Verify redirect URLs in payment flow
- [ ] Check error messages are user-friendly
- [ ] Ensure all console.logs are appropriate for production

### Testing (Development)
- [ ] Test pricing page loads without sidebar
- [ ] Test plan selection and registration
- [ ] Test Stripe Checkout redirect
- [ ] Test payment with test card (4242 4242 4242 4242)
- [ ] Test payment decline (4000 0000 0000 0002)
- [ ] Test webhook receives events (use Stripe CLI)
- [ ] Test subscription status updates in database
- [ ] Test verification email is sent
- [ ] Test email verification link works
- [ ] Test login blocked without payment
- [ ] Test login blocked without email verification
- [ ] Test successful login after payment + verification
- [ ] Test dashboard access after login

### Security Review
- [ ] Webhook signature verification is enabled
- [ ] No sensitive data in client-side code
- [ ] API keys are in environment variables (not hardcoded)
- [ ] HTTPS is enabled (production)
- [ ] Session cookies are secure
- [ ] CORS is properly configured

## Production Deployment Checklist

### Pre-Launch
- [ ] Switch to Stripe live mode keys
- [ ] Update webhook URL to production domain
- [ ] Update `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Enable HTTPS
- [ ] Test with real card (small amount)
- [ ] Verify webhook receives production events
- [ ] Test complete user flow in production
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Set up payment monitoring

### Launch Day
- [ ] Deploy to production
- [ ] Verify all environment variables are set
- [ ] Test pricing page
- [ ] Test registration flow
- [ ] Test payment with real card
- [ ] Verify webhook processes correctly
- [ ] Check email delivery
- [ ] Monitor error logs
- [ ] Monitor Stripe dashboard

### Post-Launch
- [ ] Monitor first few transactions closely
- [ ] Check webhook processing logs
- [ ] Verify email delivery rate
- [ ] Monitor user feedback
- [ ] Check for any error patterns
- [ ] Review Stripe dashboard daily

## Monitoring Checklist

### Daily Checks
- [ ] Check Stripe dashboard for failed payments
- [ ] Review webhook processing logs
- [ ] Check email delivery logs
- [ ] Monitor user registration rate
- [ ] Check for error spikes

### Weekly Checks
- [ ] Review subscription status distribution
- [ ] Check for abandoned carts
- [ ] Review payment decline reasons
- [ ] Analyze conversion rate
- [ ] Check for unusual patterns

### Monthly Checks
- [ ] Review total revenue
- [ ] Analyze churn rate
- [ ] Review failed payment recovery
- [ ] Check subscription renewal rate
- [ ] Update pricing if needed

## Troubleshooting Checklist

### Payment Not Processing
- [ ] Check Stripe API keys are correct
- [ ] Verify webhook secret is set
- [ ] Check webhook endpoint is accessible
- [ ] Review Stripe dashboard for errors
- [ ] Check application logs

### Webhook Issues
- [ ] Verify webhook URL is correct
- [ ] Check webhook signing secret
- [ ] Test webhook with Stripe CLI
- [ ] Review webhook event logs in Stripe
- [ ] Check server logs for errors

### Login Issues
- [ ] Check user subscription_status in database
- [ ] Verify email_verified is true
- [ ] Check session cookies are set
- [ ] Review login API logs
- [ ] Verify user credentials

### Email Issues
- [ ] Check RESEND_API_KEY is valid
- [ ] Verify email service logs
- [ ] Check spam folder
- [ ] Verify email addresses are valid
- [ ] Check email sending limits

## Rollback Plan

If issues occur:

1. **Immediate Actions**
   - [ ] Disable new registrations (if critical)
   - [ ] Switch to maintenance mode
   - [ ] Notify users of issues

2. **Investigation**
   - [ ] Check error logs
   - [ ] Review Stripe dashboard
   - [ ] Check database state
   - [ ] Identify root cause

3. **Resolution**
   - [ ] Fix identified issues
   - [ ] Test fix in staging
   - [ ] Deploy fix to production
   - [ ] Verify fix works
   - [ ] Re-enable registrations

4. **Post-Mortem**
   - [ ] Document what went wrong
   - [ ] Update monitoring
   - [ ] Improve error handling
   - [ ] Update documentation

## Support Resources

### Documentation
- [ ] PAYMENT_QUICK_START.md - Quick setup guide
- [ ] PAYMENT_SETUP_GUIDE.md - Detailed setup
- [ ] PAYMENT_FLOW.md - Flow diagrams
- [ ] PAYMENT_IMPLEMENTATION_SUMMARY.md - Technical details

### External Resources
- [ ] Stripe Documentation: https://stripe.com/docs
- [ ] Stripe Dashboard: https://dashboard.stripe.com
- [ ] Stripe CLI: https://stripe.com/docs/stripe-cli
- [ ] Resend Documentation: https://resend.com/docs

### Contact Information
- [ ] Stripe Support: https://support.stripe.com
- [ ] Your team's support email
- [ ] Emergency contact numbers

## Success Criteria

Your payment system is ready when:

- ✅ All checklist items are completed
- ✅ Test transactions process successfully
- ✅ Webhooks receive and process events
- ✅ Users can complete full registration flow
- ✅ Email verification works
- ✅ Login enforcement works correctly
- ✅ Dashboard access is properly gated
- ✅ Monitoring is in place
- ✅ Team is trained on troubleshooting

## Notes

Use this space for deployment-specific notes:

```
Date: _______________
Deployed by: _______________
Stripe Account: _______________
Production URL: _______________
Webhook URL: _______________
Issues encountered: _______________
Resolution: _______________
```

---

**Remember**: Test thoroughly in development before deploying to production!

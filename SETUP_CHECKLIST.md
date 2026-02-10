# Setup Checklist

## Pre-Deployment Checklist

### Database Setup
- [ ] Run `scripts/add-subscription-fields.sql` in Supabase SQL Editor
- [ ] Verify new columns exist in `users` table
- [ ] Check indexes are created

### Environment Variables
- [ ] Add Stripe test keys to `.env.local`
- [ ] Add Telnyx API key to `.env.local`
- [ ] Verify Resend API key is working
- [ ] Test email delivery

### Testing
- [ ] Test pricing page loads correctly
- [ ] Test plan selection redirects to registration
- [ ] Test registration with all three plans
- [ ] Test payment with Stripe test card
- [ ] Test email verification flow
- [ ] Test login after verification
- [ ] Test phone number assignment
- [ ] Test phone number display in dashboard

### UI/UX Verification
- [ ] Pricing page matches website theme
- [ ] Registration form shows selected plan
- [ ] Payment page displays correctly
- [ ] Success page shows clear instructions
- [ ] Dashboard shows phone number card
- [ ] All buttons and links work
- [ ] Mobile responsive design works

### Security Checks
- [ ] Passwords are hashed
- [ ] Email verification is required
- [ ] Payment uses HTTPS (production)
- [ ] Session cookies are secure
- [ ] No sensitive data in console (production)

## Production Deployment Checklist

### Stripe Configuration
- [ ] Create Stripe production account
- [ ] Get production API keys
- [ ] Set up webhook endpoints
- [ ] Test with real card (small amount)
- [ ] Configure webhook secret
- [ ] Enable required payment methods
- [ ] Set up tax collection (if needed)

### Telnyx Configuration
- [ ] Create Telnyx production account
- [ ] Get production API key
- [ ] Create messaging profile
- [ ] Purchase test phone number
- [ ] Configure connection settings
- [ ] Test SMS sending
- [ ] Set up number pool (if needed)

### Email Configuration
- [ ] Verify Resend production limits
- [ ] Test verification emails
- [ ] Check spam folder delivery
- [ ] Configure custom domain (optional)
- [ ] Set up email templates
- [ ] Test email deliverability

### Database
- [ ] Run production migration
- [ ] Verify indexes are created
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Test database performance

### Security
- [ ] Enable HTTPS
- [ ] Set secure environment variables
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up monitoring
- [ ] Configure error tracking
- [ ] Review security headers

### Monitoring
- [ ] Set up error logging
- [ ] Configure payment alerts
- [ ] Monitor subscription status
- [ ] Track phone number usage
- [ ] Set up uptime monitoring
- [ ] Configure performance monitoring

### Documentation
- [ ] Update README with setup instructions
- [ ] Document API endpoints
- [ ] Create admin guide
- [ ] Write troubleshooting guide
- [ ] Document pricing tiers

### Testing in Production
- [ ] Test complete registration flow
- [ ] Test payment processing
- [ ] Test email verification
- [ ] Test phone number assignment
- [ ] Test error handling
- [ ] Test edge cases
- [ ] Verify analytics tracking

### Launch Preparation
- [ ] Announce pricing to users
- [ ] Prepare support documentation
- [ ] Train support team
- [ ] Set up customer support channels
- [ ] Prepare FAQ
- [ ] Create video tutorials (optional)

## Post-Launch Checklist

### Week 1
- [ ] Monitor error logs daily
- [ ] Check payment success rate
- [ ] Verify email delivery rate
- [ ] Monitor phone number assignment
- [ ] Respond to user feedback
- [ ] Fix critical bugs

### Week 2-4
- [ ] Analyze conversion rates
- [ ] Review pricing effectiveness
- [ ] Optimize payment flow
- [ ] Improve error messages
- [ ] Add requested features
- [ ] Update documentation

### Monthly
- [ ] Review subscription metrics
- [ ] Analyze churn rate
- [ ] Check payment failures
- [ ] Monitor Telnyx usage
- [ ] Review support tickets
- [ ] Plan improvements

## Quick Reference

### Test Cards (Stripe)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

### Test Flow
```
1. http://localhost:3000/pricing
2. Select plan
3. Register
4. Pay with test card
5. Check console for verification link
6. Verify email
7. Login
8. See phone number in dashboard
```

### Important URLs
```
Pricing: /pricing
Register: /auth/register?plan=<plan>
Payment: /auth/payment
Success: /auth/payment-success
Login: /auth/login
Dashboard: /dashboard
```

### Database Query
```sql
SELECT 
  email, 
  subscription_plan, 
  subscription_status, 
  email_verified, 
  telnyx_phone_number
FROM users 
WHERE email = 'test@example.com';
```

### Environment Variables
```env
# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Telnyx
TELNYX_API_KEY=KEY...

# Email
RESEND_API_KEY=re_...
```

## Troubleshooting Quick Fixes

### Payment fails
- Check Stripe API keys
- Verify card details
- Check Stripe dashboard

### No phone number
- Verify email is confirmed
- Check subscription is active
- Check Telnyx API key

### Email not received
- Check spam folder
- Verify Resend API key
- Use resend button

### Login blocked
- Verify email first
- Check subscription status
- Clear cookies and retry

## Support Resources

### Documentation
- PRICING_AND_PAYMENT_SETUP.md
- QUICK_START_PRICING_FLOW.md
- PAYMENT_FLOW_DIAGRAM.md
- IMPLEMENTATION_SUMMARY.md

### External Resources
- Stripe Docs: https://stripe.com/docs
- Telnyx Docs: https://developers.telnyx.com
- Resend Docs: https://resend.com/docs

### Commands
```bash
# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Start production
npm start
```

## Notes

- Always test in development mode first
- Use Stripe test mode before going live
- Monitor logs during initial launch
- Keep documentation updated
- Respond to user feedback quickly
- Plan for scaling

---

**Last Updated**: Implementation Complete
**Status**: Ready for Testing
**Next Step**: Run database migration and test the flow

# Quick Fix Reference - Upgrade Plan Issue

## 🚀 Quick Start

### 1. Restart Your Dev Server
```bash
# Press Ctrl+C to stop
npm run dev
```

### 2. Test Diagnostics
Open in browser: `http://localhost:3000/api/test-upgrade`

Should see: `✅ All checks passed!`

### 3. Test Upgrade Flow
1. Go to Settings → Pricing and Usage
2. Click "Upgrade Plan"
3. Open Console (F12)
4. Select a plan → Click "Upgrade Now"
5. Should redirect to Stripe

---

## 🔍 What Was Fixed

| Issue | Fix | File |
|-------|-----|------|
| Invalid Stripe API version | Changed to `2024-12-18.acacia` | `src/lib/payments/stripe.ts` |
| No error visibility | Added console logging | `SubscriptionUpgradeModal.tsx` |
| Poor error messages | Detailed error handling | `upgrade/route.ts` |
| Redirect failures | Dual redirect method | `SubscriptionUpgradeModal.tsx` |

---

## 🐛 Still Not Working?

### Check Console (F12)
Look for these logs:
```
✅ Loading plans for user: [ID]
✅ Plans loaded: [Array]
✅ Starting upgrade to: [Plan]
✅ API response status: 200
✅ Redirecting to Stripe...
```

### Run Diagnostics
```bash
# In browser:
http://localhost:3000/api/test-upgrade

# Should show:
{
  "summary": ["✅ All checks passed!"]
}
```

### Common Fixes

**No plans showing?**
```sql
-- Run in Supabase SQL Editor:
SELECT * FROM subscription_plans WHERE is_active = true;
-- If empty, run: scripts/setup-subscription-plans.sql
```

**Stripe errors?**
```bash
# Check .env.local has:
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Then restart server!
```

**Function not found?**
```sql
-- Run in Supabase SQL Editor:
\i scripts/add-subscription-upgrade.sql
```

---

## 📋 Test Checklist

- [ ] Dev server restarted
- [ ] Diagnostic endpoint shows ✅
- [ ] Modal opens with plans
- [ ] Console shows logs
- [ ] Redirects to Stripe
- [ ] Can complete payment

---

## 📞 Need Help?

1. Copy console logs (F12 → Console)
2. Copy diagnostic output (`/api/test-upgrade`)
3. Share both outputs

---

## 🎯 Key Files

- `src/components/SubscriptionUpgradeModal.tsx` - Modal UI
- `src/app/api/subscriptions/upgrade/route.ts` - API endpoint
- `src/lib/payments/stripe.ts` - Stripe config
- `src/app/api/test-upgrade/route.ts` - Diagnostics

---

## ⚡ Quick Commands

```bash
# Restart server
npm run dev

# Test Stripe connection
curl https://api.stripe.com/v1/customers -u YOUR_STRIPE_KEY:

# Check environment
echo $STRIPE_SECRET_KEY
```

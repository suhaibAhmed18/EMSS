# Subscription Upgrade - Quick Reference Card

## 🚀 Quick Start (30 seconds)

```bash
# 1. Start dev server
npm run dev

# 2. Start Stripe webhook (new terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. Visit
http://localhost:3000/settings

# 4. Click "Upgrade Plan"

# 5. Test with card: 4242 4242 4242 4242
```

## 📦 What You Got

✅ **SubscriptionUpgradeModal** - Beautiful upgrade modal  
✅ **API Endpoints** - `/api/subscriptions/upgrade` & `/api/subscriptions/plans`  
✅ **Stripe Integration** - Full payment processing  
✅ **Webhook Handler** - Automatic subscription activation  
✅ **Example Components** - Ready-to-use code snippets  
✅ **Documentation** - Complete guides and diagrams  

## 🎯 Use Anywhere

```tsx
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal'

<SubscriptionUpgradeModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  userId={userId}
/>
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `src/components/SubscriptionUpgradeModal.tsx` | Main modal component |
| `src/app/api/subscriptions/upgrade/route.ts` | Upgrade API endpoint |
| `src/app/api/webhooks/stripe/route.ts` | Webhook handler |
| `src/components/settings/PricingAndUsage.tsx` | Settings integration |
| `src/components/examples/UpgradeButtonExample.tsx` | Usage examples |

## 📊 Database

```sql
-- View plans
SELECT * FROM subscription_plans;

-- Check user plan
SELECT subscription_plan, subscription_status 
FROM users WHERE id = 'user-id';

-- Get upgrade options
SELECT * FROM get_available_upgrades('user-id');
```

## 🧪 Test Cards

| Card | Result |
|------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔐 Requires Auth |

## 🎨 Modal Features

- ✅ Shows all plans in grid
- ✅ Highlights current plan
- ✅ Displays price differences
- ✅ Lists all features
- ✅ Smooth animations
- ✅ Mobile responsive
- ✅ Error handling
- ✅ Loading states

## 🔄 Flow

```
User → Modal → Select Plan → Stripe → Pay → Webhook → Success
```

## 📝 Environment Variables

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal won't open | Check userId is set |
| Plans don't load | Verify database function exists |
| Stripe redirect fails | Check Stripe keys |
| Webhook not firing | Run `stripe listen` |
| Payment succeeds but plan not updated | Check webhook logs |

## 📚 Documentation

- **Setup Guide**: `UPGRADE_FLOW_SETUP.md`
- **Technical Docs**: `SUBSCRIPTION_UPGRADE_FLOW.md`
- **Visual Guide**: `UPGRADE_FLOW_DIAGRAM.md`
- **Summary**: `UPGRADE_IMPLEMENTATION_SUMMARY.md`

## 🎯 Common Tasks

### Add Upgrade Button
```tsx
import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal'

function MyComponent() {
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    loadUser()
  }, [])

  return (
    <>
      <button onClick={() => setShowModal(true)}>
        Upgrade Plan
      </button>
      
      <SubscriptionUpgradeModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={userId}
      />
    </>
  )
}
```

### Check User Plan
```tsx
const { data: userData } = await supabase
  .from('users')
  .select('subscription_plan, subscription_status')
  .eq('id', userId)
  .single()

const isPremium = ['professional', 'enterprise'].includes(
  userData?.subscription_plan
)
```

### Lock Feature
```tsx
if (!isPremium) {
  return <FeatureLockedUpgrade featureName="Advanced Analytics" />
}
```

## 🚦 Status Indicators

| Status | Meaning |
|--------|---------|
| `active` | Subscription is active |
| `cancelled` | Subscription cancelled |
| `pending` | Payment pending |
| `inactive` | Subscription expired |

## 💰 Plans

| Plan | Price | Features |
|------|-------|----------|
| Starter | $10/mo | 5K emails, 500 SMS, 1K contacts |
| Professional | $20/mo | 20K emails, 2K SMS, 10K contacts |
| Enterprise | $30/mo | 100K emails, 50K SMS, unlimited |

## 🎉 Success Checklist

- [ ] Modal opens
- [ ] Plans display
- [ ] Can select plan
- [ ] Stripe redirect works
- [ ] Payment succeeds
- [ ] Webhook fires
- [ ] Database updates
- [ ] Success message shows
- [ ] Plan is active

## 📞 Need Help?

1. Check documentation files
2. Review example components
3. Test with Stripe test cards
4. Check webhook logs
5. Verify database schema

## 🔗 Quick Links

- Stripe Dashboard: https://dashboard.stripe.com
- Supabase Dashboard: https://app.supabase.com
- Stripe Test Cards: https://stripe.com/docs/testing
- Stripe CLI: https://stripe.com/docs/stripe-cli

---

**That's it!** You're ready to accept subscription upgrades. 🎊

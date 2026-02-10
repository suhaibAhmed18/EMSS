# Subscription Upgrade Flow

## Overview
This document explains the complete subscription upgrade flow where users can view their current plan, see all available plans, select a plan to upgrade to, complete payment via Stripe, and start using the new plan.

## Components

### 1. SubscriptionUpgradeModal (`components/SubscriptionUpgradeModal.tsx`)
The main modal component that handles the upgrade flow.

**Features:**
- Displays all available subscription plans
- Shows current plan with badge
- Displays price differences between plans
- Shows plan features and benefits
- Handles Stripe checkout integration
- Responsive design with mobile support

**Props:**
```typescript
interface UpgradeModalProps {
  isOpen: boolean;      // Controls modal visibility
  onClose: () => void;  // Callback when modal is closed
  userId: string;       // Current user ID
}
```

**Usage:**
```tsx
import SubscriptionUpgradeModal from '@/components/SubscriptionUpgradeModal'

function MyComponent() {
  const [showModal, setShowModal] = useState(false)
  const [userId, setUserId] = useState('')

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

### 2. PricingAndUsage Component (`src/components/settings/PricingAndUsage.tsx`)
Settings page component that integrates the upgrade modal.

**Features:**
- Shows current plan overview
- Displays usage statistics
- SMS credits tracking
- Add-ons section
- Integrates SubscriptionUpgradeModal

## API Endpoints

### 1. Get Subscription Plans
**Endpoint:** `GET /api/subscriptions/plans`

Returns all active subscription plans.

**Response:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Starter",
      "description": "Perfect for small businesses",
      "price": 10.00,
      "currency": "USD",
      "features": {
        "sms_credits": 500,
        "email_credits": 5000,
        "contacts": 1000,
        "automations": 5,
        "daily_sms_limit": 100,
        "features": ["Feature 1", "Feature 2"]
      }
    }
  ]
}
```

### 2. Create Upgrade Checkout
**Endpoint:** `POST /api/subscriptions/upgrade`

Creates a Stripe checkout session for plan upgrade.

**Request:**
```json
{
  "planName": "Professional",
  "planPrice": 20.00
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### 3. Stripe Webhook
**Endpoint:** `POST /api/webhooks/stripe`

Handles Stripe webhook events to update subscription status.

**Events Handled:**
- `checkout.session.completed` - Activates subscription after payment
- `customer.subscription.updated` - Updates subscription status
- `customer.subscription.deleted` - Handles cancellations

## Database Functions

### get_available_upgrades(p_user_id UUID)
Returns all available plans with comparison to user's current plan.

**Returns:**
```sql
TABLE (
  plan_id UUID,
  plan_name VARCHAR(100),
  plan_description TEXT,
  plan_price DECIMAL(10,2),
  current_plan_price DECIMAL(10,2),
  price_difference DECIMAL(10,2),
  features JSONB,
  is_current_plan BOOLEAN,
  can_upgrade BOOLEAN
)
```

**Usage:**
```sql
SELECT * FROM get_available_upgrades('user-uuid');
```

## User Flow

### Step 1: View Current Plan
User navigates to Settings → Pricing and Usage to see their current plan.

### Step 2: Click Upgrade
User clicks "Upgrade Plan" button to open the SubscriptionUpgradeModal.

### Step 3: View Available Plans
Modal displays all plans in a grid:
- Current plan is highlighted with a badge
- Price differences are shown
- Features are listed for each plan
- Plans are sorted by price

### Step 4: Select Plan
User clicks on a plan card to select it for upgrade.

### Step 5: Review Selection
Modal shows detailed view of selected plan:
- Full price and billing information
- Complete feature list
- Security notice about Stripe redirect

### Step 6: Confirm Upgrade
User clicks "Upgrade Now" button.

### Step 7: Stripe Checkout
User is redirected to Stripe Checkout page to complete payment.

### Step 8: Payment Processing
After successful payment:
1. Stripe sends webhook to `/api/webhooks/stripe`
2. Webhook handler updates user's subscription in database
3. User is redirected back to settings page

### Step 9: Confirmation
User sees success message and their plan is updated.

## Database Schema

### subscription_plans Table
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  features JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### users Table (Subscription Fields)
```sql
-- Subscription-related fields in users table
subscription_status VARCHAR(50),      -- 'active', 'cancelled', 'pending'
subscription_plan VARCHAR(50),        -- 'starter', 'professional', 'enterprise'
subscription_start_date TIMESTAMP,
subscription_end_date TIMESTAMP,
stripe_customer_id VARCHAR(255),
stripe_subscription_id VARCHAR(255)
```

## Environment Variables

Required environment variables:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

### Test the Upgrade Flow

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to Settings:**
   Go to `/settings` and click on "Pricing and Usage"

3. **Click Upgrade Plan:**
   Opens the SubscriptionUpgradeModal

4. **Select a Plan:**
   Click on any plan card (except current plan)

5. **Review and Confirm:**
   Click "Upgrade Now" to proceed to Stripe

6. **Test Payment:**
   Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code

7. **Verify Success:**
   After payment, you should be redirected back with success message

### Test Webhook Locally

Use Stripe CLI to forward webhooks:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Security Considerations

1. **Authentication:** All API endpoints verify user authentication
2. **Stripe Webhook:** Validates webhook signature to prevent tampering
3. **HTTPS Only:** Production should use HTTPS for all transactions
4. **PCI Compliance:** Payment details never touch your server (handled by Stripe)

## Error Handling

The system handles various error scenarios:

1. **Invalid Plan:** Returns 404 if plan doesn't exist
2. **Authentication Failed:** Returns 401 if user not logged in
3. **Payment Failed:** Stripe handles payment errors and shows user-friendly messages
4. **Webhook Errors:** Logged but don't affect user experience

## Future Enhancements

Potential improvements:

1. **Proration:** Calculate and display prorated charges for mid-cycle upgrades
2. **Downgrade Support:** Allow users to downgrade plans
3. **Annual Billing:** Add option for annual subscriptions with discount
4. **Trial Periods:** Implement free trial functionality
5. **Plan Comparison:** Side-by-side plan comparison tool
6. **Usage Alerts:** Notify users when approaching plan limits

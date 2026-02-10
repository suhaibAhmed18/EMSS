# Automation Trigger Fixes

## Quick Fixes to Apply

### Fix 1: Update Trigger Validation List

**File**: `src/lib/automation/trigger-system.ts`

**Line**: 178-186

**Current Code**:
```typescript
const validTriggerTypes = [
  'order_created', 
  'order_paid', 
  'order_updated', 
  'customer_created', 
  'customer_updated', 
  'cart_abandoned'
]
```

**Fixed Code**:
```typescript
// Only include triggers that have webhook handlers or can be manually triggered
const validTriggerTypes = [
  // Shopify webhook triggers (implemented)
  'order_created',      // ✅ orders/create webhook
  'order_paid',         // ✅ orders/paid webhook
  'order_updated',      // ✅ orders/updated webhook
  'customer_created',   // ✅ customers/create webhook
  'customer_updated',   // ✅ customers/update webhook
  
  // Manual/scheduled triggers (can be implemented)
  'cart_abandoned',     // ⚠️ Requires checkout tracking
  'order_refunded',     // Can add orders/refunded webhook
  'order_canceled',     // Can add orders/cancelled webhook
  'order_fulfilled',    // Can add orders/fulfilled webhook
  
  // Email engagement triggers (requires email tracking)
  'opened_message',
  'clicked_message',
  
  // Segment triggers (can be implemented)
  'entered_segment',
  'exited_segment'
]
```

---

### Fix 2: Update UI Trigger Options

**File**: `src/app/automations/create/page.tsx`

**Line**: 24-55

**Current Code**:
```typescript
const TRIGGERS: AutomationTrigger[] = [
  {
    id: 'customer_created',
    name: 'Welcome New Customer',
    description: 'Trigger when a new customer signs up',
    icon: UserPlus,
    category: 'customer'
  },
  {
    id: 'cart_abandoned',
    name: 'Cart Abandoned',
    description: 'Trigger when a customer abandons their cart',
    icon: ShoppingCart,
    category: 'cart'
  },
  {
    id: 'order_placed',  // ❌ Invalid - not in validation
    name: 'Order Placed',
    description: 'Trigger when a customer completes an order',
    icon: DollarSign,
    category: 'order'
  },
  {
    id: 'email_opened',  // ❌ Invalid - not in validation
    name: 'Email Opened',
    description: 'Trigger when a customer opens an email',
    icon: Mail,
    category: 'engagement'
  }
]
```

**Fixed Code**:
```typescript
const TRIGGERS: AutomationTrigger[] = [
  // Customer triggers
  {
    id: 'customer_created',
    name: 'Welcome New Customer',
    description: 'Trigger when a new customer signs up',
    icon: UserPlus,
    category: 'customer'
  },
  {
    id: 'customer_updated',
    name: 'Customer Updated',
    description: 'Trigger when customer information changes',
    icon: UserPlus,
    category: 'customer'
  },
  
  // Order triggers
  {
    id: 'order_created',
    name: 'Order Created',
    description: 'Trigger when a new order is created',
    icon: ShoppingCart,
    category: 'order'
  },
  {
    id: 'order_paid',
    name: 'Order Paid',
    description: 'Trigger when an order is paid',
    icon: DollarSign,
    category: 'order'
  },
  {
    id: 'order_updated',
    name: 'Order Updated',
    description: 'Trigger when an order status changes',
    icon: ShoppingCart,
    category: 'order'
  },
  
  // Cart triggers
  {
    id: 'cart_abandoned',
    name: 'Cart Abandoned',
    description: 'Trigger when a customer abandons their cart (requires setup)',
    icon: ShoppingCart,
    category: 'cart',
    badge: 'Setup Required'  // Add visual indicator
  }
]
```

---

### Fix 3: Add Cart Abandonment Tracking

**File**: `src/lib/shopify/webhook-processor.ts`

**Add after line 72**:

```typescript
case 'checkouts/create':
  return await this.processCheckoutCreated(store.id, payload as any)

case 'checkouts/update':
  return await this.processCheckoutUpdated(store.id, payload as any)
```

**Add new methods after line 250**:

```typescript
/**
 * Process checkout created webhook
 */
private async processCheckoutCreated(storeId: string, checkout: any): Promise<WebhookProcessingResult> {
  try {
    const supabase = await createClient()

    // Store checkout data for abandonment tracking
    const checkoutData = {
      store_id: storeId,
      shopify_checkout_id: checkout.token,
      email: checkout.email,
      cart_token: checkout.cart_token,
      total_price: parseFloat(String(checkout.total_price || '0')),
      currency: checkout.currency,
      created_at_shopify: new Date(checkout.created_at),
      updated_at_shopify: new Date(checkout.updated_at),
      completed_at: checkout.completed_at ? new Date(checkout.completed_at) : null,
      abandoned: false
    }

    // Insert checkout record
    const { error } = await (supabase
      .from('shopify_checkouts') as any)
      .upsert(checkoutData, { 
        onConflict: 'store_id,shopify_checkout_id',
        ignoreDuplicates: false 
      })

    if (error) {
      console.error('Failed to store checkout:', error)
    }

    // Schedule abandonment check (e.g., after 1 hour)
    // This would typically use a job queue or scheduled function
    
    return {
      success: true,
      processed: true,
      data: { checkoutId: checkout.token }
    }
  } catch (error) {
    throw new ShopifyError(
      `Failed to process checkout created: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'WEBHOOK_PROCESSING_ERROR'
    )
  }
}

/**
 * Process checkout updated webhook
 */
private async processCheckoutUpdated(storeId: string, checkout: any): Promise<WebhookProcessingResult> {
  try {
    const supabase = await createClient()

    // Check if checkout was completed (converted to order)
    const isCompleted = checkout.completed_at !== null

    if (isCompleted) {
      // Mark as completed, not abandoned
      await (supabase
        .from('shopify_checkouts') as any)
        .update({
          completed_at: new Date(checkout.completed_at),
          abandoned: false,
          updated_at_shopify: new Date(checkout.updated_at)
        })
        .eq('store_id', storeId)
        .eq('shopify_checkout_id', checkout.token)
    } else {
      // Check if checkout should be marked as abandoned
      const createdAt = new Date(checkout.created_at)
      const now = new Date()
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      if (hoursSinceCreation >= 1) {  // 1 hour threshold
        // Mark as abandoned and trigger automation
        await (supabase
          .from('shopify_checkouts') as any)
          .update({
            abandoned: true,
            updated_at_shopify: new Date(checkout.updated_at)
          })
          .eq('store_id', storeId)
          .eq('shopify_checkout_id', checkout.token)

        // Trigger cart abandonment automation
        await this.triggerAutomations(storeId, 'cart_abandoned', {
          checkout,
          email: checkout.email,
          cart_token: checkout.cart_token,
          total_price: checkout.total_price,
          line_items: checkout.line_items
        })
      }
    }

    return {
      success: true,
      processed: true,
      data: { checkoutId: checkout.token }
    }
  } catch (error) {
    throw new ShopifyError(
      `Failed to process checkout updated: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'WEBHOOK_PROCESSING_ERROR'
    )
  }
}
```

**Note**: You'll also need to create a `shopify_checkouts` table in your database:

```sql
CREATE TABLE shopify_checkouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  shopify_checkout_id TEXT NOT NULL,
  email TEXT,
  cart_token TEXT,
  total_price DECIMAL(10, 2),
  currency TEXT,
  created_at_shopify TIMESTAMP WITH TIME ZONE,
  updated_at_shopify TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  abandoned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, shopify_checkout_id)
);

CREATE INDEX idx_shopify_checkouts_store ON shopify_checkouts(store_id);
CREATE INDEX idx_shopify_checkouts_abandoned ON shopify_checkouts(abandoned, created_at_shopify);
```

---

### Fix 4: Add Trigger Status Indicators

**File**: `src/app/automations/create/page.tsx`

**Update the trigger interface**:

```typescript
interface AutomationTrigger {
  id: string
  name: string
  description: string
  icon: any
  category: string
  status?: 'active' | 'setup_required' | 'coming_soon'  // Add status
  badge?: string  // Add badge text
}
```

**Update trigger rendering**:

```typescript
<button
  key={trigger.id}
  onClick={() => setSelectedTrigger(trigger)}
  disabled={trigger.status === 'coming_soon'}
  className={`text-left p-6 rounded-2xl border transition-all ${
    trigger.status === 'coming_soon' 
      ? 'opacity-50 cursor-not-allowed border-white/5 bg-white/[0.01]'
      : selectedTrigger?.id === trigger.id
        ? 'border-emerald-400 bg-emerald-400/5'
        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
  }`}
>
  <div className="flex items-start justify-between mb-4">
    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
      <Icon className="w-6 h-6 text-emerald-400" />
    </div>
    <div className="flex flex-col gap-1">
      {trigger.badge && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-200 border border-amber-400/20">
          {trigger.badge}
        </span>
      )}
      {selectedTrigger?.id === trigger.id && (
        <Check className="w-5 h-5 text-emerald-400" />
      )}
    </div>
  </div>
  <h3 className="text-white font-semibold mb-2">{trigger.name}</h3>
  <p className="text-white/60 text-sm">{trigger.description}</p>
</button>
```

---

## Summary of Changes

### Files to Modify

1. ✅ `src/lib/automation/trigger-system.ts` - Update validation list
2. ✅ `src/app/automations/create/page.tsx` - Fix UI trigger options
3. ✅ `src/lib/shopify/webhook-processor.ts` - Add cart abandonment handlers
4. ⚠️ Database migration - Add `shopify_checkouts` table

### Testing Checklist

After applying fixes:

- [ ] Test order_created trigger with Shopify webhook
- [ ] Test order_paid trigger with Shopify webhook
- [ ] Test customer_created trigger with Shopify webhook
- [ ] Test customer_updated trigger with Shopify webhook
- [ ] Test order_updated trigger with Shopify webhook
- [ ] Test cart_abandoned trigger (after implementing checkout tracking)
- [ ] Verify UI only shows valid triggers
- [ ] Verify validation accepts all shown triggers
- [ ] Test condition evaluation for each trigger type
- [ ] Test nested field access in conditions

### Deployment Steps

1. Apply database migration for `shopify_checkouts` table
2. Update code files with fixes
3. Register new Shopify webhooks:
   - `checkouts/create`
   - `checkouts/update`
4. Test with Shopify webhook simulator
5. Monitor automation execution logs
6. Update documentation with supported triggers

---

## Additional Recommendations

### 1. Add Trigger Documentation

Create a user-facing document explaining:
- Which triggers are available
- What data each trigger provides
- Example use cases for each trigger
- Setup requirements (e.g., cart abandonment needs checkout tracking)

### 2. Add Trigger Testing Tool

Create an admin endpoint to manually trigger automations for testing:

```typescript
// POST /api/automations/test-trigger
{
  "workflowId": "uuid",
  "triggerType": "order_created",
  "testData": { ... }
}
```

### 3. Add Trigger Analytics

Track trigger performance:
- How many times each trigger fired
- Success/failure rates
- Average execution time
- Most common trigger conditions

### 4. Add Trigger Validation UI

Show validation errors in the UI when creating automations:
- Invalid trigger type
- Invalid conditions
- Missing required fields
- Incompatible action types

---

## Migration Script

If you want to automatically fix existing automations with invalid triggers:

```typescript
// scripts/fix-invalid-triggers.ts
import { createClient } from '@/lib/supabase/server'

async function fixInvalidTriggers() {
  const supabase = await createClient()
  
  // Map old trigger IDs to new ones
  const triggerMap = {
    'order_placed': 'order_created',
    'email_opened': 'opened_message'
  }
  
  for (const [oldTrigger, newTrigger] of Object.entries(triggerMap)) {
    const { data, error } = await supabase
      .from('automation_workflows')
      .update({ trigger_type: newTrigger })
      .eq('trigger_type', oldTrigger)
    
    if (error) {
      console.error(`Failed to update ${oldTrigger}:`, error)
    } else {
      console.log(`Updated ${data?.length || 0} workflows from ${oldTrigger} to ${newTrigger}`)
    }
  }
}

fixInvalidTriggers()
```

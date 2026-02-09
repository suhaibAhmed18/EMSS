# Shopify Scope Verification System

This document explains how the automatic scope verification and reauthorization system works.

## Overview

The system automatically detects when your Shopify app is missing required OAuth scopes and prompts merchants to reauthorize the app with the necessary permissions.

## Required Scopes

The app requires the following Shopify OAuth scopes:
- `read_customers` - Read customer data
- `write_customers` - Create and update customers
- `read_orders` - Read order data
- `read_products` - Read product catalog
- `write_orders` - Create and update orders

## How It Works

### 1. Automatic Detection

The system detects missing scopes in two ways:

**During API Calls:**
When the ShopifyClient makes an API request and receives a 403 error with scope-related message, it automatically:
- Throws a `ScopeVerificationError` with details about the missing permissions
- Includes a reauthorization URL in the error
- Logs the error for monitoring

**Manual Verification:**
You can explicitly verify scopes using:
```typescript
const client = new ShopifyClient(shop, accessToken)
await client.verifyScopes() // Throws ScopeVerificationError if scopes are missing
```

### 2. Reauthorization Flow

When missing scopes are detected:

1. User sees a banner or notification about missing permissions
2. User clicks "Reauthorize App" button
3. User is redirected to Shopify OAuth authorization page
4. Merchant approves the additional permissions
5. User is redirected back to the app with updated scopes
6. App can now access the previously restricted data

## Usage Examples

### In API Routes

```typescript
import { ShopifyClient, ScopeVerificationError } from '@/lib/shopify'

export async function GET(request: NextRequest) {
  try {
    const client = new ShopifyClient(shop, accessToken)
    const customers = await client.getCustomers()
    
    return NextResponse.json({ customers })
  } catch (error) {
    if (error instanceof ScopeVerificationError) {
      return NextResponse.json({
        error: 'Missing permissions',
        message: error.message,
        missingScopes: error.missingScopes,
        reauthorizationUrl: error.reauthorizationUrl,
      }, { status: 403 })
    }
    throw error
  }
}
```

### In React Components

**Using the Banner Component:**
```tsx
import { ScopeVerificationBanner } from '@/components/shopify/ScopeVerificationBanner'

export default function DashboardLayout({ children }) {
  return (
    <div>
      <ScopeVerificationBanner />
      {children}
    </div>
  )
}
```

**Using the Status Component:**
```tsx
import { ShopifyScopeStatus } from '@/components/shopify/ShopifyScopeStatus'

export default function SettingsPage() {
  return (
    <div>
      <h1>Shopify Settings</h1>
      <ShopifyScopeStatus />
    </div>
  )
}
```

**Using the Hook:**
```tsx
import { useShopifyScopes } from '@/hooks/useShopifyScopes'

export function MyComponent() {
  const { scopeStatus, needsReauth, reauthorize } = useShopifyScopes()
  
  if (needsReauth) {
    return (
      <button onClick={reauthorize}>
        Grant Permissions
      </button>
    )
  }
  
  return <div>All permissions granted!</div>
}
```

## API Endpoints

### Check Scope Status
```
GET /api/auth/shopify/verify-scopes
```

**Response:**
```json
{
  "hasStore": true,
  "hasAllScopes": false,
  "grantedScopes": ["read_products", "read_orders"],
  "missingScopes": ["read_customers", "write_customers"],
  "requiresReauth": true,
  "reauthorizationUrl": "https://shop.myshopify.com/admin/oauth/authorize?...",
  "storeName": "My Store",
  "shopDomain": "shop.myshopify.com"
}
```

## Testing

### Test Missing Scopes

1. Install the app with limited scopes
2. Try to access customer data
3. Verify that the error is caught and reauthorization prompt appears
4. Click reauthorize and grant additional scopes
5. Verify that the operation now succeeds

### Manual Testing

```typescript
import { ScopeVerifier } from '@/lib/shopify'

// Check if granted scopes include all required scopes
const result = ScopeVerifier.hasRequiredScopes('read_products,read_orders')
console.log(result.missingScopes) // ['read_customers', 'write_customers', 'write_orders']

// Generate reauthorization URL
const url = ScopeVerifier.generateReauthorizationUrl('shop.myshopify.com')
console.log(url) // OAuth authorization URL
```

## Configuration

The required scopes are defined in `src/lib/shopify/scope-verifier.ts`:

```typescript
private static readonly REQUIRED_SCOPES = [
  'read_customers',
  'write_customers',
  'read_orders',
  'read_products',
  'write_orders',
]
```

To add or remove required scopes, update this array and the `shopify.app.toml` configuration.

## Error Handling

The system provides two custom error types:

**ScopeVerificationError:**
- Thrown when scopes are missing
- Contains `missingScopes` array
- Contains `reauthorizationUrl` for easy redirect

**ShopifyAPIError:**
- Thrown for general API errors
- Enhanced to detect scope-related 403 errors
- Automatically converts to ScopeVerificationError when appropriate

## Best Practices

1. **Show Clear UI Feedback:** Always inform users when permissions are missing
2. **Explain Why:** Tell users what features require the additional permissions
3. **Make It Easy:** Provide a clear "Reauthorize" button
4. **Handle Gracefully:** Don't break the app when scopes are missing
5. **Monitor Errors:** Log scope verification errors for debugging
6. **Test Regularly:** Verify that reauthorization flow works correctly

## Troubleshooting

### Reauthorization URL Not Working
- Verify `SHOPIFY_CLIENT_ID` is set correctly
- Check that `NEXT_PUBLIC_APP_URL` is configured
- Ensure redirect URI is registered in Shopify Partner Dashboard

### Scopes Not Updating After Reauth
- Clear browser cookies and try again
- Check that `shopify.app.toml` has the correct scopes
- Verify the OAuth callback is processing scopes correctly

### False Positives
- The scope verification endpoint may fail if Shopify API is down
- Implement retry logic for transient failures
- Cache scope status to reduce API calls

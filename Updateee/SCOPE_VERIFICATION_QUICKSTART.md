# Shopify Scope Verification - Quick Start

## What Was Added

A complete system to detect and handle missing Shopify OAuth scopes automatically.

## Quick Fix for Your Error

Your error: `403 - This action requires merchant approval for read_customers scope`

**Solution:** The merchant needs to reauthorize the app. Here's how:

### Option 1: Use the UI (Recommended)

Add the banner to your layout:

```tsx
// In your main layout or dashboard
import { ScopeVerificationBanner } from '@/components/shopify/ScopeVerificationBanner'

export default function Layout({ children }) {
  return (
    <>
      <ScopeVerificationBanner />
      {children}
    </>
  )
}
```

The banner will automatically appear when scopes are missing and provide a "Reauthorize App" button.

### Option 2: Manual Reauthorization

1. Go to: `http://localhost:3000/api/auth/shopify/verify-scopes`
2. Copy the `reauthorizationUrl` from the response
3. Visit that URL in your browser
4. Approve the permissions
5. You'll be redirected back to your app

### Option 3: Reinstall the App

1. Uninstall the app from your Shopify store
2. Reinstall it using the OAuth flow
3. All required scopes will be requested

## Files Created

1. **src/lib/shopify/scope-verifier.ts** - Core verification logic
2. **src/app/api/auth/shopify/verify-scopes/route.ts** - API endpoint to check scopes
3. **src/components/shopify/ScopeVerificationBanner.tsx** - Auto-dismissible banner
4. **src/components/shopify/ShopifyScopeStatus.tsx** - Detailed status component
5. **src/hooks/useShopifyScopes.ts** - React hook for scope management

## How It Works

1. **Automatic Detection:** When API calls fail with 403 scope errors, the system catches them
2. **User Notification:** Banner or status component shows missing permissions
3. **Easy Reauth:** One-click button redirects to Shopify for approval
4. **Seamless Return:** After approval, user returns to app with full access

## Testing

```bash
# Check current scope status
curl http://localhost:3000/api/auth/shopify/verify-scopes

# Response will show:
# - hasAllScopes: true/false
# - missingScopes: array of missing permissions
# - reauthorizationUrl: URL to fix the issue
```

## Next Steps

1. Add `<ScopeVerificationBanner />` to your main layout
2. Test by trying to access customer data
3. Click "Reauthorize App" when prompted
4. Approve the permissions in Shopify
5. Verify that customer data now loads successfully

See `SHOPIFY_SCOPE_VERIFICATION.md` for complete documentation.

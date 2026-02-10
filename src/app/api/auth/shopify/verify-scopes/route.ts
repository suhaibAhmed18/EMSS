import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth'
import { db } from '@/lib/db'
import { ScopeVerifier } from '@/lib/shopify/scope-verifier'

/**
 * GET /api/auth/shopify/verify-scopes
 * Check if the connected Shopify store has all required scopes
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the user's Shopify store
    const store = await db.query.shopifyStores.findFirst({
      where: (stores, { eq }) => eq(stores.user_id, user.id),
    })

    if (!store) {
      return NextResponse.json(
        { 
          error: 'No Shopify store connected',
          hasStore: false,
        },
        { status: 404 }
      )
    }

    // Verify scopes
    const scopeResult = await ScopeVerifier.verifyScopes(
      store.shop_domain,
      store.access_token
    )

    // If scopes are missing, generate reauthorization URL
    let reauthorizationUrl: string | undefined
    if (scopeResult.requiresReauth) {
      reauthorizationUrl = ScopeVerifier.generateReauthorizationUrl(store.shop_domain)
    }

    return NextResponse.json({
      hasStore: true,
      hasAllScopes: scopeResult.hasAllScopes,
      grantedScopes: scopeResult.grantedScopes,
      missingScopes: scopeResult.missingScopes,
      requiresReauth: scopeResult.requiresReauth,
      reauthorizationUrl,
      storeName: store.store_name,
      shopDomain: store.shop_domain,
    })
  } catch (error) {
    console.error('Error verifying Shopify scopes:', error)
    return NextResponse.json(
      { 
        error: 'Failed to verify scopes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

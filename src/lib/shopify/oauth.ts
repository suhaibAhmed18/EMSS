import crypto from 'crypto'
import { InvalidShopDomainError, OAuthError } from './types'

interface OAuthParams {
  shop: string
  userId: string
}

interface StateData {
  userId: string
  timestamp: number
}

export class ShopifyOAuth {
  private readonly clientId: string
  private readonly clientSecret: string
  private readonly redirectUri: string
  private readonly scopes: string[]

  constructor() {
    this.clientId = process.env.SHOPIFY_CLIENT_ID!
    this.clientSecret = process.env.SHOPIFY_CLIENT_SECRET!
    
    // Use NEXT_PUBLIC_APP_URL or fallback to localhost for development
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
    this.redirectUri = `${appUrl}/api/auth/shopify/callback`
    
    this.scopes = [
      'read_products',
      'read_orders',
      'read_customers',
      'read_analytics',
      'write_customers'
    ]

    console.log('🔧 Shopify OAuth Config:', {
      clientId: this.clientId ? 'Set' : 'Missing',
      redirectUri: this.redirectUri,
      scopes: this.scopes.length
    })

    if (!this.clientId || !this.clientSecret) {
      console.warn('⚠️ Missing Shopify OAuth credentials - Shopify integration will not work')
      // Don't throw error in development to allow other features to work
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing Shopify OAuth credentials')
      }
    }
  }

  /**
   * Validate shop domain format
   */
  private validateShopDomain(shop: string): string {
    if (!shop) {
      throw new InvalidShopDomainError('Shop domain is required')
    }

    // Remove protocol if present
    shop = shop.replace(/^https?:\/\//, '')
    
    // Add .myshopify.com if not present
    if (!shop.endsWith('.myshopify.com')) {
      shop = `${shop}.myshopify.com`
    }

    // Validate format
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/
    if (!shopRegex.test(shop)) {
      throw new InvalidShopDomainError('Invalid shop domain format')
    }

    return shop
  }

  /**
   * Generate state parameter for OAuth flow
   */
  private generateState(userId: string): string {
    const stateData: StateData = {
      userId,
      timestamp: Date.now()
    }

    const stateString = JSON.stringify(stateData)
    const state = Buffer.from(stateString).toString('base64url')
    
    return state
  }

  /**
   * Verify and decode state parameter
   */
  verifyState(state: string): StateData | null {
    try {
      const stateString = Buffer.from(state, 'base64url').toString('utf-8')
      const stateData: StateData = JSON.parse(stateString)

      // Check if state is not too old (5 minutes)
      const maxAge = 5 * 60 * 1000 // 5 minutes
      if (Date.now() - stateData.timestamp > maxAge) {
        return null
      }

      return stateData
    } catch (error) {
      return null
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(params: OAuthParams): string {
    const shop = this.validateShopDomain(params.shop)
    const state = this.generateState(params.userId)

    const authUrl = new URL(`https://${shop}/admin/oauth/authorize`)
    authUrl.searchParams.set('client_id', this.clientId)
    authUrl.searchParams.set('scope', this.scopes.join(','))
    authUrl.searchParams.set('redirect_uri', this.redirectUri)
    authUrl.searchParams.set('state', state)

    return authUrl.toString()
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(shop: string, code: string): Promise<{
    access_token: string
    scope: string
  }> {
    const validatedShop = this.validateShopDomain(shop)

    try {
      const response = await fetch(`https://${validatedShop}/admin/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
        }),
      })

      if (!response.ok) {
        throw new OAuthError(`Failed to exchange code for token: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data.access_token) {
        throw new OAuthError('No access token received from Shopify')
      }

      return {
        access_token: data.access_token,
        scope: data.scope
      }
    } catch (error) {
      if (error instanceof OAuthError) {
        throw error
      }
      throw new OAuthError(`OAuth token exchange failed: ${error}`)
    }
  }

  /**
   * Verify webhook HMAC signature
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!signature) {
      return false
    }

    // Remove 'sha256=' prefix if present
    const cleanSignature = signature.replace(/^sha256=/, '')
    
    const expectedSignature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(body, 'utf8')
      .digest('base64')

    return crypto.timingSafeEqual(
      Buffer.from(cleanSignature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    )
  }
}

export const shopifyOAuth = new ShopifyOAuth()
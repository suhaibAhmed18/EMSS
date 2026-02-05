// Shopify App authentication utilities
import { NextRequest } from 'next/server'
import crypto from 'crypto'
import { config } from '../config'

export interface ShopifyAppSession {
  shop: string
  accessToken?: string
  isEmbedded: boolean
  host?: string
}

export class ShopifyAppAuth {
  /**
   * Verify Shopify app request authenticity
   */
  static verifyAppRequest(request: NextRequest): boolean {
    const url = new URL(request.url)
    const hmac = url.searchParams.get('hmac')
    const shop = url.searchParams.get('shop')
    const timestamp = url.searchParams.get('timestamp')

    if (!hmac || !shop || !timestamp) {
      return false
    }

    // Check timestamp (within 1 hour)
    const requestTime = parseInt(timestamp)
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime - requestTime > 3600) {
      return false
    }

    // Verify HMAC
    const params = new URLSearchParams(url.search)
    params.delete('hmac')
    params.delete('signature')

    const sortedParams = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('&')

    const expectedHmac = crypto
      .createHmac('sha256', config.shopify.clientSecret)
      .update(sortedParams)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    )
  }

  /**
   * Extract session information from request
   */
  static extractSession(request: NextRequest): ShopifyAppSession | null {
    const url = new URL(request.url)
    const shop = url.searchParams.get('shop')
    const host = url.searchParams.get('host')

    if (!shop) {
      return null
    }

    return {
      shop,
      host: host || undefined,
      isEmbedded: true,
    }
  }

  /**
   * Generate app installation URL
   */
  static generateInstallUrl(shop: string): string {
    const scopes = [
      'read_customers',
      'write_customers',
      'read_orders',
      'read_products',
      'write_orders'
    ].join(',')

    const params = new URLSearchParams({
      client_id: config.shopify.clientId,
      scope: scopes,
      redirect_uri: `${config.app.url}/shopify/auth/callback`,
      state: crypto.randomBytes(16).toString('hex'),
    })

    return `https://${shop}.myshopify.com/admin/oauth/authorize?${params.toString()}`
  }

  /**
   * Validate shop domain format
   */
  static isValidShopDomain(shop: string): boolean {
    const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/
    return shopRegex.test(shop) && shop.length >= 3 && shop.length <= 60
  }

  /**
   * Check if request is from embedded app
   */
  static isEmbeddedRequest(request: NextRequest): boolean {
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    
    // Check for Shopify admin indicators
    return (
      userAgent.includes('Shopify') ||
      referer.includes('myshopify.com/admin') ||
      request.url.includes('embedded=1')
    )
  }
}
// Shopify OAuth scope verification and management

export interface ScopeVerificationResult {
  hasAllScopes: boolean
  missingScopes: string[]
  grantedScopes: string[]
  requiresReauth: boolean
}

export class ScopeVerificationError extends Error {
  constructor(
    message: string,
    public missingScopes: string[],
    public reauthorizationUrl?: string
  ) {
    super(message)
    this.name = 'ScopeVerificationError'
  }
}

export class ScopeVerifier {
  // Required scopes for the application
  private static readonly REQUIRED_SCOPES = [
    'read_customers',
    'write_customers',
    'read_orders',
    'read_products',
    'write_orders',
  ]

  /**
   * Verify if the store has all required scopes
   */
  static async verifyScopes(
    shop: string,
    accessToken: string
  ): Promise<ScopeVerificationResult> {
    try {
      // Make a request to get the current access scopes
      const response = await fetch(
        `https://${shop}/admin/oauth/access_scopes.json`,
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
          },
        }
      )

      if (!response.ok) {
        // If we can't verify scopes, assume they might be missing
        return {
          hasAllScopes: false,
          missingScopes: this.REQUIRED_SCOPES,
          grantedScopes: [],
          requiresReauth: true,
        }
      }

      const data = await response.json()
      const grantedScopes = data.access_scopes?.map((scope: any) => scope.handle) || []

      const missingScopes = this.REQUIRED_SCOPES.filter(
        (scope) => !grantedScopes.includes(scope)
      )

      return {
        hasAllScopes: missingScopes.length === 0,
        missingScopes,
        grantedScopes,
        requiresReauth: missingScopes.length > 0,
      }
    } catch (error) {
      console.error('Failed to verify scopes:', error)
      // On error, assume scopes might be missing
      return {
        hasAllScopes: false,
        missingScopes: this.REQUIRED_SCOPES,
        grantedScopes: [],
        requiresReauth: true,
      }
    }
  }

  /**
   * Parse scopes from a comma-separated string or array
   */
  static parseScopes(scopes: string | string[]): string[] {
    if (Array.isArray(scopes)) {
      return scopes
    }
    return scopes.split(',').map((s) => s.trim())
  }

  /**
   * Check if granted scopes include all required scopes
   */
  static hasRequiredScopes(grantedScopes: string | string[]): ScopeVerificationResult {
    const granted = this.parseScopes(grantedScopes)
    const missing = this.REQUIRED_SCOPES.filter((scope) => !granted.includes(scope))

    return {
      hasAllScopes: missing.length === 0,
      missingScopes: missing,
      grantedScopes: granted,
      requiresReauth: missing.length > 0,
    }
  }

  /**
   * Generate reauthorization URL for missing scopes
   */
  static generateReauthorizationUrl(shop: string, redirectUri?: string): string {
    const clientId = process.env.SHOPIFY_CLIENT_ID
    if (!clientId) {
      throw new Error('SHOPIFY_CLIENT_ID not configured')
    }

    const scopes = this.REQUIRED_SCOPES.join(',')
    const redirect = redirectUri || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/shopify/callback`
    const state = Buffer.from(JSON.stringify({ shop, timestamp: Date.now() })).toString('base64')

    const params = new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirect,
      state,
      grant_options: '[]', // Force reauthorization
    })

    return `https://${shop}/admin/oauth/authorize?${params.toString()}`
  }

  /**
   * Get required scopes list
   */
  static getRequiredScopes(): string[] {
    return [...this.REQUIRED_SCOPES]
  }
}

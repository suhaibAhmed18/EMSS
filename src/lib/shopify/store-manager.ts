import { getSupabaseAdmin } from '@/lib/database/client'
import { shopifyOAuth } from './oauth'
import { multiStoreManager } from '@/lib/stores/multi-store-manager'
import type { ShopifyOAuthCallbackParams, ShopifyStore } from './types'
import { OAuthError, ShopifyError } from './types'

export class ShopifyStoreManager {
  /**
   * Complete OAuth flow and create/update store
   */
  async completeOAuthFlow(
    params: ShopifyOAuthCallbackParams,
    userId: string | null
  ): Promise<ShopifyStore> {
    try {
      // Verify HMAC signature
      const queryString = new URLSearchParams({
        shop: params.shop,
        code: params.code,
        state: params.state,
        timestamp: params.timestamp
      }).toString()

      if (!shopifyOAuth.verifyWebhookSignature(queryString, params.hmac)) {
        throw new OAuthError('Invalid HMAC signature')
      }

      // Exchange code for access token
      const tokenData = await shopifyOAuth.exchangeCodeForToken(params.shop, params.code)

      // Get shop info from Shopify API
      const shopInfo = await this.getShopInfo(params.shop, tokenData.access_token)

      // Create or update store in database
      const store = await this.createOrUpdateStore({
        shop_domain: params.shop,
        access_token: tokenData.access_token,
        scopes: tokenData.scope.split(','),
        user_id: userId === 'anonymous' ? null : userId,
        display_name: shopInfo.name,
        description: shopInfo.description,
        logo_url: shopInfo.logo,
        timezone: shopInfo.timezone,
        currency: shopInfo.currency,
        settings: {
          shop_owner: shopInfo.shop_owner,
          email: shopInfo.email,
          domain: shopInfo.domain,
          created_at: shopInfo.created_at,
          updated_at: shopInfo.updated_at
        }
      })

      // If we have a user, associate them with the store
      if (userId && userId !== 'anonymous') {
        await multiStoreManager.addUserToStore(userId, store.id, 'admin')
      }

      return store
    } catch (error) {
      console.error('OAuth flow completion error:', error)
      if (error instanceof OAuthError || error instanceof ShopifyError) {
        throw error
      }
      throw new ShopifyError(`Failed to complete OAuth flow: ${error}`)
    }
  }

  /**
   * Get shop information from Shopify API
   */
  private async getShopInfo(shop: string, accessToken: string): Promise<{
    name: string
    description: string | null
    logo: string | null
    timezone: string
    currency: string
    shop_owner: string
    email: string
    domain: string
    created_at: string
    updated_at: string
  }> {
    try {
      const response = await fetch(`https://${shop}/admin/api/2023-10/shop.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new ShopifyError(`Failed to fetch shop info: ${response.statusText}`)
      }

      const data = await response.json()
      const shopData = data.shop

      return {
        name: shopData.name || shop,
        description: shopData.description || null,
        logo: shopData.logo || null,
        timezone: shopData.timezone || 'UTC',
        currency: shopData.currency || 'USD',
        shop_owner: shopData.shop_owner || '',
        email: shopData.email || '',
        domain: shopData.domain || shop,
        created_at: shopData.created_at || new Date().toISOString(),
        updated_at: shopData.updated_at || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching shop info:', error)
      // Return default values if API call fails
      return {
        name: shop,
        description: null,
        logo: null,
        timezone: 'UTC',
        currency: 'USD',
        shop_owner: '',
        email: '',
        domain: shop,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  }

  /**
   * Create or update store in database
   */
  private async createOrUpdateStore(storeData: {
    shop_domain: string
    access_token: string
    scopes: string[]
    user_id: string | null
    display_name: string | null
    description: string | null
    logo_url: string | null
    timezone: string
    currency: string
    settings: Record<string, unknown>
  }): Promise<ShopifyStore> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      // Check if store already exists
      const { data: existingStore } = await (supabaseAdmin
        .from('stores') as any)
        .select('*')
        .eq('shop_domain', storeData.shop_domain)
        .single()

      if (existingStore) {
        // Update existing store
        const { data: updatedStore, error } = await (supabaseAdmin
          .from('stores') as any)
          .update({
            access_token: storeData.access_token,
            scopes: storeData.scopes,
            display_name: storeData.display_name,
            description: storeData.description,
            logo_url: storeData.logo_url,
            timezone: storeData.timezone,
            currency: storeData.currency,
            settings: storeData.settings,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', (existingStore as any).id)
          .select()
          .single()

        if (error) {
          throw new ShopifyError(`Failed to update store: ${error.message}`)
        }

        return updatedStore as ShopifyStore
      } else {
        // Create new store
        const { data: newStore, error } = await (supabaseAdmin
          .from('stores') as any)
          .insert({
            shop_domain: storeData.shop_domain,
            access_token: storeData.access_token,
            scopes: storeData.scopes,
            user_id: storeData.user_id,
            display_name: storeData.display_name,
            description: storeData.description,
            logo_url: storeData.logo_url,
            is_active: true,
            plan_type: 'free',
            subscription_status: 'active',
            timezone: storeData.timezone,
            currency: storeData.currency,
            settings: storeData.settings
          })
          .select()
          .single()

        if (error) {
          throw new ShopifyError(`Failed to create store: ${error.message}`)
        }

        return newStore as ShopifyStore
      }
    } catch (error) {
      console.error('Database error creating/updating store:', error)
      if (error instanceof ShopifyError) {
        throw error
      }
      throw new ShopifyError(`Database operation failed: ${error}`)
    }
  }

  /**
   * Get store by shop domain
   */
  async getStoreByDomain(shopDomain: string): Promise<ShopifyStore | null> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      const { data, error } = await (supabaseAdmin
        .from('stores') as any)
        .select('*')
        .eq('shop_domain', shopDomain)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Store not found
        }
        throw new ShopifyError(`Failed to get store: ${error.message}`)
      }

      return data as ShopifyStore
    } catch (error) {
      console.error('Error getting store by domain:', error)
      if (error instanceof ShopifyError) {
        throw error
      }
      throw new ShopifyError(`Failed to get store: ${error}`)
    }
  }

  /**
   * Get stores for user
   */
  async getStoresForUser(userId: string): Promise<ShopifyStore[]> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      // First try the user_stores junction table (multi-store support)
      const { data: userStoresData, error: userStoresError } = await supabaseAdmin
        .from('user_stores')
        .select(`
          stores (*)
        `)
        .eq('user_id', userId)

      // If user_stores table exists and has data, use it
      if (!userStoresError && userStoresData && userStoresData.length > 0) {
        return userStoresData.map(item => (item as any).stores as ShopifyStore)
      }

      // Fallback to direct user_id relationship in stores table
      const { data: storesData, error: storesError } = await (supabaseAdmin
        .from('stores') as any)
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (storesError) {
        throw new ShopifyError(`Failed to get user stores: ${storesError.message}`)
      }

      return storesData as ShopifyStore[] || []
    } catch (error) {
      console.error('Error getting stores for user:', error)
      if (error instanceof ShopifyError) {
        throw error
      }
      throw new ShopifyError(`Failed to get user stores: ${error}`)
    }
  }

  /**
   * Update store access token
   */
  async updateStoreAccessToken(storeId: string, accessToken: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      const { error } = await (supabaseAdmin
        .from('stores') as any)
        .update({
          access_token: accessToken,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)

      if (error) {
        throw new ShopifyError(`Failed to update access token: ${error.message}`)
      }
    } catch (error) {
      console.error('Error updating store access token:', error)
      if (error instanceof ShopifyError) {
        throw error
      }
      throw new ShopifyError(`Failed to update access token: ${error}`)
    }
  }

  /**
   * Deactivate store
   */
  async deactivateStore(storeId: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      const { error } = await (supabaseAdmin
        .from('stores') as any)
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', storeId)

      if (error) {
        throw new ShopifyError(`Failed to deactivate store: ${error.message}`)
      }
    } catch (error) {
      console.error('Error deactivating store:', error)
      if (error instanceof ShopifyError) {
        throw error
      }
      throw new ShopifyError(`Failed to deactivate store: ${error}`)
    }
  }

  /**
   * Delete store and all associated data
   * This will cascade delete all related data due to foreign key constraints
   */
  async deleteStore(storeId: string): Promise<void> {
    const supabaseAdmin = getSupabaseAdmin()

    try {
      // Delete the store - this will cascade delete all related data
      // due to ON DELETE CASCADE constraints in the database schema
      const { error } = await (supabaseAdmin
        .from('stores') as any)
        .delete()
        .eq('id', storeId)

      if (error) {
        throw new ShopifyError(`Failed to delete store: ${error.message}`)
      }

      console.log(`Store ${storeId} and all associated data deleted successfully`)
    } catch (error) {
      console.error('Error deleting store:', error)
      if (error instanceof ShopifyError) {
        throw error
      }
      throw new ShopifyError(`Failed to delete store: ${error}`)
    }
  }
}

export const shopifyStoreManager = new ShopifyStoreManager()
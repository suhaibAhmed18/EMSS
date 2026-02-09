// Shopify API client
import { 
  type ShopifyCustomer,
  type ShopifyOrder,
  type ShopifyProduct,
  type ShopifyWebhook
} from './types'
import { ShopifyAPIError, RetryManager, errorLogger } from '../error-handling'
import { ScopeVerifier, ScopeVerificationError } from './scope-verifier'

interface PaginationInfo {
  hasNext: boolean
  hasPrevious: boolean
  nextPageInfo?: string
  previousPageInfo?: string
}

interface StoreMetrics {
  customerCount: number
  orderCount: number
  totalRevenue: number
  averageOrderValue: number
  lastOrderDate?: Date
}

export class ShopifyClient {
  private shop: string
  private accessToken: string
  private apiVersion: string = '2024-01'
  private scopesVerified: boolean = false

  constructor(shop: string, accessToken: string) {
    this.shop = shop
    this.accessToken = accessToken
  }

  /**
   * Verify that the store has all required OAuth scopes
   */
  async verifyScopes(): Promise<void> {
    if (this.scopesVerified) {
      return // Already verified
    }

    const result = await ScopeVerifier.verifyScopes(this.shop, this.accessToken)
    
    if (!result.hasAllScopes) {
      const reauthorizationUrl = ScopeVerifier.generateReauthorizationUrl(this.shop)
      throw new ScopeVerificationError(
        `Missing required scopes: ${result.missingScopes.join(', ')}. Please reauthorize the app.`,
        result.missingScopes,
        reauthorizationUrl
      )
    }

    this.scopesVerified = true
  }

  /**
   * Make authenticated request to Shopify API with retry logic
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return RetryManager.withRetry(async () => {
      const url = `https://${this.shop}.myshopify.com/admin/api/${this.apiVersion}/${endpoint}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'X-Shopify-Access-Token': this.accessToken,
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        
        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After')
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000
          const error = new ShopifyAPIError(
            `Rate limited. Retry after ${delay}ms`,
            response.status,
            delay,
            { additionalData: { endpoint, shop: this.shop } }
          )
          await errorLogger.logError(error)
          throw error
        }

        // Handle scope permission errors (403)
        if (response.status === 403 && errorText.includes('scope')) {
          const reauthorizationUrl = ScopeVerifier.generateReauthorizationUrl(this.shop)
          const error = new ScopeVerificationError(
            `Missing required permissions. Please reauthorize the app to grant necessary scopes.`,
            [], // We don't know exact missing scopes from 403
            reauthorizationUrl
          )
          await errorLogger.logError(error)
          throw error
        }
        
        const error = new ShopifyAPIError(
          `Shopify API error: ${response.status} ${response.statusText} - ${errorText}`,
          response.status,
          undefined,
          { additionalData: { endpoint, shop: this.shop, errorText } }
        )
        await errorLogger.logError(error)
        throw error
      }

      return response.json()
    }, RetryManager.createOptionsForErrorType('api')).then(result => {
      if (!result.success) {
        throw result.error || new Error('Request failed after retries')
      }
      return result.data!
    })
  }

  /**
   * Parse pagination info from Link header
   */
  private parsePaginationInfo(linkHeader: string | null): PaginationInfo {
    const info: PaginationInfo = {
      hasNext: false,
      hasPrevious: false,
    }

    if (!linkHeader) return info

    const links = linkHeader.split(',')
    
    for (const link of links) {
      const match = link.match(/<([^>]+)>;\s*rel="([^"]+)"/)
      if (match) {
        const [, url, rel] = match
        const urlObj = new URL(url)
        const pageInfo = urlObj.searchParams.get('page_info')
        
        if (rel === 'next' && pageInfo) {
          info.hasNext = true
          info.nextPageInfo = pageInfo
        } else if (rel === 'previous' && pageInfo) {
          info.hasPrevious = true
          info.previousPageInfo = pageInfo
        }
      }
    }

    return info
  }

  /**
   * Make request with pagination support
   */
  private async makeRequestWithPagination<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ data: T; pagination: PaginationInfo }> {
    const url = `https://${this.shop}.myshopify.com/admin/api/${this.apiVersion}/${endpoint}`
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'X-Shopify-Access-Token': this.accessToken,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      const error = new ShopifyAPIError(
        `Shopify API error: ${response.status} ${response.statusText} - ${errorText}`,
        response.status,
        undefined,
        { additionalData: { endpoint, shop: this.shop, errorText } }
      )
      await errorLogger.logError(error)
      throw error
    }

    const data = await response.json()
    const pagination = this.parsePaginationInfo(response.headers.get('Link'))

    return { data, pagination }
  }

  /**
   * Get store information
   */
  async getShop() {
    return this.makeRequest('shop.json')
  }

  /**
   * Get customers with pagination
   */
  async getCustomers(limit: number = 250, pageInfo?: string): Promise<{ customers: ShopifyCustomer[]; pagination: PaginationInfo }> {
    let endpoint = `customers.json?limit=${limit}`
    if (pageInfo) {
      endpoint += `&page_info=${pageInfo}`
    }

    const { data, pagination } = await this.makeRequestWithPagination<{ customers: ShopifyCustomer[] }>(endpoint)
    
    return {
      customers: data.customers,
      pagination,
    }
  }

  /**
   * Get all customers with automatic pagination
   */
  async getAllCustomers(): Promise<ShopifyCustomer[]> {
    const allCustomers: ShopifyCustomer[] = []
    let pageInfo: string | undefined

    do {
      const result = await this.getCustomers(250, pageInfo)
      allCustomers.push(...result.customers)
      pageInfo = result.pagination.nextPageInfo
    } while (pageInfo)

    return allCustomers
  }

  /**
   * Get customer by ID
   */
  async getCustomer(customerId: number): Promise<ShopifyCustomer> {
    const response = await this.makeRequest<{ customer: ShopifyCustomer }>(`customers/${customerId}.json`)
    return response.customer
  }

  /**
   * Get orders with pagination
   */
  async getOrders(limit: number = 250, pageInfo?: string, status: string = 'any'): Promise<{ orders: ShopifyOrder[]; pagination: PaginationInfo }> {
    let endpoint = `orders.json?limit=${limit}&status=${status}`
    if (pageInfo) {
      endpoint += `&page_info=${pageInfo}`
    }

    const { data, pagination } = await this.makeRequestWithPagination<{ orders: ShopifyOrder[] }>(endpoint)
    
    return {
      orders: data.orders,
      pagination,
    }
  }

  /**
   * Get all orders with automatic pagination
   */
  async getAllOrders(status: string = 'any'): Promise<ShopifyOrder[]> {
    const allOrders: ShopifyOrder[] = []
    let pageInfo: string | undefined

    do {
      const result = await this.getOrders(250, pageInfo, status)
      allOrders.push(...result.orders)
      pageInfo = result.pagination.nextPageInfo
    } while (pageInfo)

    return allOrders
  }

  /**
   * Get orders since a specific date
   */
  async getOrdersSince(since: Date, status: string = 'any'): Promise<ShopifyOrder[]> {
    const sinceParam = since.toISOString()
    let endpoint = `orders.json?status=${status}&created_at_min=${sinceParam}&limit=250`
    
    const allOrders: ShopifyOrder[] = []
    let pageInfo: string | undefined

    do {
      if (pageInfo) {
        endpoint = `orders.json?status=${status}&created_at_min=${sinceParam}&limit=250&page_info=${pageInfo}`
      }
      
      const { data, pagination } = await this.makeRequestWithPagination<{ orders: ShopifyOrder[] }>(endpoint)
      allOrders.push(...data.orders)
      pageInfo = pagination.nextPageInfo
    } while (pageInfo)

    return allOrders
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: number): Promise<ShopifyOrder> {
    const response = await this.makeRequest<{ order: ShopifyOrder }>(`orders/${orderId}.json`)
    return response.order
  }

  /**
   * Get products with pagination
   */
  async getProducts(limit: number = 250, pageInfo?: string): Promise<{ products: ShopifyProduct[]; pagination: PaginationInfo }> {
    let endpoint = `products.json?limit=${limit}`
    if (pageInfo) {
      endpoint += `&page_info=${pageInfo}`
    }

    const { data, pagination } = await this.makeRequestWithPagination<{ products: ShopifyProduct[] }>(endpoint)
    
    return {
      products: data.products,
      pagination,
    }
  }

  /**
   * Get all products with automatic pagination
   */
  async getAllProducts(): Promise<ShopifyProduct[]> {
    const allProducts: ShopifyProduct[] = []
    let pageInfo: string | undefined

    do {
      const result = await this.getProducts(250, pageInfo)
      allProducts.push(...result.products)
      pageInfo = result.pagination.nextPageInfo
    } while (pageInfo)

    return allProducts
  }

  /**
   * Get store metrics
   */
  async getStoreMetrics(): Promise<StoreMetrics> {
    try {
      // Get customer count
      const customersCountResponse = await this.makeRequest<{ count: number }>('customers/count.json')
      const customerCount = customersCountResponse.count || 0

      // Get order count
      const ordersCountResponse = await this.makeRequest<{ count: number }>('orders/count.json')
      const orderCount = ordersCountResponse.count || 0

      // Calculate total revenue and average order value
      let totalRevenue = 0
      let lastOrderDate: Date | undefined

      if (orderCount > 0) {
        // Get recent orders to calculate metrics (last 250 orders)
        const recentOrdersResult = await this.getOrders(250)
        
        totalRevenue = recentOrdersResult.orders.reduce((sum, order) => {
          return sum + parseFloat(String(order.total_price || '0'))
        }, 0)

        // Find most recent order
        if (recentOrdersResult.orders.length > 0) {
          const sortedOrders = recentOrdersResult.orders.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          lastOrderDate = new Date(sortedOrders[0].created_at)
        }
      }

      const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0

      return {
        customerCount,
        orderCount,
        totalRevenue,
        averageOrderValue,
        lastOrderDate,
      }
    } catch (error) {
      const shopifyError = new ShopifyAPIError(
        `Failed to get store metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        undefined,
        undefined,
        { additionalData: { shop: this.shop } }
      )
      await errorLogger.logError(shopifyError)
      throw shopifyError
    }
  }

  /**
   * Create webhook
   */
  async createWebhook(topic: string, address: string): Promise<ShopifyWebhook> {
    const response = await this.makeRequest<{ webhook: ShopifyWebhook }>('webhooks.json', {
      method: 'POST',
      body: JSON.stringify({
        webhook: {
          topic,
          address,
          format: 'json',
        },
      }),
    })
    return response.webhook
  }

  /**
   * Get webhooks
   */
  async getWebhooks(): Promise<ShopifyWebhook[]> {
    const response = await this.makeRequest<{ webhooks: ShopifyWebhook[] }>('webhooks.json')
    return response.webhooks
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: number): Promise<void> {
    await this.makeRequest(`webhooks/${webhookId}.json`, {
      method: 'DELETE',
    })
  }

  /**
   * Subscribe to required webhooks
   */
  async subscribeToWebhooks(baseUrl: string): Promise<ShopifyWebhook[]> {
    const requiredWebhooks = [
      'orders/create',
      'orders/paid',
      'orders/updated',
      'customers/create',
      'customers/update',
    ]

    const webhooks: ShopifyWebhook[] = []
    const existingWebhooks = await this.getWebhooks()

    for (const topic of requiredWebhooks) {
      try {
        // Check if webhook already exists
        const existing = existingWebhooks.find(w => 
          w.topic === topic && w.address === `${baseUrl}/api/webhooks/shopify`
        )

        if (existing) {
          console.log(`Webhook for ${topic} already exists`)
          webhooks.push(existing)
          continue
        }

        // Create new webhook
        const webhook = await this.createWebhook(topic, `${baseUrl}/api/webhooks/shopify`)
        webhooks.push(webhook)
        console.log(`Created webhook for ${topic}`)
      } catch (error) {
        console.error(`Failed to create webhook for ${topic}:`, error)
        // Continue with other webhooks even if one fails
      }
    }

    return webhooks
  }

  /**
   * Unsubscribe from all webhooks
   */
  async unsubscribeFromWebhooks(): Promise<void> {
    try {
      const webhooks = await this.getWebhooks()
      
      for (const webhook of webhooks) {
        try {
          await this.deleteWebhook(parseInt(webhook.id))
          console.log(`Deleted webhook ${webhook.id} for topic ${webhook.topic}`)
        } catch (error) {
          console.error(`Failed to delete webhook ${webhook.id}:`, error)
        }
      }
    } catch (error) {
      console.error('Failed to get webhooks for deletion:', error)
    }
  }

  /**
   * Verify webhook subscription status
   */
  async verifyWebhookSubscriptions(baseUrl: string): Promise<{
    subscribed: string[]
    missing: string[]
    total: number
  }> {
    const requiredWebhooks = [
      'orders/create',
      'orders/paid', 
      'orders/updated',
      'customers/create',
      'customers/update',
    ]

    try {
      const existingWebhooks = await this.getWebhooks()
      const subscribedTopics = existingWebhooks
        .filter(w => w.address === `${baseUrl}/api/webhooks/shopify`)
        .map(w => w.topic)

      const missing = requiredWebhooks.filter(topic => !subscribedTopics.includes(topic))

      return {
        subscribed: subscribedTopics,
        missing,
        total: existingWebhooks.length,
      }
    } catch (error) {
      console.error('Failed to verify webhook subscriptions:', error)
      return {
        subscribed: [],
        missing: requiredWebhooks,
        total: 0,
      }
    }
  }
}
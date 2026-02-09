// Shopify-specific types and errors

export class ShopifyError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'ShopifyError'
  }
}

export class InvalidShopDomainError extends ShopifyError {
  constructor(message: string) {
    super(message, 'INVALID_SHOP_DOMAIN')
    this.name = 'InvalidShopDomainError'
  }
}

export class OAuthError extends ShopifyError {
  constructor(message: string) {
    super(message, 'OAUTH_ERROR')
    this.name = 'OAuthError'
  }
}

export class APIError extends ShopifyError {
  constructor(message: string, public statusCode?: number) {
    super(message, 'API_ERROR')
    this.name = 'APIError'
  }
}

export interface ShopifyOAuthCallbackParams {
  shop: string
  code: string
  state: string
  hmac: string
  timestamp: string
}

export interface ShopifyStore {
  id: string
  shop_domain: string
  access_token: string
  scopes: string[]
  user_id: string | null
  display_name: string | null
  description: string | null
  logo_url: string | null
  is_active: boolean
  plan_type: 'free' | 'starter' | 'professional' | 'enterprise'
  subscription_status: 'active' | 'cancelled' | 'past_due' | 'unpaid'
  timezone: string
  currency: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ShopifyProduct {
  id: string
  store_id: string
  shopify_product_id: string
  title: string
  description: string | null
  vendor: string | null
  product_type: string | null
  handle: string
  status: 'active' | 'archived' | 'draft'
  tags: string[]
  images: string[]
  variants: ShopifyVariant[]
  created_at: string
  updated_at: string
}

export interface ShopifyVariant {
  id: string
  shopify_variant_id: string
  title: string
  price: number
  compare_at_price: number | null
  sku: string | null
  inventory_quantity: number
  weight: number | null
  weight_unit: string | null
}

export interface ShopifyOrder {
  id: string
  store_id: string
  shopify_order_id: string
  order_number: string
  email: string | null
  phone: string | null
  total_price: number
  subtotal_price: number
  tax_price: number
  shipping_price: number
  currency: string
  financial_status: string
  fulfillment_status: string | null
  customer_id: string | null
  billing_address: ShopifyAddress | null
  shipping_address: ShopifyAddress | null
  line_items: ShopifyLineItem[]
  created_at: string
  updated_at: string
}

export interface ShopifyAddress {
  first_name: string | null
  last_name: string | null
  company: string | null
  address1: string | null
  address2: string | null
  city: string | null
  province: string | null
  country: string | null
  zip: string | null
  phone: string | null
}

export interface ShopifyLineItem {
  id: string
  shopify_line_item_id: string
  product_id: string | null
  variant_id: string | null
  title: string
  quantity: number
  price: number
  total_discount: number
  sku: string | null
}

export interface ShopifyCustomer {
  id: string
  store_id: string
  shopify_customer_id: string
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  accepts_marketing: boolean
  accepts_marketing_updated_at: string | null
  marketing_opt_in_level: string | null
  orders_count: number
  total_spent: number
  tags: string[]
  addresses: ShopifyAddress[]
  created_at: string
  updated_at: string
}

export interface ShopifyWebhook {
  id: string
  store_id: string
  shopify_webhook_id: string
  topic: string
  address: string
  format: 'json' | 'xml'
  created_at: string
  updated_at: string
}
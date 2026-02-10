/**
 * Type Helper Utilities
 * 
 * This file provides type-safe helpers for database operations
 * and reduces the use of 'any' types throughout the codebase.
 */

import type { Database } from './supabase-types'
import type { PostgrestError, PostgrestResponse, PostgrestSingleResponse } from '@supabase/supabase-js'

// ============================================================================
// Database Table Types
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row']

export type Inserts<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert']

export type Updates<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update']

// ============================================================================
// Database Result Types
// ============================================================================

export type DatabaseResult<T> = {
  data: T | null
  error: PostgrestError | null
}

export type DatabaseListResult<T> = {
  data: T[] | null
  error: PostgrestError | null
  count?: number | null
}

export type DatabaseSingleResult<T> = {
  data: T | null
  error: PostgrestError | null
}

// ============================================================================
// Extended Table Types (with additional fields not in schema)
// ============================================================================

export type UserWithSubscription = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  name: string | null
  password_hash: string
  email_verified: boolean
  created_at: string
  updated_at: string
  // Extended fields
  subscription_status?: string | null
  subscription_plan?: string | null
  payment_id?: string | null
  telnyx_phone_number?: string | null
}

export type StoreWithDetails = {
  id: string
  shop_domain: string
  access_token: string
  scopes: string[]
  user_id: string | null
  display_name: string | null
  description: string | null
  logo_url: string | null
  is_active: boolean
  installed_at: string
  uninstalled_at: string | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  // Extended fields
  store_name?: string | null
  store_email?: string | null
  currency?: string | null
  timezone?: string | null
  plan_name?: string | null
}

export type OrderWithAttribution = {
  id: string
  store_id: string
  shopify_order_id: string
  contact_id: string | null
  order_number: string
  total_price: number
  currency: string
  financial_status: string
  fulfillment_status: string | null
  created_at_shopify: string
  updated_at_shopify: string
  created_at: string
  updated_at: string
  // Extended fields
  attributed_campaign_id?: string | null
  attributed_campaign_type?: 'email' | 'sms' | 'automation' | null
}

export type ContactWithConsent = {
  id: string
  store_id: string
  email: string
  phone: string | null
  first_name: string | null
  last_name: string | null
  shopify_customer_id: string | null
  tags: string[]
  segments: string[]
  email_consent: boolean
  sms_consent: boolean
  total_spent: number
  order_count: number
  last_order_at: string | null
  created_at: string
  updated_at: string
}

export type CampaignWithStats = {
  id: string
  store_id: string
  name: string
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
  scheduled_at: string | null
  sent_at: string | null
  recipient_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  created_at: string
  updated_at: string
  // Extended fields
  conversion_count?: number
  cost?: number
}

// ============================================================================
// Query Filter Types
// ============================================================================

export type FilterOperator = 
  | 'eq' 
  | 'neq' 
  | 'gt' 
  | 'gte' 
  | 'lt' 
  | 'lte' 
  | 'like' 
  | 'ilike' 
  | 'in' 
  | 'is' 
  | 'contains' 
  | 'containedBy'

export type QueryFilter = {
  field: string
  operator: FilterOperator
  value: unknown
}

export type PaginationOptions = {
  page?: number
  pageSize?: number
  offset?: number
  limit?: number
}

export type SortOptions = {
  column: string
  ascending?: boolean
}

// ============================================================================
// Type Guards
// ============================================================================

export function isDatabaseError(result: unknown): result is { error: PostgrestError } {
  return (
    typeof result === 'object' &&
    result !== null &&
    'error' in result &&
    result.error !== null
  )
}

export function hasDatabaseData<T>(result: DatabaseResult<T>): result is { data: T; error: null } {
  return result.data !== null && result.error === null
}

export function isUserWithSubscription(user: unknown): user is UserWithSubscription {
  return (
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    'email' in user &&
    'password_hash' in user
  )
}

export function isStoreWithDetails(store: unknown): store is StoreWithDetails {
  return (
    typeof store === 'object' &&
    store !== null &&
    'id' in store &&
    'shop_domain' in store &&
    'access_token' in store
  )
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Type-safe way to handle database query results
 */
export function unwrapDatabaseResult<T>(
  result: DatabaseResult<T>,
  defaultValue?: T
): T {
  if (result.error) {
    throw new Error(`Database error: ${result.error.message}`)
  }
  if (result.data === null) {
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error('No data returned from database')
  }
  return result.data
}

/**
 * Type-safe way to handle database list results
 */
export function unwrapDatabaseListResult<T>(
  result: DatabaseListResult<T>,
  defaultValue: T[] = []
): T[] {
  if (result.error) {
    throw new Error(`Database error: ${result.error.message}`)
  }
  return result.data ?? defaultValue
}

/**
 * Type assertion helper for Supabase query results
 */
export function assertType<T>(value: unknown): T {
  return value as T
}

/**
 * Safe type casting with validation
 */
export function safeCast<T>(value: unknown, validator: (v: unknown) => v is T): T | null {
  return validator(value) ? value : null
}

// ============================================================================
// JSON Types
// ============================================================================

export type JsonValue = 
  | string 
  | number 
  | boolean 
  | null 
  | JsonValue[] 
  | { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue }

export type JsonArray = JsonValue[]

// ============================================================================
// API Response Types
// ============================================================================

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type ApiListResponse<T> = ApiResponse<T[]> & {
  total?: number
  page?: number
  pageSize?: number
}

// ============================================================================
// Encryption Types
// ============================================================================

export type EncryptedData = {
  encrypted: string
  iv: string
  tag: string
}

export type DecryptedData = string

// ============================================================================
// Export all types
// ============================================================================

export type {
  Database,
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
}

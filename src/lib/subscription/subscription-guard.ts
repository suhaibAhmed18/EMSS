/**
 * Subscription Guard Utility
 * Centralized subscription validation to prevent expired users from using premium features
 */

import { getSupabaseAdmin } from '@/lib/database/client'

export interface SubscriptionStatus {
  isActive: boolean
  isExpired: boolean
  expiresAt: string | null
  plan: string
  needsUpgrade: boolean
}

/**
 * Check if a user's subscription is active and not expired
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  const supabase = getSupabaseAdmin()
  
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status, subscription_expires_at')
    .eq('id', userId)
    .single()

  const isExpired = userData?.subscription_expires_at 
    ? new Date(userData.subscription_expires_at) < new Date()
    : false

  const isActive = userData?.subscription_status === 'active' && !isExpired

  return {
    isActive,
    isExpired,
    expiresAt: userData?.subscription_expires_at || null,
    plan: userData?.subscription_plan || 'Free',
    needsUpgrade: !isActive
  }
}

/**
 * Validate subscription and throw error if expired
 * Use this in API routes to block access to premium features
 */
export async function requireActiveSubscription(userId: string): Promise<void> {
  const status = await checkSubscriptionStatus(userId)
  
  if (!status.isActive) {
    throw new Error('Your subscription has expired. Please upgrade your plan to continue using this feature.')
  }
}

/**
 * Get subscription status for a store owner
 */
export async function checkStoreSubscriptionStatus(storeId: string): Promise<SubscriptionStatus> {
  const supabase = getSupabaseAdmin()
  
  // Get store owner's user ID
  const { data: storeData } = await supabase
    .from('stores')
    .select('user_id')
    .eq('id', storeId)
    .single()

  if (!storeData?.user_id) {
    throw new Error('Store not found')
  }

  return checkSubscriptionStatus(storeData.user_id)
}

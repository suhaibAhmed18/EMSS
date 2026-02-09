// Settings API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { shopifyStoreManager } from '@/lib/shopify/store-manager'
import { getSupabaseAdmin } from '@/lib/database/client'
import type { Database } from '@/lib/database/supabase-types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    let storeId: string
    let currentUser: any = null
    
    if (shop) {
      // Shopify app request
      const store = await shopifyStoreManager.getStoreByDomain(shop)
      if (!store) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        )
      }
      storeId = store.id
    } else {
      // Web app request - get current user's store
      const user = await authServer.getCurrentUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      currentUser = user
      
      const supabaseAdmin = getSupabaseAdmin()
      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (storesError || !stores || stores.length === 0) {
        return NextResponse.json(
          { error: 'No store connected' },
          { status: 404 }
        )
      }
      storeId = stores[0].id
    }

    // Get store settings
    const supabaseAdmin = getSupabaseAdmin()
    const { data: store, error } = await supabaseAdmin
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single()

    if (error) {
      console.error('Failed to get store settings:', error)
      throw new Error('Failed to get store settings')
    }

    const settings = (store as any)?.settings || {}

    return NextResponse.json({
      settings: {
        // Use user account data for profile information (from registration)
        firstName: settings.firstName || currentUser?.name || '',
        lastName: settings.lastName || currentUser?.lastname || '',
        email: settings.email || currentUser?.email || '',
        companyName: settings.companyName || '',
        emailFromName: settings.emailFromName || '',
        emailFromAddress: settings.emailFromAddress || '',
        customDomain: settings.customDomain || '',
        smsFromNumber: settings.smsFromNumber || '',
        messagingProfileId: settings.messagingProfileId || '',
        enableEmailMarketing: settings.enableEmailMarketing !== false,
        enableSmsMarketing: settings.enableSmsMarketing || false,
        autoSyncContacts: settings.autoSyncContacts !== false,
        syncFrequency: settings.syncFrequency || 'daily'
      }
    })
  } catch (error) {
    console.error('Failed to get settings:', error)
    return NextResponse.json(
      { error: 'Failed to get settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shop, settings } = body
    
    let storeId: string
    let userId: string | null = null
    
    if (shop) {
      // Shopify app request
      const store = await shopifyStoreManager.getStoreByDomain(shop)
      if (!store) {
        return NextResponse.json(
          { error: 'Store not found' },
          { status: 404 }
        )
      }
      storeId = store.id
    } else {
      // Web app request - get current user's store
      const user = await authServer.getCurrentUser()
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }
      userId = user.id
      
      const supabaseAdmin = getSupabaseAdmin()
      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('id, settings')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
      
      if (storesError || !stores || stores.length === 0) {
        return NextResponse.json(
          { error: 'No store connected' },
          { status: 404 }
        )
      }
      storeId = stores[0].id
    }

    const supabaseAdmin = getSupabaseAdmin()
    
    // Update user profile information if firstName, lastName, or email changed
    if (userId && (settings.firstName || settings.lastName || settings.email)) {
      const userUpdates: any = {}
      if (settings.firstName !== undefined) userUpdates.name = settings.firstName
      if (settings.lastName !== undefined) userUpdates.lastname = settings.lastName
      if (settings.email !== undefined) userUpdates.email = settings.email
      
      if (Object.keys(userUpdates).length > 0) {
        const { error: userError } = await supabaseAdmin
          .from('users')
          .update(userUpdates)
          .eq('id', userId)
        
        if (userError) {
          console.error('Failed to update user profile:', userError)
          // Continue with store settings update even if user update fails
        }
      }
    }
    
    // First get existing settings
    const { data: existingStore } = await supabaseAdmin
      .from('stores')
      .select('settings')
      .eq('id', storeId)
      .single()
    
    const existingSettings = (existingStore as any)?.settings || {}
    const mergedSettings = { ...existingSettings, ...settings }
    
    // Update store settings
    const { error } = await supabaseAdmin
      .from('stores')
      .update({ 
        settings: mergedSettings,
        updated_at: new Date().toISOString()
      })
      .eq('id', storeId)

    if (error) {
      console.error('Failed to update store settings:', error)
      throw new Error('Failed to update store settings')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save settings:', error)
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    )
  }
}
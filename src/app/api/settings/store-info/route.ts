import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function GET(request: NextRequest) {
  try {
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    
    // Get user's connected store
    const { data: store, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error) {
      // Check if it's a "no rows" error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'No store connected. Please connect your Shopify store first.' 
        }, { status: 404 })
      }
      throw error
    }

    // Remove sensitive data
    const { access_token, scopes, ...storeData } = store

    return NextResponse.json({
      store: storeData
    })
  } catch (error) {
    console.error('Failed to get store info:', error)
    return NextResponse.json(
      { error: 'Failed to load store information' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Alternative DELETE endpoint at /api/stores/delete
export async function POST(request: NextRequest) {
  console.log('🗑️  DELETE request received at /api/stores/delete')
  
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      console.log('❌ Unauthorized: No user session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get store ID from request body
    const body = await request.json()
    const { storeId } = body

    if (!storeId) {
      return NextResponse.json({ 
        error: 'Missing storeId in request body' 
      }, { status: 400 })
    }

    console.log('📋 Store ID to delete:', storeId)

    // Get store and verify ownership
    const { data: store, error: fetchError } = await databaseService.supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single()

    if (fetchError || !store) {
      console.error('❌ Store not found:', fetchError?.message || 'No data returned')
      return NextResponse.json({ 
        error: 'Store not found',
        details: fetchError?.message 
      }, { status: 404 })
    }

    console.log('✅ Store found:', {
      id: store.id,
      domain: store.shop_domain,
      owner: store.user_id,
      active: store.is_active
    })

    if (store.user_id !== user.id) {
      console.log('❌ Access denied: store owned by', store.user_id, 'but requested by', user.id)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ Ownership verified')

    // PERMANENT DELETE - This will cascade delete all related data
    console.log('🔄 Performing PERMANENT delete...')
    const { error: deleteError } = await databaseService.supabase
      .from('stores')
      .delete()
      .eq('id', storeId)

    if (deleteError) {
      console.error('❌ Failed to delete store in database:', deleteError)
      return NextResponse.json(
        { 
          error: 'Database error while deleting store',
          details: deleteError.message
        },
        { status: 500 }
      )
    }

    console.log('✅ Store PERMANENTLY deleted:', storeId)

    return NextResponse.json({
      success: true,
      message: 'Store permanently deleted successfully',
      deletedStoreId: storeId
    })
  } catch (error) {
    console.error('❌ Unexpected error in POST /api/stores/delete:', error)
    return NextResponse.json(
      { 
        error: 'Failed to delete store',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

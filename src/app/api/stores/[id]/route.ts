import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const storeId = id

    // Get store and verify ownership
    const store = await databaseService.getStoreById(storeId)
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get analytics
    const analytics = await databaseService.getStoreAnalytics(storeId)

    return NextResponse.json({
      store: {
        ...store,
        analytics
      }
    })
  } catch (error) {
    console.error('Failed to fetch store:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const storeId = id
    const body = await request.json()

    // Get store and verify ownership
    const existingStore = await databaseService.getStoreById(storeId)
    if (existingStore.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update store
    const updatedStore = await databaseService.updateStore(storeId, body)

    return NextResponse.json({
      store: updatedStore,
      message: 'Store updated successfully'
    })
  } catch (error) {
    console.error('Failed to update store:', error)
    return NextResponse.json(
      { error: 'Failed to update store' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const storeId = id
  console.log('🗑️  DELETE request received for store:', storeId)
  
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      console.log('❌ Unauthorized: No user session')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Get store and verify ownership - don't filter by is_active to allow re-deletion
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

    // Check if already soft-deleted
    if (!store.is_active) {
      console.log('⚠️  Store already disconnected')
      return NextResponse.json({
        success: true,
        message: 'Store already disconnected'
      })
    }

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
      message: 'Store permanently deleted successfully'
    })
  } catch (error) {
    console.error('❌ Unexpected error in DELETE /api/stores/[id]:', error)
    return NextResponse.json(
      { 
        error: 'Failed to disconnect store',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
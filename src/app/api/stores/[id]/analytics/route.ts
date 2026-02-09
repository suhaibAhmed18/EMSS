import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: storeId } = await params

    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Verify user owns this store
    const store = await databaseService.getStoreById(storeId)
    if (store.user_id !== user.id) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Get real analytics data
    const analytics = await databaseService.getStoreAnalytics(storeId)

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Failed to fetch store analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store analytics' },
      { status: 500 }
    )
  }
}
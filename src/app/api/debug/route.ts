import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    let stores: any[] = []
    let dashboardData: any = null
    
    if (user) {
      try {
        stores = await databaseService.getStoresByUserId(user.id)
        dashboardData = await databaseService.getDashboardData(user.id)
      } catch (error) {
        console.error('Database error:', error)
      }
    }

    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name
      } : null,
      stores: stores,
      dashboardData: dashboardData,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Debug API failed',
      user: null,
      stores: [],
      dashboardData: null,
      timestamp: new Date().toISOString()
    })
  }
}
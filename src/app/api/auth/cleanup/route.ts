import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Clear all auth-related cookies
    const cookieStore = await cookies()
    cookieStore.delete('session-token')
    
    console.log('🧹 Session cleanup completed')

    return NextResponse.json({ 
      success: true,
      message: 'Session cleaned up successfully' 
    })
  } catch (error) {
    console.error('Session cleanup error:', error)
    return NextResponse.json(
      { error: 'Session cleanup failed' },
      { status: 500 }
    )
  }
}
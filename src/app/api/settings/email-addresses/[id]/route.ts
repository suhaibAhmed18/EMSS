import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Prevent deletion of shared email
    if (id === 'shared') {
      return NextResponse.json(
        { error: 'Cannot delete shared email address' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    
    // Delete the email address (only if it belongs to the user)
    const { error } = await supabase
      .from('sender_email_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete email address:', error)
    return NextResponse.json(
      { error: 'Failed to delete email address' },
      { status: 500 }
    )
  }
}

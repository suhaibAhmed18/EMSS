import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get automation and verify ownership through store
    const { data: automation, error: fetchError } = await databaseService.supabase
      .from('automation_workflows')
      .select(`
        *,
        stores!inner(user_id)
      `)
      .eq('id', id)
      .single<any>()

    if (fetchError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if (automation.stores.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Toggle the automation status
    const { data: updatedAutomation, error: updateError } = await databaseService.supabase
      .from('automation_workflows')
      // @ts-expect-error - Supabase type generation issue
      .update({
        is_active: !automation.is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Automation status toggled successfully',
      automation: updatedAutomation
    })
  } catch (error) {
    console.error('Failed to toggle automation:', error)
    return NextResponse.json(
      { error: 'Failed to toggle automation' },
      { status: 500 }
    )
  }
}
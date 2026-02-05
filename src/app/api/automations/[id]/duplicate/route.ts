import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id } = await params

    // Get automation and verify ownership through store
    const { data: originalAutomation, error: fetchError } = await databaseService.supabase
      .from('automation_workflows')
      .select(`
        *,
        stores!inner(user_id)
      `)
      .eq('id', id)
      .single()

    if (fetchError || !originalAutomation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if ((originalAutomation as any).stores.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const automation = originalAutomation as any

    // Create duplicate automation
    const duplicateData = {
      store_id: automation.store_id,
      name: `${automation.name} (Copy)`,
      description: automation.description ? `${automation.description} (Copy)` : null,
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config,
      actions: automation.actions,
      conditions: automation.conditions,
      is_active: false // Start duplicated automations as inactive
    }

    const { data: duplicatedAutomation, error: createError } = await databaseService.supabase
      .from('automation_workflows')
      .insert(duplicateData as any)
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({
      success: true,
      message: 'Automation duplicated successfully',
      automation: duplicatedAutomation
    })
  } catch (error) {
    console.error('Failed to duplicate automation:', error)
    return NextResponse.json(
      { error: 'Failed to duplicate automation' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

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

    const { id: automationId } = await params

    // Get automation and verify ownership through store
    const { data: automation, error } = await databaseService.supabase
      .from('automation_workflows')
      .select(`
        *,
        stores!inner(user_id)
      `)
      .eq('id', automationId)
      .single()

    if (error || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if ((automation as any).stores.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ automation })
  } catch (error) {
    console.error('Failed to fetch automation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automation' },
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

    const { id: automationId } = await params
    const body = await request.json()

    // Get automation and verify ownership through store
    const { data: existingAutomation, error: fetchError } = await databaseService.supabase
      .from('automation_workflows')
      .select(`
        *,
        stores!inner(user_id)
      `)
      .eq('id', automationId)
      .single()

    if (fetchError || !existingAutomation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if ((existingAutomation as any).stores.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update automation
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    }
    
    // @ts-ignore - Supabase types are too strict for dynamic updates
    const { data: updatedAutomation, error: updateError } = await databaseService.supabase
      .from('automation_workflows')
      .update(updateData)
      .eq('id', automationId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      automation: updatedAutomation,
      message: 'Automation updated successfully'
    })
  } catch (error) {
    console.error('Failed to update automation:', error)
    return NextResponse.json(
      { error: 'Failed to update automation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: automationId } = await params

    // Get automation and verify ownership through store
    const { data: automation, error: fetchError } = await databaseService.supabase
      .from('automation_workflows')
      .select(`
        *,
        stores!inner(user_id)
      `)
      .eq('id', automationId)
      .single()

    if (fetchError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 })
    }

    if ((automation as any).stores.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete automation
    const { error: deleteError } = await databaseService.supabase
      .from('automation_workflows')
      .delete()
      .eq('id', automationId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      message: 'Automation deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete automation:', error)
    return NextResponse.json(
      { error: 'Failed to delete automation' },
      { status: 500 }
    )
  }
}
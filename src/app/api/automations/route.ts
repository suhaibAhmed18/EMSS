import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'
import { requireActiveSubscription } from '@/lib/subscription/subscription-guard'

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's stores
    const stores = await databaseService.getStoresByUserId(user.id)
    if (stores.length === 0) {
      return NextResponse.json({ automations: [], total: 0 })
    }

    // Get automations from all user's stores
    const allAutomations = []
    
    for (const store of stores) {
      try {
        const { workflows } = await databaseService.getAutomationWorkflowsByStoreId(store.id, 100)
        allAutomations.push(...workflows)
      } catch (error) {
        console.error(`Failed to load automations for store ${store.id}:`, error)
      }
    }

    // Sort by created_at descending
    allAutomations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      automations: allAutomations,
      total: allAutomations.length
    })
  } catch (error) {
    console.error('Failed to fetch automations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch automations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check subscription status and expiry
    try {
      await requireActiveSubscription(user.id)
    } catch (error) {
      return NextResponse.json({ 
        error: error instanceof Error ? error.message : 'Subscription required',
        needsUpgrade: true
      }, { status: 403 })
    }

    const body = await request.json()
    const { 
      store_id, 
      name, 
      description, 
      trigger_type, 
      trigger_config, 
      actions, 
      conditions = [],
      is_active = true 
    } = body

    if (!store_id || !name || !trigger_type || !trigger_config || !actions) {
      return NextResponse.json(
        { error: 'Missing required fields: store_id, name, trigger_type, trigger_config, actions' },
        { status: 400 }
      )
    }

    // Verify store ownership
    const stores = await databaseService.getStoresByUserId(user.id)
    const store = stores.find(s => s.id === store_id)
    if (!store) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 403 })
    }

    // Create automation workflow
    const automation = await databaseService.createAutomationWorkflow({
      store_id,
      name,
      description: description || '',
      trigger_type,
      trigger_config,
      actions,
      conditions,
      is_active
    })

    return NextResponse.json({
      automation,
      message: 'Automation created successfully'
    })
  } catch (error) {
    console.error('Failed to create automation:', error)
    return NextResponse.json(
      { error: 'Failed to create automation' },
      { status: 500 }
    )
  }
}
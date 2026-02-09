import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For now, return a placeholder since database isn't set up
    return NextResponse.json({
      id: id,
      first_name: 'Sample',
      last_name: 'Contact',
      email: 'sample@example.com',
      phone: '+1234567890',
      tags: [],
      segments: [],
      total_spent: 0,
      order_count: 0,
      email_consent: false,
      sms_consent: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to fetch contact:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const updates = await request.json()
    
    // For now, return success since database isn't set up
    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully (demo mode)',
      contact: {
        id: id,
        ...updates,
        updated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Failed to update contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // For now, return success since database isn't set up
    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully (demo mode)'
    })
  } catch (error) {
    console.error('Failed to delete contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
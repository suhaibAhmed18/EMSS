import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { databaseService } from '@/lib/database/service'

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

    // Get contact from database
    const result = await databaseService.contacts.getContact(id)
    
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error?.message || 'Contact not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(result.data)
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
    
    // Update contact in database
    const result = await databaseService.contacts.updateContact(id, updates)
    
    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error?.message || 'Failed to update contact' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
      contact: result.data
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

    // Delete contact from database
    const result = await databaseService.contacts.deleteContact(id)
    
    if (result.error) {
      return NextResponse.json(
        { error: result.error.message || 'Failed to delete contact' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error) {
    console.error('Failed to delete contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    )
  }
}
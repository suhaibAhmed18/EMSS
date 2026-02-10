import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/database/client'
import { telnyxService } from '@/lib/telnyx/service'
import { authServer } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if user already has a phone number
    const { data: existingUser } = await supabase
      .from('users')
      .select('telnyx_phone_number, subscription_status, email_verified')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is verified
    if (!existingUser.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email before getting a phone number' },
        { status: 403 }
      )
    }

    // Check if subscription is active
    if (existingUser.subscription_status !== 'active') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 403 }
      )
    }

    if (existingUser.telnyx_phone_number) {
      return NextResponse.json({
        phoneNumber: existingUser.telnyx_phone_number,
        message: 'Phone number already assigned',
      })
    }

    // Assign a new phone number
    const phoneNumber = await telnyxService.assignPhoneNumber(user.id)

    // Update user record with phone number
    const { error: updateError } = await supabase
      .from('users')
      .update({
        telnyx_phone_number: phoneNumber,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Failed to update user with phone number:', updateError)
      return NextResponse.json(
        { error: 'Failed to save phone number' },
        { status: 500 }
      )
    }

    console.log(`✅ Phone number ${phoneNumber} assigned to user ${user.id}`)

    return NextResponse.json({
      phoneNumber,
      message: 'Phone number assigned successfully',
    })
  } catch (error) {
    console.error('Phone number assignment error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to assign phone number' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await authServer.getCurrentUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Get user's phone number
    const { data: userData } = await supabase
      .from('users')
      .select('telnyx_phone_number')
      .eq('id', user.id)
      .single()

    if (!userData || !userData.telnyx_phone_number) {
      return NextResponse.json({
        phoneNumber: null,
        message: 'No phone number assigned',
      })
    }

    return NextResponse.json({
      phoneNumber: userData.telnyx_phone_number,
    })
  } catch (error) {
    console.error('Failed to get phone number:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve phone number' },
      { status: 500 }
    )
  }
}

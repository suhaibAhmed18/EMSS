import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await authServer.getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('image') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // Convert file to base64 for temporary storage
    // In a real implementation, you would upload to a cloud storage service
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Generate a temporary URL (in production, this would be a real CDN URL)
    const tempUrl = `/api/campaigns/images/temp/${Date.now()}-${file.name}`

    // Store the image temporarily (in production, use proper storage)
    // For now, we'll return the data URL directly
    
    return NextResponse.json({
      success: true,
      url: dataUrl, // In production, this would be the CDN URL
      tempUrl,
      filename: file.name,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Image upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
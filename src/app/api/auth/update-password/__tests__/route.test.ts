import { POST } from '../route'
import { authServer } from '@/lib/auth/server'
import { getSupabaseAdmin } from '@/lib/database/client'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Mock dependencies
jest.mock('@/lib/auth/server')
jest.mock('@/lib/database/client')

const mockAuthServer = authServer as jest.Mocked<typeof authServer>
const mockGetSupabaseAdmin = getSupabaseAdmin as jest.MockedFunction<typeof getSupabaseAdmin>

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex')
}

describe('POST /api/auth/update-password', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup Supabase mock
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn()
    }
    
    mockGetSupabaseAdmin.mockReturnValue(mockSupabase)
  })

  it('should return 401 if user is not authenticated', async () => {
    mockAuthServer.getCurrentUser.mockResolvedValue(null)

    const request = new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should return 400 if current password is missing', async () => {
    mockAuthServer.getCurrentUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    })

    const request = new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({
        newPassword: 'newpass123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Current password and new password are required')
  })

  it('should return 400 if new password is too short', async () => {
    mockAuthServer.getCurrentUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    })

    const request = new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass123',
        newPassword: 'short'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('New password must be at least 8 characters long')
  })

  it('should return 404 if user not found in database', async () => {
    mockAuthServer.getCurrentUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    })

    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: 'User not found' }
    })

    const request = new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('User not found')
  })

  it('should return 400 if current password is incorrect', async () => {
    const correctPasswordHash = hashPassword('correctpass123')
    
    mockAuthServer.getCurrentUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    })

    mockSupabase.single.mockResolvedValue({
      data: {
        id: '123',
        password_hash: correctPasswordHash
      },
      error: null
    })

    const request = new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'wrongpass123',
        newPassword: 'newpass123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Current password is incorrect')
  })

  it('should successfully update password with correct credentials', async () => {
    const currentPasswordHash = hashPassword('oldpass123')
    
    mockAuthServer.getCurrentUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    })

    mockSupabase.single.mockResolvedValue({
      data: {
        id: '123',
        password_hash: currentPasswordHash
      },
      error: null
    })

    mockSupabase.update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: { id: '123' },
        error: null
      })
    })

    const request = new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Password updated successfully')
    
    // Verify update was called with hashed password
    expect(mockSupabase.update).toHaveBeenCalledWith(
      expect.objectContaining({
        password_hash: hashPassword('newpass123')
      })
    )
  })

  it('should return 500 if database update fails', async () => {
    const currentPasswordHash = hashPassword('oldpass123')
    
    mockAuthServer.getCurrentUser.mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    })

    mockSupabase.single.mockResolvedValue({
      data: {
        id: '123',
        password_hash: currentPasswordHash
      },
      error: null
    })

    mockSupabase.update.mockReturnValue({
      eq: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })
    })

    const request = new NextRequest('http://localhost:3000/api/auth/update-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to update password')
  })
})

import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/database/client'

export interface TokenData {
  email: string
  type: 'verification' | 'password_reset'
  expires: Date
}

export class TokenService {
  private supabase = getSupabaseAdmin()

  generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  async createVerificationToken(email: string): Promise<string> {
    const token = this.generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const { error } = await this.supabase
      .from('auth_tokens')
      .insert({
        token,
        email,
        type: 'verification',
        expires_at: expires.toISOString()
      })
    
    if (error) {
      console.error('Failed to create verification token:', error)
      throw new Error('Failed to create verification token')
    }
    
    return token
  }

  async createPasswordResetToken(email: string): Promise<string> {
    const token = this.generateToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    const { error } = await this.supabase
      .from('auth_tokens')
      .insert({
        token,
        email,
        type: 'password_reset',
        expires_at: expires.toISOString()
      })
    
    if (error) {
      console.error('Failed to create password reset token:', error)
      throw new Error('Failed to create password reset token')
    }
    
    return token
  }

  async validateToken(token: string, type: 'verification' | 'password_reset'): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('auth_tokens')
      .select('*')
      .eq('token', token)
      .eq('type', type)
      .is('used_at', null)
      .single()
    
    if (error || !data) {
      return null
    }
    
    if (new Date(data.expires_at) < new Date()) {
      // Token expired, delete it
      await this.supabase
        .from('auth_tokens')
        .delete()
        .eq('token', token)
      return null
    }
    
    return data.email
  }

  async consumeToken(token: string): Promise<void> {
    await this.supabase
      .from('auth_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token)
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.supabase
      .from('auth_tokens')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }
}

export const tokenService = new TokenService()
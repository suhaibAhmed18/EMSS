import crypto from 'crypto'
import { getSupabaseAdmin } from '@/lib/database/client'

export class SessionManager {
  private supabase = getSupabaseAdmin()

  async createSession(userId: string, request?: Request): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    
    const { error } = await this.supabase
      .from('user_sessions')
      .insert({
        session_token: sessionToken,
        user_id: userId,
        expires_at: expiresAt.toISOString(),
        ip_address: request?.headers.get('x-forwarded-for') || null,
        user_agent: request?.headers.get('user-agent') || null
      })
    
    if (error) {
      console.error('Failed to create session:', error)
      throw new Error('Failed to create session')
    }
    
    return sessionToken
  }

  async validateSession(sessionToken: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('user_sessions')
      .select('user_id, expires_at')
      .eq('session_token', sessionToken)
      .single()
    
    if (error || !data) {
      return null
    }
    
    if (new Date(data.expires_at) < new Date()) {
      await this.deleteSession(sessionToken)
      return null
    }
    
    // Update last activity
    await this.supabase
      .from('user_sessions')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('session_token', sessionToken)
    
    return data.user_id
  }

  async deleteSession(sessionToken: string): Promise<void> {
    await this.supabase
      .from('user_sessions')
      .delete()
      .eq('session_token', sessionToken)
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString())
  }
}

export const sessionManager = new SessionManager()

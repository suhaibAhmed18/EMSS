// Client-side authentication utilities
'use client'

import { createClient } from '../supabase/client'
import { AuthError, InvalidCredentialsError, SessionExpiredError } from './types'
import type { User, AuthSession } from './types'

export class AuthClient {
  private supabase = createClient()

  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string, userData?: { role?: 'merchant' | 'admin' }) {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: userData?.role || 'merchant',
          },
        },
      })

      if (error) {
        throw new AuthError(error.message, error.name || 'SIGNUP_ERROR')
      }

      return data
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to sign up user', 'SIGNUP_ERROR')
    }
  }

  /**
   * Sign in user with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new InvalidCredentialsError()
        }
        throw new AuthError(error.message, error.name || 'SIGNIN_ERROR')
      }

      // Update last login time
      if (data.user) {
        await this.updateLastLogin(data.user.id)
      }

      return data
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to sign in user', 'SIGNIN_ERROR')
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) {
        throw new AuthError(error.message, error.name || 'SIGNOUT_ERROR')
      }
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to sign out user', 'SIGNOUT_ERROR')
    }
  }

  /**
   * Get current session
   */
  async getSession(): Promise<AuthSession | null> {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()
      
      if (error) {
        throw new AuthError(error.message, error.name || 'SESSION_ERROR')
      }

      if (!session) return null

      // Get user profile data
      const userProfile = await this.getUserProfile(session.user.id)
      
      return {
        user: userProfile,
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        expiresAt: session.expires_at || 0,
      }
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to get session', 'SESSION_ERROR')
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()
      
      if (error) {
        if (error.message.includes('JWT expired')) {
          throw new SessionExpiredError()
        }
        throw new AuthError(error.message, error.name || 'USER_ERROR')
      }

      if (!user) return null

      return await this.getUserProfile(user.id)
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to get current user', 'USER_ERROR')
    }
  }

  /**
   * Refresh current session
   */
  async refreshSession() {
    try {
      const { data, error } = await this.supabase.auth.refreshSession()
      
      if (error) {
        throw new AuthError(error.message, error.name || 'REFRESH_ERROR')
      }

      return data
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to refresh session', 'REFRESH_ERROR')
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    return this.supabase.auth.onAuthStateChange(callback)
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        throw new AuthError(error.message, error.name || 'RESET_ERROR')
      }
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to reset password', 'RESET_ERROR')
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        throw new AuthError(error.message, error.name || 'UPDATE_PASSWORD_ERROR')
      }
    } catch (error) {
      if (error instanceof AuthError) throw error
      throw new AuthError('Failed to update password', 'UPDATE_PASSWORD_ERROR')
    }
  }

  /**
   * Get user profile from database
   */
  private async getUserProfile(userId: string): Promise<User> {
    try {
      // First try to get from auth.users table directly
      const { data: authUser, error: authError } = await this.supabase.auth.getUser()
      
      if (authError || !authUser.user) {
        throw new AuthError('Failed to get authenticated user', 'AUTH_ERROR')
      }

      // Try to get additional profile data from user_profiles table if it exists
      const { data: profileData } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Return user data with profile data if available, otherwise use auth data
      return {
        id: authUser.user.id,
        email: authUser.user.email || '',
        shopifyStoreId: (profileData as any)?.shopify_store_id || null,
        role: (profileData as any)?.role || 'merchant',
        createdAt: new Date(authUser.user.created_at),
        lastLoginAt: (profileData as any)?.last_login_at ? new Date((profileData as any).last_login_at) : null,
      }
    } catch (error) {
      // If profile table doesn't exist, create a basic user object from auth data
      const { data: authUser } = await this.supabase.auth.getUser()
      
      if (authUser.user) {
        return {
          id: authUser.user.id,
          email: authUser.user.email || '',
          shopifyStoreId: null,
          role: 'merchant',
          createdAt: new Date(authUser.user.created_at),
          lastLoginAt: null,
        }
      }
      
      throw new AuthError('Failed to get user profile', 'PROFILE_ERROR')
    }
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string) {
    try {
      await (this.supabase as any)
        .from('user_profiles')
        .upsert({ 
          id: userId,
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    } catch (error) {
      // Ignore errors if user_profiles table doesn't exist
      console.log('Could not update last login - user_profiles table may not exist')
    }
  }
}

// Export singleton instance
export const authClient = new AuthClient()
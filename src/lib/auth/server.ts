import { cookies } from 'next/headers'
import { emailService } from '@/lib/email/service'
import { tokenService } from './tokens'
import { sessionManager } from './sessions'
import { getSupabaseAdmin } from '@/lib/database/client'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  name?: string
  avatar?: string
  emailVerified?: boolean
}

interface DatabaseUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  name: string | null
  password_hash: string
  email_verified: boolean
  created_at: string
  updated_at: string
}

class AuthServer {
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword)
    } catch {
      return false
    }
  }

  // Legacy SHA-256 verification for migration
  private verifyPasswordSHA256(password: string, hashedPassword: string): boolean {
    return crypto.createHash('sha256').update(password).digest('hex') === hashedPassword
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const cookieStore = await cookies()
      const sessionCookie = cookieStore.get('session-token')

      if (!sessionCookie) {
        return null
      }

      // Validate session from database
      const userId = await sessionManager.validateSession(sessionCookie.value)
      
      if (!userId) {
        // Clear invalid session
        cookieStore.delete('session-token')
        return null
      }
      
      // Get user from database
      const supabase = getSupabaseAdmin()
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error || !user) {
        // Clear invalid session
        await sessionManager.deleteSession(sessionCookie.value)
        cookieStore.delete('session-token')
        return null
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name || undefined,
        lastName: user.last_name || undefined,
        name: user.name || undefined,
        emailVerified: user.email_verified
      }
    } catch (error) {
      console.error('❌ Failed to get current user:', error)
      return null
    }
  }

  async requireAuth(): Promise<User> {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('Authentication required')
    }
    return user
  }

  async signUp(email: string, password: string, name?: string, plan?: string, firstName?: string, lastName?: string): Promise<{ user: User, needsVerification: boolean }> {
    const supabase = getSupabaseAdmin()
    
    try {
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()
      
      if (existingUser) {
        throw new Error('User already exists with this email')
      }

      // Create user with UUID
      const userId = crypto.randomUUID()
      const hashedPassword = await this.hashPassword(password)
      
      // Parse firstName and lastName from name if not provided separately
      let userFirstName = firstName
      let userLastName = lastName
      
      if (!userFirstName && !userLastName && name) {
        const nameParts = name.trim().split(' ')
        userFirstName = nameParts[0]
        userLastName = nameParts.slice(1).join(' ') || undefined
      }
      
      const { data: user, error } = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          name: name || email.split('@')[0],
          first_name: userFirstName,
          last_name: userLastName,
          password_hash: hashedPassword,
          email_verified: false, // Require email verification
          subscription_plan: plan || 'starter',
          subscription_status: 'pending' // Will be activated after payment
        })
        .select()
        .single()

      if (error) {
        console.error('Database error during signup:', error)
        throw new Error(`Failed to create user account: ${error.message}`)
      }

      // Send verification email
      try {
        const verificationToken = await tokenService.createVerificationToken(email)
        await emailService.sendVerificationEmail(email, verificationToken)
        console.log(`✅ User registered: ${email}, verification email sent`)
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError)
        // Don't fail registration if email fails
        if (process.env.NODE_ENV === 'development') {
          console.log('🔧 Development mode: Email would be sent in production')
        }
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name || undefined,
          lastName: user.last_name || undefined,
          name: user.name || undefined,
          emailVerified: user.email_verified
        },
        needsVerification: true
      }
    } catch (error) {
      console.error('❌ Signup error:', error)
      
      // If it's a table not found error, provide helpful message
      if (error instanceof Error && error.message.includes('Could not find the table')) {
        throw new Error('Database not properly set up. Please run the database migration first.')
      }
      
      // Re-throw other errors
      throw error
    }
  }

  async signIn(email: string, password: string, request?: Request): Promise<User> {
    console.log('🔐 Sign in attempt for:', email)
    
    const supabase = getSupabaseAdmin()
    
    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    console.log('👤 Found user for login:', user ? `${user.id} (${user.email})` : 'null')
    
    if (error || !user) {
      console.log('❌ User not found with email:', email)
      throw new Error('Invalid email or password')
    }
    
    // Try bcrypt first, fallback to SHA-256 for migration
    let passwordValid = false
    if (user.password_hash.startsWith('$2')) {
      // bcrypt hash (starts with $2a$, $2b$, or $2y$)
      passwordValid = await this.verifyPassword(password, user.password_hash)
    } else {
      // Legacy SHA-256 hash - verify and upgrade
      passwordValid = this.verifyPasswordSHA256(password, user.password_hash)
      if (passwordValid) {
        // Upgrade to bcrypt
        const newHash = await this.hashPassword(password)
        await supabase
          .from('users')
          .update({ password_hash: newHash })
          .eq('id', user.id)
        console.log('✅ Password upgraded to bcrypt for:', email)
      }
    }
    
    if (!passwordValid) {
      console.log('❌ Password verification failed for user:', email)
      throw new Error('Invalid email or password')
    }

    console.log('✅ Login successful for:', email)

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name || undefined,
      lastName: user.last_name || undefined,
      name: user.name || undefined,
      emailVerified: user.email_verified
    }
  }

  async verifyEmail(token: string): Promise<boolean> {
    const email = await tokenService.validateToken(token, 'verification')
    if (!email) {
      return false
    }

    const supabase = getSupabaseAdmin()
    
    // Find and update user
    const { error } = await supabase
      .from('users')
      .update({ email_verified: true })
      .eq('email', email)
    
    if (error) {
      console.error('Failed to verify email:', error)
      return false
    }

    await tokenService.consumeToken(token)
    return true
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const supabase = getSupabaseAdmin()
    
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (!user) {
      // Don't reveal if email exists or not
      return true
    }

    try {
      const resetToken = await tokenService.createPasswordResetToken(email)
      await emailService.sendPasswordResetEmail(email, resetToken)
      console.log(`✅ Password reset email sent to ${email}`)
      return true
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      // In development, don't fail the request
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode: Password reset would be sent in production')
        return true
      }
      throw new Error('Failed to send password reset email')
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const email = await tokenService.validateToken(token, 'password_reset')
    if (!email) {
      return false
    }

    const supabase = getSupabaseAdmin()
    
    // Find and update user
    const { error } = await supabase
      .from('users')
      .update({ password_hash: await this.hashPassword(newPassword) })
      .eq('email', email)
    
    if (error) {
      console.error('Failed to reset password:', error)
      return false
    }

    await tokenService.consumeToken(token)
    return true
  }

  async signOut(): Promise<void> {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session-token')
    
    if (sessionCookie) {
      await sessionManager.deleteSession(sessionCookie.value)
    }
    
    cookieStore.delete('session-token')
  }
}

export const authServer = new AuthServer()
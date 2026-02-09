import crypto from 'crypto'

export interface TokenData {
  email: string
  type: 'verification' | 'password_reset'
  expires: Date
}

// In a real app, you'd store these in a database
// For demo purposes, we'll use in-memory storage
const tokenStore = new Map<string, TokenData>()

export class TokenService {
  generateToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  createVerificationToken(email: string): string {
    const token = this.generateToken()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    tokenStore.set(token, {
      email,
      type: 'verification',
      expires
    })
    
    return token
  }

  createPasswordResetToken(email: string): string {
    const token = this.generateToken()
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    
    tokenStore.set(token, {
      email,
      type: 'password_reset',
      expires
    })
    
    return token
  }

  validateToken(token: string, type: 'verification' | 'password_reset'): string | null {
    const tokenData = tokenStore.get(token)
    
    if (!tokenData) {
      return null
    }
    
    if (tokenData.type !== type) {
      return null
    }
    
    if (tokenData.expires < new Date()) {
      tokenStore.delete(token)
      return null
    }
    
    return tokenData.email
  }

  consumeToken(token: string): void {
    tokenStore.delete(token)
  }

  // Clean up expired tokens (you'd run this periodically)
  cleanupExpiredTokens(): void {
    const now = new Date()
    for (const [token, data] of tokenStore.entries()) {
      if (data.expires < now) {
        tokenStore.delete(token)
      }
    }
  }
}

export const tokenService = new TokenService()
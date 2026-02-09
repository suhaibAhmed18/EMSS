// Rate limiting and abuse prevention system
import { createClient } from '../supabase/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: Request) => string // Custom key generator
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
}

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

export class RateLimiter {
  private cache = new Map<string, RateLimitEntry>()
  private supabase = createClient()

  /**
   * API endpoint rate limiting
   */
  async checkRateLimit(
    identifier: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  }> {
    const key = `rate_limit:${identifier}`
    const now = Date.now()
    
    // Clean up expired entries
    this.cleanupExpiredEntries(now)
    
    let entry = this.cache.get(key)
    
    if (!entry || now >= entry.resetTime) {
      // Create new window
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
        blocked: false
      }
    }
    
    entry.count++
    
    const allowed = entry.count <= config.maxRequests
    const remaining = Math.max(0, config.maxRequests - entry.count)
    
    if (!allowed) {
      entry.blocked = true
      // Log rate limit violation
      await this.logRateLimitViolation(identifier, entry.count, config.maxRequests)
    }
    
    this.cache.set(key, entry)
    
    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  /**
   * Webhook rate limiting with burst protection
   */
  async checkWebhookRateLimit(shopDomain: string): Promise<boolean> {
    const result = await this.checkRateLimit(`webhook:${shopDomain}`, {
      windowMs: 60 * 1000, // 1 minute window
      maxRequests: 100, // 100 webhooks per minute per store
    })
    
    return result.allowed
  }

  /**
   * Campaign sending rate limiting
   */
  async checkCampaignRateLimit(storeId: string, campaignType: 'email' | 'sms'): Promise<boolean> {
    const limits = {
      email: { windowMs: 60 * 60 * 1000, maxRequests: 10000 }, // 10k emails per hour
      sms: { windowMs: 60 * 60 * 1000, maxRequests: 1000 }, // 1k SMS per hour
    }
    
    const result = await this.checkRateLimit(
      `campaign:${storeId}:${campaignType}`,
      limits[campaignType]
    )
    
    return result.allowed
  }

  /**
   * API authentication rate limiting
   */
  async checkAuthRateLimit(ipAddress: string): Promise<boolean> {
    const result = await this.checkRateLimit(`auth:${ipAddress}`, {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 failed attempts per 15 minutes
    })
    
    return result.allowed
  }

  /**
   * Contact import rate limiting
   */
  async checkImportRateLimit(storeId: string): Promise<boolean> {
    const result = await this.checkRateLimit(`import:${storeId}`, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10, // 10 imports per hour
    })
    
    return result.allowed
  }

  private cleanupExpiredEntries(now: number): void {
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.resetTime) {
        this.cache.delete(key)
      }
    }
  }

  private async logRateLimitViolation(
    identifier: string,
    currentCount: number,
    maxAllowed: number
  ): Promise<void> {
    try {
      const client = await this.supabase
      await client
        .from('security_events')
        .insert({
          event_type: 'rate_limit_violation',
          identifier,
          details: {
            current_count: currentCount,
            max_allowed: maxAllowed,
            timestamp: new Date().toISOString(),
          },
          severity: 'medium',
          created_at: new Date().toISOString(),
        } as any)
    } catch (error) {
      console.error('Failed to log rate limit violation:', error)
    }
  }
}

/**
 * IP-based abuse detection and prevention
 */
export class AbuseDetector {
  private supabase = createClient()
  private suspiciousPatterns = new Map<string, number>()

  /**
   * Detect suspicious activity patterns
   */
  async detectSuspiciousActivity(
    ipAddress: string,
    userAgent: string,
    endpoint: string
  ): Promise<{
    suspicious: boolean
    reason?: string
    blockDuration?: number
  }> {
    const patterns = await this.analyzeRequestPatterns(ipAddress, endpoint)
    
    // Check for bot-like behavior
    if (this.isBotLikeUserAgent(userAgent)) {
      return {
        suspicious: true,
        reason: 'Bot-like user agent detected',
        blockDuration: 60 * 60 * 1000, // 1 hour
      }
    }
    
    // Check for rapid sequential requests
    if (patterns.rapidRequests > 50) {
      return {
        suspicious: true,
        reason: 'Rapid sequential requests detected',
        blockDuration: 30 * 60 * 1000, // 30 minutes
      }
    }
    
    // Check for unusual endpoint access patterns
    if (patterns.unusualEndpoints > 10) {
      return {
        suspicious: true,
        reason: 'Unusual endpoint access pattern',
        blockDuration: 15 * 60 * 1000, // 15 minutes
      }
    }
    
    return { suspicious: false }
  }

  /**
   * Block IP address temporarily
   */
  async blockIpAddress(
    ipAddress: string,
    reason: string,
    durationMs: number
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + durationMs)
    
    const client = await this.supabase
    await client
      .from('ip_blocks')
      .upsert({
        ip_address: ipAddress,
        reason,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      } as any, {
        onConflict: 'ip_address'
      })
    
    // Log security event
    await client
      .from('security_events')
      .insert({
        event_type: 'ip_blocked',
        identifier: ipAddress,
        details: { reason, expires_at: expiresAt.toISOString() },
        severity: 'high',
        created_at: new Date().toISOString(),
      } as any)
  }

  /**
   * Check if IP address is currently blocked
   */
  async isIpBlocked(ipAddress: string): Promise<boolean> {
    const client = await this.supabase
    const { data } = await client
      .from('ip_blocks')
      .select('expires_at')
      .eq('ip_address', ipAddress)
      .gt('expires_at', new Date().toISOString())
      .single()
    
    return !!data
  }

  private async analyzeRequestPatterns(
    ipAddress: string,
    endpoint: string
  ): Promise<{
    rapidRequests: number
    unusualEndpoints: number
  }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const client = await this.supabase
    const { data: recentRequests } = await client
      .from('request_logs')
      .select('endpoint, created_at')
      .eq('ip_address', ipAddress)
      .gte('created_at', oneHourAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(1000)
    
    if (!recentRequests) {
      return { rapidRequests: 0, unusualEndpoints: 0 }
    }
    
    // Count rapid requests (more than 1 per second)
    let rapidRequests = 0
    const requests = recentRequests as any[]
    for (let i = 1; i < requests.length; i++) {
      const timeDiff = new Date(requests[i-1].created_at).getTime() - 
                      new Date(requests[i].created_at).getTime()
      if (timeDiff < 1000) {
        rapidRequests++
      }
    }
    
    // Count unique endpoints accessed
    const uniqueEndpoints = new Set(recentRequests.map((r: { endpoint: string }) => r.endpoint))
    const unusualEndpoints = uniqueEndpoints.size > 20 ? uniqueEndpoints.size : 0
    
    return { rapidRequests, unusualEndpoints }
  }

  private isBotLikeUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /go-http-client/i,
    ]
    
    return botPatterns.some(pattern => pattern.test(userAgent))
  }
}

/**
 * Security headers and CSRF protection
 */
export class SecurityHeaders {
  static getSecurityHeaders(): Record<string, string> {
    return {
      // Prevent clickjacking
      'X-Frame-Options': 'DENY',
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // Enable XSS protection
      'X-XSS-Protection': '1; mode=block',
      
      // Strict transport security
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      
      // Content security policy
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https:",
        "connect-src 'self' https://api.resend.com https://api.telnyx.com",
        "frame-ancestors 'none'",
      ].join('; '),
      
      // Referrer policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions policy
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    }
  }

  static validateCSRFToken(token: string, sessionToken: string): boolean {
    // Simple CSRF token validation
    // In production, use a more sophisticated approach
    return token === sessionToken
  }
}

export const rateLimiter = new RateLimiter()
export const abuseDetector = new AbuseDetector()
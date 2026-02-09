// API optimization middleware for Next.js API routes
import { NextRequest, NextResponse } from 'next/server'
import { rateLimiter, abuseDetector, SecurityHeaders } from '../security/rate-limiter'

export interface OptimizationConfig {
  rateLimit?: {
    windowMs: number
    maxRequests: number
  }
  enableAbusePrevention?: boolean
  enableSecurityHeaders?: boolean
  enableRequestLogging?: boolean
  enableCaching?: boolean
  cacheMaxAge?: number
}

/**
 * API optimization middleware with rate limiting, security, and performance enhancements
 */
export function withOptimization(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: OptimizationConfig = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now()
    const ipAddress = getClientIP(req)
    const userAgent = req.headers.get('user-agent') || ''
    const endpoint = `${req.method} ${req.nextUrl.pathname}`

    try {
      // Apply security headers
      const response = new NextResponse()
      if (config.enableSecurityHeaders !== false) {
        const securityHeaders = SecurityHeaders.getSecurityHeaders()
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value)
        })
      }

      // Check for IP blocks
      if (config.enableAbusePrevention !== false) {
        const isBlocked = await abuseDetector.isIpBlocked(ipAddress)
        if (isBlocked) {
          return new NextResponse('Access denied', { 
            status: 403,
            headers: response.headers
          })
        }

        // Detect suspicious activity
        const suspiciousActivity = await abuseDetector.detectSuspiciousActivity(
          ipAddress,
          userAgent,
          endpoint
        )

        if (suspiciousActivity.suspicious) {
          await abuseDetector.blockIpAddress(
            ipAddress,
            suspiciousActivity.reason!,
            suspiciousActivity.blockDuration!
          )
          
          return new NextResponse('Suspicious activity detected', { 
            status: 429,
            headers: response.headers
          })
        }
      }

      // Apply rate limiting
      if (config.rateLimit) {
        const rateLimitResult = await rateLimiter.checkRateLimit(ipAddress, config.rateLimit)
        
        // Add rate limit headers
        response.headers.set('X-RateLimit-Limit', config.rateLimit.maxRequests.toString())
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
        response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
        
        if (!rateLimitResult.allowed) {
          response.headers.set('Retry-After', rateLimitResult.retryAfter!.toString())
          return new NextResponse('Rate limit exceeded', { 
            status: 429,
            headers: response.headers
          })
        }
      }

      // Log request if enabled
      if (config.enableRequestLogging !== false) {
        // Fire and forget logging
        logRequest(req, ipAddress, userAgent, endpoint).catch(console.error)
      }

      // Execute the actual handler
      const handlerResponse = await handler(req)

      // Apply caching headers if enabled
      if (config.enableCaching && req.method === 'GET') {
        const maxAge = config.cacheMaxAge || 300 // 5 minutes default
        handlerResponse.headers.set('Cache-Control', `public, max-age=${maxAge}`)
        handlerResponse.headers.set('ETag', await generateETag(req.url))
      }

      // Copy security headers to handler response
      if (config.enableSecurityHeaders !== false) {
        const securityHeaders = SecurityHeaders.getSecurityHeaders()
        Object.entries(securityHeaders).forEach(([key, value]) => {
          handlerResponse.headers.set(key, value)
        })
      }

      // Add performance headers
      const processingTime = Date.now() - startTime
      handlerResponse.headers.set('X-Response-Time', `${processingTime}ms`)

      return handlerResponse

    } catch (error) {
      console.error('API optimization middleware error:', error)
      
      // Return error response with security headers
      const errorResponse = new NextResponse('Internal server error', { 
        status: 500,
        headers: config.enableSecurityHeaders !== false ? SecurityHeaders.getSecurityHeaders() : {}
      })
      
      return errorResponse
    }
  }
}

/**
 * Webhook-specific optimization middleware
 */
export function withWebhookOptimization(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withOptimization(handler, {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100, // 100 requests per minute
    },
    enableAbusePrevention: true,
    enableSecurityHeaders: true,
    enableRequestLogging: true,
    enableCaching: false, // Webhooks shouldn't be cached
  })
}

/**
 * Campaign API optimization middleware
 */
export function withCampaignOptimization(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withOptimization(handler, {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
    },
    enableAbusePrevention: true,
    enableSecurityHeaders: true,
    enableRequestLogging: true,
    enableCaching: false, // Campaign operations shouldn't be cached
  })
}

/**
 * Public API optimization middleware
 */
export function withPublicAPIOptimization(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withOptimization(handler, {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 requests per minute
    },
    enableAbusePrevention: true,
    enableSecurityHeaders: true,
    enableRequestLogging: true,
    enableCaching: true,
    cacheMaxAge: 300, // 5 minutes
  })
}

/**
 * Authentication API optimization middleware
 */
export function withAuthOptimization(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return withOptimization(handler, {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
    },
    enableAbusePrevention: true,
    enableSecurityHeaders: true,
    enableRequestLogging: true,
    enableCaching: false, // Auth operations shouldn't be cached
  })
}

/**
 * Extract client IP address from request
 */
function getClientIP(req: NextRequest): string {
  // Check various headers for the real IP
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  // Fallback to unknown
  return 'unknown'
}

/**
 * Generate ETag for caching
 */
async function generateETag(url: string): Promise<string> {
  const crypto = await import('crypto')
  const hash = crypto
    .createHash('md5')
    .update(url + Date.now().toString())
    .digest('hex')
  
  return `"${hash}"`
}

/**
 * Log API request for monitoring and analytics
 */
async function logRequest(
  req: NextRequest,
  ipAddress: string,
  userAgent: string,
  endpoint: string
): Promise<void> {
  try {
    const { createClient } = await import('../supabase/server')
    const supabase = await createClient()
    
    await supabase
      .from('request_logs')
      .insert({
        ip_address: ipAddress,
        user_agent: userAgent,
        endpoint,
        method: req.method,
        created_at: new Date().toISOString(),
      } as any)
  } catch (error) {
    // Silently fail logging to not impact API performance
    console.error('Failed to log request:', error)
  }
}

/**
 * Database connection optimization
 */
export class ConnectionPool {
  private static instance: ConnectionPool
  private connections = new Map<string, unknown>()
  private maxConnections = 10
  private connectionTimeout = 30000 // 30 seconds

  static getInstance(): ConnectionPool {
    if (!ConnectionPool.instance) {
      ConnectionPool.instance = new ConnectionPool()
    }
    return ConnectionPool.instance
  }

  async getConnection(key: string): Promise<unknown> {
    if (this.connections.has(key)) {
      return this.connections.get(key)
    }

    if (this.connections.size >= this.maxConnections) {
      // Remove oldest connection
      const oldestKey = this.connections.keys().next().value
      if (oldestKey) {
        this.connections.delete(oldestKey)
      }
    }

    // Create new connection
    const { createClient } = await import('../supabase/server')
    const connection = await createClient()
    
    this.connections.set(key, connection)
    
    // Set timeout to clean up connection
    setTimeout(() => {
      this.connections.delete(key)
    }, this.connectionTimeout)

    return connection
  }

  closeAllConnections(): void {
    this.connections.clear()
  }
}

/**
 * Response compression utility
 */
export function compressResponse(data: unknown): string {
  if (typeof data === 'string') {
    return data
  }
  
  // Remove null/undefined values to reduce payload size
  const cleaned = JSON.parse(JSON.stringify(data, (key, value) => {
    if (value === null || value === undefined) {
      return undefined
    }
    return value
  }))
  
  return JSON.stringify(cleaned)
}
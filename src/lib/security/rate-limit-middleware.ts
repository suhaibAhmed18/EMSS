import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from './rate-limiter'

const rateLimiter = new RateLimiter()

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export async function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  const identifier = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
  
  const result = await rateLimiter.checkRateLimit(identifier, config)
  
  if (!result.allowed) {
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter: result.retryAfter 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': result.retryAfter?.toString() || '60',
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetTime.toString()
        }
      }
    )
  }
  
  return null // Allow request
}

// Preset configurations
export const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60
  },
  strict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10
  },
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20
  }
}

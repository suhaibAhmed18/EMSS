// Error handling module exports
export * from './error-types'
export * from './retry-logic'
export * from './error-logger'
export * from './error-boundaries'
export * from './global-error-handler'

// Re-export commonly used utilities
export {
  RetryManager,
  RetryUtils,
  CircuitBreaker
} from './retry-logic'

export {
  errorLogger,
  LoggingUtils
} from './error-logger'

export {
  ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
  CriticalErrorBoundary,
  useErrorHandler,
  withErrorBoundary
} from './error-boundaries'

export {
  globalErrorHandler
} from './global-error-handler'

// Utility function to create error context from request
export function createErrorContextFromRequest(req?: {
  headers?: Record<string, string | string[] | undefined>
  ip?: string
  url?: string
}): Partial<import('./error-types').ErrorContext> {
  if (!req) return {}

  return {
    userAgent: Array.isArray(req.headers?.['user-agent']) 
      ? req.headers['user-agent'][0] 
      : req.headers?.['user-agent'],
    ipAddress: req.ip,
    requestId: Array.isArray(req.headers?.['x-request-id'])
      ? req.headers['x-request-id'][0]
      : req.headers?.['x-request-id'],
    additionalData: {
      url: req.url,
      method: req.headers?.['x-http-method'] || 'unknown'
    }
  }
}

// Utility function to create error context from Next.js request
export function createErrorContextFromNextRequest(
  request: Request,
  additionalContext?: Record<string, unknown>
): Partial<import('./error-types').ErrorContext> {
  return {
    userAgent: request.headers.get('user-agent') || undefined,
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined,
    requestId: request.headers.get('x-request-id') || undefined,
    additionalData: {
      url: request.url,
      method: request.method,
      ...additionalContext
    }
  }
}
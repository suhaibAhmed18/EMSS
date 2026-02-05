// Professional error handling system
import React from 'react'
import { getSupabaseAdmin } from '@/lib/database/client'

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  NETWORK = 'network',
  PERFORMANCE = 'performance'
}

export interface ErrorContext {
  userId?: string
  storeId?: string
  requestId?: string
  userAgent?: string
  ipAddress?: string
  endpoint?: string
  method?: string
  timestamp?: Date
  field?: string
  service?: string
  statusCode?: number
  metadata?: Record<string, unknown>
  [key: string]: unknown
}

export interface ErrorDetails {
  code: string
  message: string
  category: ErrorCategory
  severity: ErrorSeverity
  context: ErrorContext
  stack?: string
  originalError?: Error
}

export class ApplicationError extends Error {
  public readonly code: string
  public readonly category: ErrorCategory
  public readonly severity: ErrorSeverity
  public readonly context: ErrorContext
  public readonly timestamp: Date

  constructor(
    message: string,
    code: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: ErrorContext = {}
  ) {
    super(message)
    this.name = 'ApplicationError'
    this.code = code
    this.category = category
    this.severity = severity
    this.context = context
    this.timestamp = new Date()

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApplicationError)
    }
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, field?: string, context: ErrorContext = {}) {
    super(
      message,
      'VALIDATION_ERROR',
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      { ...context, field }
    )
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', context: ErrorContext = {}) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      context
    )
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', context: ErrorContext = {}) {
    super(
      message,
      'AUTHORIZATION_ERROR',
      ErrorCategory.AUTHORIZATION,
      ErrorSeverity.HIGH,
      context
    )
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends ApplicationError {
  constructor(message: string, originalError?: Error, context: ErrorContext = {}) {
    super(
      message,
      'DATABASE_ERROR',
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      context
    )
    this.name = 'DatabaseError'
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

export class ExternalAPIError extends ApplicationError {
  constructor(
    message: string,
    service: string,
    statusCode?: number,
    context: ErrorContext = {}
  ) {
    super(
      message,
      'EXTERNAL_API_ERROR',
      ErrorCategory.EXTERNAL_API,
      ErrorSeverity.MEDIUM,
      { ...context, service, statusCode }
    )
    this.name = 'ExternalAPIError'
  }
}

export class BusinessLogicError extends ApplicationError {
  constructor(message: string, code: string, context: ErrorContext = {}) {
    super(
      message,
      code,
      ErrorCategory.BUSINESS_LOGIC,
      ErrorSeverity.MEDIUM,
      context
    )
    this.name = 'BusinessLogicError'
  }
}

export class SystemError extends ApplicationError {
  constructor(message: string, originalError?: Error, context: ErrorContext = {}) {
    super(
      message,
      'SYSTEM_ERROR',
      ErrorCategory.SYSTEM,
      ErrorSeverity.CRITICAL,
      context
    )
    this.name = 'SystemError'
    if (originalError) {
      this.stack = originalError.stack
    }
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler
  private readonly enableLogging: boolean
  private readonly enableReporting: boolean

  constructor() {
    this.enableLogging = process.env.ENABLE_ERROR_TRACKING === 'true'
    this.enableReporting = process.env.NODE_ENV === 'production'
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle and log application errors
   */
  async handleError(error: Error | ApplicationError, context: ErrorContext = {}): Promise<void> {
    const errorDetails = this.normalizeError(error, context)
    
    // Log error
    if (this.enableLogging) {
      await this.logError(errorDetails)
    }

    // Report critical errors
    if (errorDetails.severity === ErrorSeverity.CRITICAL && this.enableReporting) {
      await this.reportError(errorDetails)
    }

    // Console log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorDetails)
    }
  }

  /**
   * Normalize error to standard format
   */
  private normalizeError(error: Error | ApplicationError, context: ErrorContext): ErrorDetails {
    if (error instanceof ApplicationError) {
      return {
        code: error.code,
        message: error.message,
        category: error.category,
        severity: error.severity,
        context: { ...error.context, ...context },
        stack: error.stack
      }
    }

    // Handle standard errors
    let category = ErrorCategory.SYSTEM
    let severity = ErrorSeverity.MEDIUM
    let code = 'UNKNOWN_ERROR'

    // Categorize common errors
    if (error.name === 'TypeError') {
      category = ErrorCategory.BUSINESS_LOGIC
      code = 'TYPE_ERROR'
    } else if (error.name === 'ReferenceError') {
      category = ErrorCategory.BUSINESS_LOGIC
      code = 'REFERENCE_ERROR'
    } else if (error.message.includes('fetch')) {
      category = ErrorCategory.NETWORK
      code = 'NETWORK_ERROR'
    } else if (error.message.includes('timeout')) {
      category = ErrorCategory.PERFORMANCE
      code = 'TIMEOUT_ERROR'
    }

    return {
      code,
      message: error.message,
      category,
      severity,
      context,
      stack: error.stack,
      originalError: error
    }
  }

  /**
   * Log error to database
   */
  private async logError(errorDetails: ErrorDetails): Promise<void> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      await supabaseAdmin
        .from('error_logs')
        .insert({
          code: errorDetails.code,
          message: errorDetails.message,
          category: errorDetails.category,
          severity: errorDetails.severity,
          context: errorDetails.context,
          stack_trace: errorDetails.stack,
          user_id: errorDetails.context.userId,
          store_id: errorDetails.context.storeId,
          request_id: errorDetails.context.requestId,
          ip_address: errorDetails.context.ipAddress,
          user_agent: errorDetails.context.userAgent,
          endpoint: errorDetails.context.endpoint,
          method: errorDetails.context.method,
          created_at: new Date().toISOString()
        } as any)
    } catch (loggingError) {
      console.error('Failed to log error to database:', loggingError)
    }
  }

  /**
   * Report critical errors to external service
   */
  private async reportError(errorDetails: ErrorDetails): Promise<void> {
    try {
      // In a real application, you would send this to a service like Sentry, Bugsnag, etc.
      console.error('CRITICAL ERROR REPORTED:', {
        code: errorDetails.code,
        message: errorDetails.message,
        severity: errorDetails.severity,
        context: errorDetails.context,
        timestamp: new Date().toISOString()
      })

      // You could also send email notifications for critical errors
      if (errorDetails.severity === ErrorSeverity.CRITICAL) {
        await this.sendCriticalErrorNotification(errorDetails)
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  /**
   * Send critical error notification
   */
  private async sendCriticalErrorNotification(errorDetails: ErrorDetails): Promise<void> {
    try {
      // Implementation would depend on your notification system
      // This could be email, Slack, PagerDuty, etc.
      console.log('Critical error notification would be sent:', errorDetails.code)
    } catch (error) {
      console.error('Failed to send critical error notification:', error)
    }
  }

  /**
   * Create user-friendly error response
   */
  createErrorResponse(error: Error | ApplicationError): {
    error: string
    message: string
    code?: string
    details?: Record<string, unknown>
  } {
    if (error instanceof ApplicationError) {
      return {
        error: error.category,
        message: this.getUserFriendlyMessage(error),
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.context : undefined
      }
    }

    return {
      error: 'system_error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'UNKNOWN_ERROR'
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: ApplicationError): string {
    switch (error.category) {
      case ErrorCategory.AUTHENTICATION:
        return 'Please sign in to continue.'
      case ErrorCategory.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.'
      case ErrorCategory.VALIDATION:
        return error.message // Validation messages are usually user-friendly
      case ErrorCategory.DATABASE:
        return 'We\'re experiencing technical difficulties. Please try again later.'
      case ErrorCategory.EXTERNAL_API:
        return 'We\'re having trouble connecting to external services. Please try again later.'
      case ErrorCategory.NETWORK:
        return 'Network connection error. Please check your internet connection.'
      case ErrorCategory.PERFORMANCE:
        return 'The request is taking longer than expected. Please try again.'
      default:
        return 'An unexpected error occurred. Please try again later.'
    }
  }

  /**
   * Wrap async function with error handling
   */
  wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Partial<ErrorContext>
  ) {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args)
      } catch (error) {
        await this.handleError(error as Error, context)
        throw error
      }
    }
  }

  /**
   * Create error boundary for React components
   */
  createErrorBoundary(fallback: React.ComponentType<{ error: Error }>) {
    return class ErrorBoundary extends React.Component<
      { children: React.ReactNode },
      { hasError: boolean; error?: Error }
    > {
      constructor(props: { children: React.ReactNode }) {
        super(props)
        this.state = { hasError: false }
      }

      static getDerivedStateFromError(error: Error) {
        return { hasError: true, error }
      }

      componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        ErrorHandler.getInstance().handleError(error, {
          metadata: { errorInfo }
        })
      }

      render() {
        if (this.state.hasError && this.state.error) {
          const FallbackComponent = fallback
          return <FallbackComponent error={this.state.error} />
        }

        return this.props.children
      }
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Utility functions
export const handleAsync = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Partial<ErrorContext>
) => errorHandler.wrapAsync(fn, context)

export const createErrorResponse = (error: Error | ApplicationError) =>
  errorHandler.createErrorResponse(error)
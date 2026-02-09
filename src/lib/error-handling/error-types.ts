// Error types and classes for the marketing platform
export enum ErrorCategory {
  EXTERNAL_API = 'external_api',
  WEBHOOK = 'webhook',
  DATABASE = 'database',
  AUTHENTICATION = 'auth',
  CAMPAIGN = 'campaign',
  VALIDATION = 'validation',
  SYSTEM = 'system'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  userId?: string
  storeId?: string
  campaignId?: string
  contactId?: string
  requestId?: string
  userAgent?: string
  ipAddress?: string
  timestamp: Date
  additionalData?: Record<string, unknown>
}

export abstract class BaseError extends Error {
  abstract readonly category: ErrorCategory
  abstract readonly severity: ErrorSeverity
  public readonly context: ErrorContext
  public readonly retryable: boolean
  public readonly statusCode?: number

  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    retryable: boolean = false,
    statusCode?: number
  ) {
    super(message)
    this.name = this.constructor.name
    this.context = {
      timestamp: new Date(),
      ...context
    }
    this.retryable = retryable
    this.statusCode = statusCode
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      severity: this.severity,
      context: this.context,
      retryable: this.retryable,
      statusCode: this.statusCode,
      stack: this.stack
    }
  }
}

// External API Errors
export class ShopifyAPIError extends BaseError {
  readonly category = ErrorCategory.EXTERNAL_API
  readonly severity = ErrorSeverity.HIGH
  public readonly retryAfter?: number

  constructor(
    message: string,
    statusCode?: number,
    retryAfter?: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, statusCode ? statusCode >= 500 || statusCode === 429 : true, statusCode)
    this.retryAfter = retryAfter
  }
}

export class ResendAPIError extends BaseError {
  readonly category = ErrorCategory.EXTERNAL_API
  readonly severity = ErrorSeverity.HIGH

  constructor(
    message: string,
    statusCode?: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, statusCode ? statusCode >= 500 : true, statusCode)
  }
}

export class TelnyxAPIError extends BaseError {
  readonly category = ErrorCategory.EXTERNAL_API
  readonly severity = ErrorSeverity.HIGH

  constructor(
    message: string,
    statusCode?: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, statusCode ? statusCode >= 500 : true, statusCode)
  }
}

// Webhook Errors
export class WebhookValidationError extends BaseError {
  readonly category = ErrorCategory.WEBHOOK
  readonly severity = ErrorSeverity.MEDIUM

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 400)
  }
}

export class WebhookProcessingError extends BaseError {
  readonly category = ErrorCategory.WEBHOOK
  readonly severity = ErrorSeverity.HIGH

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, true)
  }
}

// Database Errors
export class DatabaseConnectionError extends BaseError {
  readonly category = ErrorCategory.DATABASE
  readonly severity = ErrorSeverity.CRITICAL

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, true)
  }
}

export class DatabaseConstraintError extends BaseError {
  readonly category = ErrorCategory.DATABASE
  readonly severity = ErrorSeverity.MEDIUM

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 400)
  }
}

export class DatabaseTransactionError extends BaseError {
  readonly category = ErrorCategory.DATABASE
  readonly severity = ErrorSeverity.HIGH

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, true)
  }
}

// Authentication Errors
export class AuthenticationError extends BaseError {
  readonly category = ErrorCategory.AUTHENTICATION
  readonly severity = ErrorSeverity.HIGH

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 401)
  }
}

export class AuthorizationError extends BaseError {
  readonly category = ErrorCategory.AUTHENTICATION
  readonly severity = ErrorSeverity.MEDIUM

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 403)
  }
}

export class TokenExpiredError extends BaseError {
  readonly category = ErrorCategory.AUTHENTICATION
  readonly severity = ErrorSeverity.MEDIUM

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, true, 401)
  }
}

// Campaign Errors
export class CampaignValidationError extends BaseError {
  readonly category = ErrorCategory.CAMPAIGN
  readonly severity = ErrorSeverity.MEDIUM

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 400)
  }
}

export class CampaignDeliveryError extends BaseError {
  readonly category = ErrorCategory.CAMPAIGN
  readonly severity = ErrorSeverity.HIGH

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, true)
  }
}

export class RateLimitError extends BaseError {
  readonly category = ErrorCategory.CAMPAIGN
  readonly severity = ErrorSeverity.MEDIUM
  public readonly retryAfter: number

  constructor(
    message: string,
    retryAfter: number,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, true, 429)
    this.retryAfter = retryAfter
  }
}

// Validation Errors
export class ValidationError extends BaseError {
  readonly category = ErrorCategory.VALIDATION
  readonly severity = ErrorSeverity.LOW
  public readonly field: string
  public readonly value: unknown

  constructor(
    message: string,
    field: string,
    value: unknown,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 400)
    this.field = field
    this.value = value
  }
}

// System Errors
export class SystemError extends BaseError {
  readonly category = ErrorCategory.SYSTEM
  readonly severity = ErrorSeverity.CRITICAL

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 500)
  }
}

export class ConfigurationError extends BaseError {
  readonly category = ErrorCategory.SYSTEM
  readonly severity = ErrorSeverity.CRITICAL

  constructor(
    message: string,
    context: Partial<ErrorContext> = {}
  ) {
    super(message, context, false, 500)
  }
}

// Error factory for creating appropriate error types
export class ErrorFactory {
  static createFromHttpStatus(
    statusCode: number,
    message: string,
    context: Partial<ErrorContext> = {}
  ): BaseError {
    switch (true) {
      case statusCode === 400:
        const validationError = new ValidationError(message, 'unknown', null, context)
        Object.assign(validationError, { statusCode })
        return validationError
      case statusCode === 401:
        const authError = new AuthenticationError(message, context)
        Object.assign(authError, { statusCode })
        return authError
      case statusCode === 403:
        const authzError = new AuthorizationError(message, context)
        Object.assign(authzError, { statusCode })
        return authzError
      case statusCode === 429:
        const rateLimitError = new RateLimitError(message, 60000, context) // Default 1 minute retry
        Object.assign(rateLimitError, { statusCode })
        return rateLimitError
      case statusCode >= 500:
        const systemError = new SystemError(message, context)
        Object.assign(systemError, { statusCode })
        return systemError
      default:
        const defaultError = new SystemError(message, context)
        Object.assign(defaultError, { statusCode })
        return defaultError
    }
  }

  static createFromDatabaseError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): BaseError {
    const message = error.message.toLowerCase()
    
    // Ensure additionalData exists in context
    const contextWithData = {
      ...context,
      additionalData: {
        ...context.additionalData,
        operation: context.additionalData?.operation || undefined
      }
    }
    
    if (message.includes('connection') || message.includes('timeout')) {
      return new DatabaseConnectionError(error.message, contextWithData)
    }
    
    if (message.includes('constraint') || message.includes('unique') || message.includes('foreign key')) {
      return new DatabaseConstraintError(error.message, contextWithData)
    }
    
    if (message.includes('transaction') || message.includes('rollback')) {
      return new DatabaseTransactionError(error.message, contextWithData)
    }
    
    return new SystemError(`Database error: ${error.message}`, contextWithData)
  }
}
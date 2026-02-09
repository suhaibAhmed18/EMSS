// Retry logic with exponential backoff
import { BaseError, ErrorSeverity } from './error-types'

export interface RetryOptions {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
  jitterMax: number
  retryCondition?: (error: Error) => boolean
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDuration: number
}

export class RetryManager {
  private static defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 30000, // 30 seconds
    backoffMultiplier: 2,
    jitterMax: 1000, // 1 second max jitter
    retryCondition: (error: Error) => {
      // Default: retry on retryable errors
      if (error instanceof BaseError) {
        return error.retryable
      }
      // Retry on network errors and 5xx status codes
      return error.message.includes('network') || 
             error.message.includes('timeout') ||
             error.message.includes('ECONNRESET') ||
             error.message.includes('ENOTFOUND')
    }
  }

  /**
   * Execute operation with retry logic and exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<RetryResult<T>> {
    const config = { ...this.defaultOptions, ...options }
    const startTime = Date.now()
    let lastError: Error | undefined
    
    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
      try {
        const data = await operation()
        return {
          success: true,
          data,
          attempts: attempt,
          totalDuration: Date.now() - startTime
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        // Don't retry on last attempt
        if (attempt > config.maxRetries) {
          break
        }
        
        // Check if error should be retried
        if (!config.retryCondition!(lastError)) {
          break
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config)
        
        console.warn(
          `Operation failed (attempt ${attempt}/${config.maxRetries + 1}), retrying in ${delay}ms:`,
          lastError.message
        )
        
        await this.sleep(delay)
      }
    }
    
    return {
      success: false,
      error: lastError,
      attempts: config.maxRetries + 1,
      totalDuration: Date.now() - startTime
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private static calculateDelay(attempt: number, options: RetryOptions): number {
    // Exponential backoff: baseDelay * (backoffMultiplier ^ (attempt - 1))
    const exponentialDelay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt - 1)
    
    // Cap at maxDelay
    const cappedDelay = Math.min(exponentialDelay, options.maxDelay)
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * options.jitterMax
    
    return cappedDelay + jitter
  }

  /**
   * Sleep for specified milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Create retry options for specific error types
   */
  static createOptionsForErrorType(errorType: 'api' | 'database' | 'webhook'): RetryOptions {
    switch (errorType) {
      case 'api':
        return {
          ...this.defaultOptions,
          maxRetries: 5,
          baseDelay: 2000,
          maxDelay: 60000,
          retryCondition: (error: Error) => {
            if (error instanceof BaseError) {
              return error.retryable && error.severity !== ErrorSeverity.LOW
            }
            return true
          }
        }
      
      case 'database':
        return {
          ...this.defaultOptions,
          maxRetries: 3,
          baseDelay: 500,
          maxDelay: 10000,
          retryCondition: (error: Error) => {
            if (error instanceof BaseError) {
              return error.retryable
            }
            // Retry on connection errors, timeouts
            return error.message.includes('connection') ||
                   error.message.includes('timeout') ||
                   error.message.includes('ECONNRESET')
          }
        }
      
      case 'webhook':
        return {
          ...this.defaultOptions,
          maxRetries: 2,
          baseDelay: 1000,
          maxDelay: 5000,
          retryCondition: (error: Error) => {
            if (error instanceof BaseError) {
              return error.retryable
            }
            return false // Don't retry webhook processing by default
          }
        }
      
      default:
        return this.defaultOptions
    }
  }
}

// Circuit breaker pattern for preventing cascading failures
export class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number = 0
  private state: 'closed' | 'open' | 'half-open' = 'closed'

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeout: number = 60000, // 1 minute
    private successThreshold: number = 2
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.recoveryTimeout) {
        throw new Error('Circuit breaker is open')
      }
      this.state = 'half-open'
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    this.failures = 0
    this.state = 'closed'
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.failureThreshold) {
      this.state = 'open'
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state
  }

  getFailureCount(): number {
    return this.failures
  }

  reset(): void {
    this.failures = 0
    this.state = 'closed'
    this.lastFailureTime = 0
  }
}

// Utility functions for common retry scenarios
export class RetryUtils {
  /**
   * Retry HTTP requests with appropriate backoff
   */
  static async retryHttpRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const result = await RetryManager.withRetry(
      requestFn,
      RetryManager.createOptionsForErrorType('api')
    )

    if (!result.success) {
      throw result.error || new Error('Request failed after retries')
    }

    return result.data!
  }

  /**
   * Retry database operations with connection handling
   */
  static async retryDatabaseOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    const result = await RetryManager.withRetry(
      operation,
      RetryManager.createOptionsForErrorType('database')
    )

    if (!result.success) {
      throw result.error || new Error('Database operation failed after retries')
    }

    return result.data!
  }

  /**
   * Retry webhook processing with limited attempts
   */
  static async retryWebhookProcessing<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    const result = await RetryManager.withRetry(
      operation,
      RetryManager.createOptionsForErrorType('webhook')
    )

    if (!result.success) {
      throw result.error || new Error('Webhook processing failed after retries')
    }

    return result.data!
  }
}
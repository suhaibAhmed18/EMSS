// Global error handler for unhandled errors and rejections
import { BaseError, SystemError } from './error-types'
import { errorLogger } from './error-logger'

export class GlobalErrorHandler {
  private static instance: GlobalErrorHandler
  private isInitialized = false

  private constructor() {}

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler()
    }
    return GlobalErrorHandler.instance
  }

  /**
   * Initialize global error handling
   */
  initialize(): void {
    if (this.isInitialized) {
      return
    }

    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      // Browser environment
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.addEventListener('error', this.handleGlobalError)
    } else {
      // Node.js environment
      process.on('unhandledRejection', this.handleUnhandledRejection)
      process.on('uncaughtException', this.handleUncaughtException)
    }

    this.isInitialized = true
    console.log('Global error handler initialized')
  }

  /**
   * Cleanup global error handlers
   */
  cleanup(): void {
    if (!this.isInitialized) {
      return
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection)
      window.removeEventListener('error', this.handleGlobalError)
    } else {
      process.off('unhandledRejection', this.handleUnhandledRejection)
      process.off('uncaughtException', this.handleUncaughtException)
    }

    this.isInitialized = false
  }

  private handleUnhandledRejection = async (event: PromiseRejectionEvent | { reason: unknown }) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    
    await errorLogger.logError(
      error instanceof BaseError ? error : new SystemError(error.message),
      {
        additionalData: {
          type: 'unhandledRejection',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined
        }
      },
      {
        originalEvent: typeof event === 'object' && event && 'type' in event ? {
          type: (event as PromiseRejectionEvent).type,
          promise: (event as PromiseRejectionEvent).promise?.toString()
        } : event
      }
    )

    // Prevent default browser behavior (logging to console)
    if (typeof event === 'object' && event && 'preventDefault' in event && typeof event.preventDefault === 'function') {
      event.preventDefault()
    }
  }

  private handleGlobalError = async (event: ErrorEvent) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message)
    
    await errorLogger.logError(
      error instanceof BaseError ? error : new SystemError(error.message),
      {
        additionalData: {
          type: 'globalError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined
        }
      },
      {
        originalEvent: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      }
    )

    // Prevent default browser behavior
    event.preventDefault()
  }

  private handleUncaughtException = async (error: Error) => {
    await errorLogger.logError(
      error instanceof BaseError ? error : new SystemError(error.message),
      {
        additionalData: {
          type: 'uncaughtException',
          pid: process.pid,
          platform: process.platform,
          nodeVersion: process.version
        }
      }
    )

    // In production, we might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      console.error('Uncaught exception occurred, shutting down gracefully...')
      process.exit(1)
    }
  }
}

// Initialize global error handler
export const globalErrorHandler = GlobalErrorHandler.getInstance()

// Auto-initialize in browser environments
if (typeof window !== 'undefined') {
  globalErrorHandler.initialize()
}

// Auto-initialize in Node.js environments (but not during testing)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  globalErrorHandler.initialize()
}
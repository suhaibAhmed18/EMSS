// React error boundaries for UI error handling
'use client'

import React, { Component, ReactNode } from 'react'
import { BaseError, SystemError } from './error-types'
import { errorLogger } from './error-logger'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorId?: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, errorId: string, retry: () => void) => ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { onError, level = 'component' } = this.props
    const { errorId } = this.state

    // Log error with React-specific context
    const logError = async () => {
      await errorLogger.logError(
        error instanceof BaseError ? error : new SystemError(error.message),
        {
          requestId: errorId,
          additionalData: {
            componentStack: errorInfo.componentStack,
            errorBoundaryLevel: level,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
          }
        },
        {
          reactErrorInfo: errorInfo,
          errorBoundaryLevel: level
        }
      )
    }

    logError().catch(console.error)

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }

    // Report to external error tracking services
    this.reportToExternalServices(error, errorInfo, errorId || 'unknown')
  }

  private reportToExternalServices(error: Error, errorInfo: React.ErrorInfo, errorId: string) {
    try {
      // Report to Sentry if configured
      if (typeof window !== 'undefined' && (window as any).Sentry) {
        const sentry = (window as any).Sentry
        
        sentry.withScope((scope: any) => {
          scope.setTag('errorBoundary', true)
          scope.setTag('errorId', errorId)
          scope.setContext('errorInfo', errorInfo)
          sentry.captureException(error)
        })
      }

      // Report to other services as needed
    } catch (reportingError) {
      console.error('Failed to report error to external services:', reportingError)
    }
  }

  private retry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  render() {
    if (this.state.hasError && this.state.error && this.state.errorId) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.state.errorId, this.retry)
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorId={this.state.errorId}
          retry={this.retry}
          level={this.props.level}
        />
      )
    }

    return this.props.children
  }
}

interface DefaultErrorFallbackProps {
  error: Error
  errorId: string
  retry: () => void
  level?: 'page' | 'component' | 'critical'
}

function DefaultErrorFallback({ error, errorId, retry, level = 'component' }: DefaultErrorFallbackProps) {
  const isProduction = process.env.NODE_ENV === 'production'
  
  const getErrorMessage = () => {
    if (isProduction) {
      switch (level) {
        case 'critical':
          return 'A critical error occurred. Please refresh the page or contact support.'
        case 'page':
          return 'Something went wrong loading this page. Please try again.'
        case 'component':
        default:
          return 'Something went wrong with this component. Please try again.'
      }
    }
    return error.message
  }

  const getErrorTitle = () => {
    switch (level) {
      case 'critical':
        return 'Critical System Error'
      case 'page':
        return 'Page Error'
      case 'component':
      default:
        return 'Component Error'
    }
  }

  return (
    <div className="error-boundary-fallback p-6 border border-red-200 rounded-lg bg-red-50">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            {getErrorTitle()}
          </h3>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-red-700">
          {getErrorMessage()}
        </p>
        
        {!isProduction && (
          <details className="mt-2">
            <summary className="text-xs text-red-600 cursor-pointer">
              Technical Details (Development Only)
            </summary>
            <pre className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      <div className="flex space-x-3">
        <button
          onClick={retry}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Try Again
        </button>
        
        {level === 'page' && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Reload Page
          </button>
        )}
        
        <span className="text-xs text-red-500 self-center">
          Error ID: {errorId}
        </span>
      </div>
    </div>
  )
}

// Specialized error boundaries for different parts of the application
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      fallback={(error, errorId, retry) => (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <DefaultErrorFallback
              error={error}
              errorId={errorId}
              retry={retry}
              level="page"
            />
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="component">
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="critical"
      fallback={(error, errorId, retry) => (
        <div className="min-h-screen flex items-center justify-center bg-red-50">
          <div className="max-w-lg w-full">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h1 className="mt-4 text-xl font-semibold text-red-900">
                Critical System Error
              </h1>
              <p className="mt-2 text-red-700">
                A critical error has occurred that prevents the application from functioning properly.
              </p>
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Reload Application
                </button>
                <p className="text-xs text-red-500">
                  Error ID: {errorId}
                </p>
                <p className="text-xs text-red-600">
                  If this problem persists, please contact support with the error ID above.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook for handling async errors in components
export function useErrorHandler() {
  const [, setState] = React.useState()
  
  return React.useCallback((error: Error) => {
    // Log the error
    errorLogger.logError(error, {
      additionalData: {
        source: 'useErrorHandler',
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
      }
    }).catch(console.error)

    // Trigger error boundary by throwing in render
    setState(() => {
      throw error
    })
  }, [])
}

// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  level: 'page' | 'component' | 'critical' = 'component'
) {
  const WrappedComponent = (props: P) => {
    const ErrorBoundaryComponent = level === 'page' ? PageErrorBoundary :
                                  level === 'critical' ? CriticalErrorBoundary :
                                  ComponentErrorBoundary

    return (
      <ErrorBoundaryComponent>
        <Component {...props} />
      </ErrorBoundaryComponent>
    )
  }

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}
// Property-based tests for error handling system
// Feature: shopify-marketing-platform, Property 30: Error Logging and Recovery
// **Validates: Requirements 9.5**

import * as fc from 'fast-check'
import { 
  BaseError, 
  ShopifyAPIError, 
  DatabaseConnectionError,
  ValidationError,
  SystemError,
  ErrorFactory,
  ErrorCategory,
  ErrorSeverity
} from '../error-types'
import { RetryManager, CircuitBreaker } from '../retry-logic'
import { ErrorLogger } from '../error-logger'
import { GlobalErrorHandler } from '../global-error-handler'

describe('Error Handling System Properties', () => {
  let errorLogger: ErrorLogger
  let globalErrorHandler: GlobalErrorHandler

  beforeEach(() => {
    errorLogger = ErrorLogger.getInstance()
    errorLogger.clearLogs()
    globalErrorHandler = GlobalErrorHandler.getInstance()
  })

  afterEach(() => {
    errorLogger.clearLogs()
    globalErrorHandler.cleanup()
  })

  describe('Property 30: Error Logging and Recovery', () => {
    test('All errors should be properly logged with context', () => {
      fc.assert(fc.property(
        fc.record({
          message: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 1),
          statusCode: fc.option(fc.integer({ min: 100, max: 599 })),
          userId: fc.option(fc.uuid()),
          storeId: fc.option(fc.uuid()),
          requestId: fc.option(fc.uuid())
        }),
        async (errorData) => {
          // Clear logs before each test
          errorLogger.clearLogs()

          // Test with a single error type to avoid complexity
          const error = new ShopifyAPIError(errorData.message, errorData.statusCode)
          const context = {
            userId: errorData.userId,
            storeId: errorData.storeId,
            requestId: errorData.requestId
          }

          // Log the error
          await errorLogger.logError(error, context)

          // Verify error was logged
          const recentLogs = errorLogger.getRecentLogs(1)
          expect(recentLogs).toHaveLength(1)

          const logEntry = recentLogs[0]
          expect(logEntry.message).toBe(errorData.message)
          expect(logEntry.error).toBe(error)
          expect(logEntry.context.userId).toBe(errorData.userId)
          expect(logEntry.context.storeId).toBe(errorData.storeId)
          expect(logEntry.context.requestId).toBe(errorData.requestId)

          // Verify error properties are preserved
          expect(error.category).toBeDefined()
          expect(error.severity).toBeDefined()
          expect(error.retryable).toBeDefined()
          expect(error.context).toBeDefined()
          expect(error.context.timestamp).toBeInstanceOf(Date)
        }
      ), { numRuns: 5 })
    })

    test('Retryable errors should be retried according to their configuration', () => {
      fc.assert(fc.property(
        fc.record({
          shouldSucceedAfter: fc.integer({ min: 1, max: 3 }),
          errorMessage: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 1),
          isRetryable: fc.boolean()
        }),
        async (testData) => {
          let attemptCount = 0
          const maxRetries = 3

          const operation = async () => {
            attemptCount++
            if (attemptCount <= testData.shouldSucceedAfter) {
              // Create a proper error with the retryable property
              if (testData.isRetryable) {
                throw new DatabaseConnectionError(testData.errorMessage) // Always retryable
              } else {
                throw new ValidationError(testData.errorMessage, 'test', 'value') // Never retryable
              }
            }
            return 'success'
          }

          const result = await RetryManager.withRetry(operation, {
            maxRetries,
            baseDelay: 1, // Very fast for testing
            maxDelay: 10,
            backoffMultiplier: 1.1,
            jitterMax: 1
          })

          if (testData.isRetryable && testData.shouldSucceedAfter <= maxRetries) {
            // Should succeed after retries
            expect(result.success).toBe(true)
            expect(result.data).toBe('success')
            expect(result.attempts).toBe(testData.shouldSucceedAfter + 1)
          } else if (!testData.isRetryable) {
            // Should fail immediately without retries
            expect(result.success).toBe(false)
            expect(result.attempts).toBe(1)
          } else {
            // Should fail after max retries
            expect(result.success).toBe(false)
            expect(result.attempts).toBe(maxRetries + 1)
          }
        }
      ), { numRuns: 5 })
    })

    test('Circuit breaker should prevent cascading failures', () => {
      fc.assert(fc.property(
        fc.record({
          failureThreshold: fc.integer({ min: 2, max: 4 }),
          consecutiveFailures: fc.integer({ min: 1, max: 6 })
        }),
        async (config) => {
          const circuitBreaker = new CircuitBreaker(
            config.failureThreshold,
            100, // Short recovery timeout
            1    // Success threshold
          )

          let callCount = 0
          const failingOperation = async () => {
            callCount++
            throw new Error(`Failure ${callCount}`)
          }

          // Generate consecutive failures
          for (let i = 0; i < config.consecutiveFailures; i++) {
            try {
              await circuitBreaker.execute(failingOperation)
            } catch (error) {
              // Expected to fail
            }
          }

          // Check circuit breaker state
          if (config.consecutiveFailures >= config.failureThreshold) {
            expect(circuitBreaker.getState()).toBe('open')
            expect(circuitBreaker.getFailureCount()).toBe(config.consecutiveFailures)

            // Should reject immediately when open
            await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Circuit breaker is open')
          } else {
            expect(circuitBreaker.getState()).toBe('closed')
            expect(circuitBreaker.getFailureCount()).toBe(config.consecutiveFailures)
          }
        }
      ), { numRuns: 5 })
    })

    test('Error metrics should accurately track error patterns', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            category: fc.constantFrom(...Object.values(ErrorCategory)),
            severity: fc.constantFrom(...Object.values(ErrorSeverity)),
            message: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length > 1)
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (errorSpecs) => {
          // Clear logs before test
          errorLogger.clearLogs()
          
          // Generate and log errors
          for (const spec of errorSpecs) {
            const error = new SystemError(spec.message)
            // Override properties for testing
            Object.defineProperty(error, 'category', { value: spec.category, writable: false })
            Object.defineProperty(error, 'severity', { value: spec.severity, writable: false })

            await errorLogger.logError(error, {})
          }

          // Get metrics
          const metrics = errorLogger.getErrorMetrics()

          // Verify error count
          expect(metrics.errorCount).toBe(errorSpecs.length)

          // Verify category breakdown
          const expectedCategories = errorSpecs.reduce((acc, spec) => {
            acc[spec.category] = (acc[spec.category] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          for (const [category, count] of Object.entries(expectedCategories)) {
            expect(metrics.errorsByCategory[category]).toBe(count)
          }

          // Verify severity breakdown
          const expectedSeverities = errorSpecs.reduce((acc, spec) => {
            acc[spec.severity] = (acc[spec.severity] || 0) + 1
            return acc
          }, {} as Record<string, number>)

          for (const [severity, count] of Object.entries(expectedSeverities)) {
            expect(metrics.errorsBySeverity[severity]).toBe(count)
          }

          // Verify error rate calculation (all logs are errors in this test)
          expect(metrics.errorRate).toBe(1.0)
        }
      ), { numRuns: 5 })
    })

    test('Error factory should create appropriate error types based on HTTP status codes', () => {
      fc.assert(fc.property(
        fc.record({
          statusCode: fc.integer({ min: 100, max: 599 }),
          message: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length > 1),
          context: fc.record({
            userId: fc.option(fc.uuid()),
            storeId: fc.option(fc.uuid()),
            requestId: fc.option(fc.uuid())
          })
        }),
        (testData) => {
          const error = ErrorFactory.createFromHttpStatus(
            testData.statusCode,
            testData.message,
            testData.context
          )

          // Verify error is a BaseError
          expect(error).toBeInstanceOf(BaseError)
          expect(error.message).toBe(testData.message)
          expect(error.statusCode).toBe(testData.statusCode)

          // Verify correct error type based on status code
          switch (true) {
            case testData.statusCode === 400:
              expect(error).toBeInstanceOf(ValidationError)
              break
            case testData.statusCode === 401:
              expect(error.name).toBe('AuthenticationError')
              break
            case testData.statusCode === 403:
              expect(error.name).toBe('AuthorizationError')
              break
            case testData.statusCode === 429:
              expect(error.name).toBe('RateLimitError')
              break
            case testData.statusCode >= 500:
              expect(error).toBeInstanceOf(SystemError)
              break
            default:
              expect(error).toBeInstanceOf(SystemError)
          }

          // Verify context is preserved
          expect(error.context.userId).toBe(testData.context.userId)
          expect(error.context.storeId).toBe(testData.context.storeId)
          expect(error.context.requestId).toBe(testData.context.requestId)
        }
      ), { numRuns: 10 })
    })

    test('Database error factory should create appropriate error types', () => {
      fc.assert(fc.property(
        fc.record({
          errorType: fc.constantFrom('connection', 'constraint', 'transaction', 'other'),
          message: fc.string({ minLength: 2, maxLength: 30 }).filter(s => s.trim().length > 1),
          context: fc.record({
            storeId: fc.option(fc.uuid()),
            operation: fc.option(fc.string({ minLength: 1, maxLength: 10 }))
          })
        }),
        (testData) => {
          // Create error message based on type
          let errorMessage = testData.message
          switch (testData.errorType) {
            case 'connection':
              errorMessage = `connection failed: ${testData.message}`
              break
            case 'constraint':
              errorMessage = `constraint violation: ${testData.message}`
              break
            case 'transaction':
              errorMessage = `transaction rollback: ${testData.message}`
              break
          }

          const originalError = new Error(errorMessage)
          const contextWithOperation = {
            ...testData.context,
            additionalData: {
              operation: testData.context.operation
            }
          }
          const error = ErrorFactory.createFromDatabaseError(originalError, contextWithOperation)

          // Verify error is a BaseError
          expect(error).toBeInstanceOf(BaseError)

          // For 'other' type, expect the factory to add "Database error: " prefix
          if (testData.errorType === 'other') {
            expect(error.message).toBe(`Database error: ${errorMessage}`)
            expect(error.category).toBe(ErrorCategory.SYSTEM) // SystemError category
          } else {
            expect(error.message).toBe(errorMessage)
            expect(error.category).toBe(ErrorCategory.DATABASE)
          }

          // Verify correct error type
          switch (testData.errorType) {
            case 'connection':
              expect(error.name).toBe('DatabaseConnectionError')
              expect(error.severity).toBe(ErrorSeverity.CRITICAL)
              expect(error.retryable).toBe(true)
              break
            case 'constraint':
              expect(error.name).toBe('DatabaseConstraintError')
              expect(error.severity).toBe(ErrorSeverity.MEDIUM)
              expect(error.retryable).toBe(false)
              break
            case 'transaction':
              expect(error.name).toBe('DatabaseTransactionError')
              expect(error.severity).toBe(ErrorSeverity.HIGH)
              expect(error.retryable).toBe(true)
              break
            default:
              expect(error).toBeInstanceOf(SystemError)
          }

          // Verify context is preserved
          expect(error.context.storeId).toBe(testData.context.storeId)
          if (testData.context.operation !== null) {
            expect(error.context.additionalData?.operation).toBe(testData.context.operation)
          }
        }
      ), { numRuns: 5 })
    })

    test('Error search and filtering should work correctly', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 2, maxLength: 20 }).filter(s => s.trim().length > 1),
            storeId: fc.uuid(),
            level: fc.constantFrom('error', 'warn', 'info')
          }),
          { minLength: 1, maxLength: 3 }
        ),
        fc.record({
          searchLevel: fc.option(fc.constantFrom('error', 'warn', 'info')),
          searchStoreId: fc.option(fc.uuid())
        }),
        async (errorSpecs, searchCriteria) => {
          // Clear logs before test
          errorLogger.clearLogs()
          
          // Generate and log errors
          for (const spec of errorSpecs) {
            if (spec.level === 'error') {
              const error = new SystemError(spec.message)
              await errorLogger.logError(error, { storeId: spec.storeId })
            } else if (spec.level === 'warn') {
              await errorLogger.logWarning(spec.message, { storeId: spec.storeId })
            } else {
              await errorLogger.logInfo(spec.message, { storeId: spec.storeId })
            }
          }

          // Search logs with limited criteria to avoid complexity
          const searchResults = errorLogger.searchLogs({
            level: searchCriteria.searchLevel,
            storeId: searchCriteria.searchStoreId
          })

          // Verify search results match criteria
          for (const result of searchResults) {
            if (searchCriteria.searchLevel) {
              expect(result.level).toBe(searchCriteria.searchLevel)
            }
            if (searchCriteria.searchStoreId) {
              expect(result.context.storeId).toBe(searchCriteria.searchStoreId)
            }
          }

          // Verify count matches expected
          const expectedCount = errorSpecs.filter(spec => {
            return (!searchCriteria.searchLevel || spec.level === searchCriteria.searchLevel) &&
                   (!searchCriteria.searchStoreId || spec.storeId === searchCriteria.searchStoreId)
          }).length

          expect(searchResults.length).toBe(expectedCount)
        }
      ), { numRuns: 3 })
    })
  })
})
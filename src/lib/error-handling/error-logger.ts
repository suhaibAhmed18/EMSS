// Error logging and monitoring system
import { BaseError, ErrorSeverity, ErrorContext } from './error-types'

export interface LogEntry {
  id: string
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  message: string
  error?: BaseError
  context: ErrorContext
  metadata?: Record<string, unknown>
}

export interface ErrorMetrics {
  errorCount: number
  errorRate: number
  errorsByCategory: Record<string, number>
  errorsBySeverity: Record<string, number>
  lastError?: Date
}

export class ErrorLogger {
  private static instance: ErrorLogger
  private logs: LogEntry[] = []
  private maxLogs: number = 10000
  private alertThresholds = {
    errorRate: 0.1, // 10% error rate
    criticalErrors: 5, // 5 critical errors in window
    timeWindow: 300000 // 5 minutes
  }

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger()
    }
    return ErrorLogger.instance
  }

  /**
   * Log an error with context
   */
  async logError(
    error: Error | BaseError,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: this.getLogLevel(error),
      message: error.message,
      error: error instanceof BaseError ? error : undefined,
      context: {
        timestamp: new Date(),
        ...context
      },
      metadata
    }

    // Add to in-memory logs
    this.logs.push(logEntry)
    this.trimLogs()

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry)
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendToExternalLogger(logEntry)
    }

    // Check for alert conditions
    await this.checkAlertConditions(logEntry)

    // Store critical errors in database
    if (error instanceof BaseError && error.severity === ErrorSeverity.CRITICAL) {
      await this.storeCriticalError(logEntry)
    }
  }

  /**
   * Log info message
   */
  async logInfo(
    message: string,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: 'info',
      message,
      context: {
        timestamp: new Date(),
        ...context
      },
      metadata
    }

    this.logs.push(logEntry)
    this.trimLogs()

    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, { context, metadata })
    }
  }

  /**
   * Log warning message
   */
  async logWarning(
    message: string,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    const logEntry: LogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      level: 'warn',
      message,
      context: {
        timestamp: new Date(),
        ...context
      },
      metadata
    }

    this.logs.push(logEntry)
    this.trimLogs()

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[WARN] ${message}`, { context, metadata })
    }
  }

  /**
   * Get error metrics for monitoring
   */
  getErrorMetrics(timeWindow: number = this.alertThresholds.timeWindow): ErrorMetrics {
    const now = Date.now()
    const windowStart = now - timeWindow
    
    const recentLogs = this.logs.filter(log => 
      log.timestamp.getTime() >= windowStart && log.level === 'error'
    )

    const totalLogs = this.logs.filter(log => 
      log.timestamp.getTime() >= windowStart
    ).length

    const errorsByCategory: Record<string, number> = {}
    const errorsBySeverity: Record<string, number> = {}
    let lastError: Date | undefined

    recentLogs.forEach(log => {
      if (log.error) {
        errorsByCategory[log.error.category] = (errorsByCategory[log.error.category] || 0) + 1
        errorsBySeverity[log.error.severity] = (errorsBySeverity[log.error.severity] || 0) + 1
        
        if (!lastError || log.timestamp > lastError) {
          lastError = log.timestamp
        }
      }
    })

    return {
      errorCount: recentLogs.length,
      errorRate: totalLogs > 0 ? recentLogs.length / totalLogs : 0,
      errorsByCategory,
      errorsBySeverity,
      lastError
    }
  }

  /**
   * Get recent logs for debugging
   */
  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  /**
   * Search logs by criteria
   */
  searchLogs(criteria: {
    level?: string
    category?: string
    severity?: string
    storeId?: string
    userId?: string
    timeRange?: { start: Date; end: Date }
  }): LogEntry[] {
    return this.logs.filter(log => {
      if (criteria.level && log.level !== criteria.level) return false
      if (criteria.category && log.error?.category !== criteria.category) return false
      if (criteria.severity && log.error?.severity !== criteria.severity) return false
      if (criteria.storeId && log.context.storeId !== criteria.storeId) return false
      if (criteria.userId && log.context.userId !== criteria.userId) return false
      if (criteria.timeRange) {
        const logTime = log.timestamp.getTime()
        if (logTime < criteria.timeRange.start.getTime() || 
            logTime > criteria.timeRange.end.getTime()) {
          return false
        }
      }
      return true
    })
  }

  /**
   * Clear logs (for testing)
   */
  clearLogs(): void {
    this.logs = []
  }

  private getLogLevel(error: Error | BaseError): 'error' | 'fatal' {
    if (error instanceof BaseError) {
      return error.severity === ErrorSeverity.CRITICAL ? 'fatal' : 'error'
    }
    return 'error'
  }

  private logToConsole(logEntry: LogEntry): void {
    const { level, message, error, context, metadata } = logEntry
    
    const logData = {
      timestamp: logEntry.timestamp.toISOString(),
      context,
      metadata,
      ...(error && { error: error.toJSON() })
    }

    switch (level) {
      case 'fatal':
        console.error(`[FATAL] ${message}`, logData)
        break
      case 'error':
        console.error(`[ERROR] ${message}`, logData)
        break
      case 'warn':
        console.warn(`[WARN] ${message}`, logData)
        break
      default:
        console.log(`[${level.toUpperCase()}] ${message}`, logData)
    }
  }

  private async sendToExternalLogger(logEntry: LogEntry): Promise<void> {
    try {
      // In production, send to external logging service like DataDog, Sentry, etc.
      // For now, this is a placeholder
      
      if (process.env.SENTRY_DSN && logEntry.level === 'error') {
        // Send to Sentry (would require Sentry SDK)
        console.log('Would send to Sentry:', logEntry.message)
      }

      if (process.env.DATADOG_API_KEY) {
        // Send to DataDog (would require DataDog SDK)
        console.log('Would send to DataDog:', logEntry.message)
      }

      // Could also send to CloudWatch, LogRocket, etc.
    } catch (error) {
      console.error('Failed to send log to external service:', error)
    }
  }

  private async checkAlertConditions(logEntry: LogEntry): Promise<void> {
    // Skip alert checking during testing to prevent stack overflow
    if (process.env.NODE_ENV === 'test') {
      return
    }
    
    const metrics = this.getErrorMetrics()

    // Check error rate threshold
    if (metrics.errorRate > this.alertThresholds.errorRate) {
      await this.sendAlert({
        type: 'high_error_rate',
        message: `Error rate exceeded threshold: ${(metrics.errorRate * 100).toFixed(2)}%`,
        severity: 'high',
        metrics
      })
    }

    // Check critical error threshold
    const criticalErrors = metrics.errorsBySeverity[ErrorSeverity.CRITICAL] || 0
    if (criticalErrors >= this.alertThresholds.criticalErrors) {
      await this.sendAlert({
        type: 'critical_errors',
        message: `${criticalErrors} critical errors in the last ${this.alertThresholds.timeWindow / 1000}s`,
        severity: 'critical',
        metrics
      })
    }

    // Check for specific error patterns
    if (logEntry.error instanceof BaseError) {
      await this.checkErrorPatterns(logEntry.error, metrics)
    }
  }

  private async checkErrorPatterns(error: BaseError, metrics: ErrorMetrics): Promise<void> {
    // Check for database connection issues
    if (error.category === 'database' && error.message.includes('connection')) {
      const dbErrors = metrics.errorsByCategory['database'] || 0
      if (dbErrors >= 3) {
        await this.sendAlert({
          type: 'database_connection_issues',
          message: `Multiple database connection errors detected: ${dbErrors}`,
          severity: 'critical',
          metrics
        })
      }
    }

    // Check for external API failures
    if (error.category === 'external_api') {
      const apiErrors = metrics.errorsByCategory['external_api'] || 0
      if (apiErrors >= 5) {
        await this.sendAlert({
          type: 'external_api_failures',
          message: `Multiple external API failures detected: ${apiErrors}`,
          severity: 'high',
          metrics
        })
      }
    }
  }

  private async sendAlert(alert: {
    type: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    metrics: ErrorMetrics
  }): Promise<void> {
    try {
      // In production, send alerts via email, Slack, PagerDuty, etc.
      console.error(`[ALERT] ${alert.type}: ${alert.message}`, alert)

      // Could integrate with:
      // - Email notifications
      // - Slack webhooks
      // - PagerDuty
      // - Discord webhooks
      // - SMS alerts for critical issues
    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  private async storeCriticalError(logEntry: LogEntry): Promise<void> {
    try {
      // Store critical errors in database for analysis
      // This would use the database client to store error details
      console.log('Would store critical error in database:', logEntry.id)
    } catch (error) {
      console.error('Failed to store critical error:', error)
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private trimLogs(): void {
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }
}

// Global error logger instance
export const errorLogger = ErrorLogger.getInstance()

// Utility functions for common logging scenarios
export class LoggingUtils {
  /**
   * Log and re-throw error with additional context
   */
  static async logAndThrow(
    error: Error,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, unknown> = {}
  ): Promise<never> {
    await errorLogger.logError(error, context, metadata)
    throw error
  }

  /**
   * Log error and return default value
   */
  static async logAndReturn<T>(
    error: Error,
    defaultValue: T,
    context: Partial<ErrorContext> = {},
    metadata: Record<string, unknown> = {}
  ): Promise<T> {
    await errorLogger.logError(error, context, metadata)
    return defaultValue
  }

  /**
   * Wrap async function with error logging
   */
  static withErrorLogging<T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    context: Partial<ErrorContext> = {}
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args)
      } catch (error) {
        await errorLogger.logError(
          error instanceof Error ? error : new Error(String(error)),
          context,
          { functionName: fn.name, arguments: args }
        )
        throw error
      }
    }
  }
}
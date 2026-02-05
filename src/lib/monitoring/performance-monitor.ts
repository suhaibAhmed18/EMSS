// Performance monitoring system
import { errorLogger } from '../error-handling'

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

export interface RequestMetrics {
  path: string
  method: string
  statusCode: number
  duration: number
  timestamp: Date
  userAgent?: string
  userId?: string
  storeId?: string
}

export interface SystemMetrics {
  memory: {
    heapUsed: number
    heapTotal: number
    rss: number
    external: number
  }
  cpu: {
    usage: number
  }
  uptime: number
  timestamp: Date
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetric[] = []
  private requestMetrics: RequestMetrics[] = []
  private maxMetrics = 10000
  private alertThresholds = {
    slowRequestMs: 5000, // 5 seconds
    highMemoryMB: 512, // 512MB
    errorRate: 0.05 // 5%
  }

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  /**
   * Record a performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string,
    tags?: Record<string, string>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    }

    this.metrics.push(metric)
    this.trimMetrics()

    // Check for performance alerts
    this.checkPerformanceAlerts(metric)
  }

  /**
   * Record request metrics
   */
  recordRequest(metrics: Omit<RequestMetrics, 'timestamp'>): void {
    const requestMetric: RequestMetrics = {
      ...metrics,
      timestamp: new Date()
    }

    this.requestMetrics.push(requestMetric)
    this.trimRequestMetrics()

    // Check for slow requests
    if (metrics.duration > this.alertThresholds.slowRequestMs) {
      this.alertSlowRequest(requestMetric)
    }

    // Record as performance metric
    this.recordMetric(
      'request_duration',
      metrics.duration,
      'ms',
      {
        path: metrics.path,
        method: metrics.method,
        status: metrics.statusCode.toString()
      }
    )
  }

  /**
   * Start timing an operation
   */
  startTimer(name: string): () => void {
    const startTime = Date.now()
    
    return () => {
      const duration = Date.now() - startTime
      this.recordMetric(name, duration, 'ms')
    }
  }

  /**
   * Measure async operation performance
   */
  async measureAsync<T>(
    name: string,
    operation: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await operation()
      const duration = Date.now() - startTime
      
      this.recordMetric(name, duration, 'ms', {
        ...tags,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.recordMetric(name, duration, 'ms', {
        ...tags,
        status: 'error'
      })
      
      throw error
    }
  }

  /**
   * Get performance metrics for a time window
   */
  getMetrics(
    timeWindowMs: number = 300000, // 5 minutes default
    metricName?: string
  ): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindowMs
    
    return this.metrics.filter(metric => {
      const matchesTime = metric.timestamp.getTime() >= cutoff
      const matchesName = !metricName || metric.name === metricName
      return matchesTime && matchesName
    })
  }

  /**
   * Get request metrics for analysis
   */
  getRequestMetrics(timeWindowMs: number = 300000): RequestMetrics[] {
    const cutoff = Date.now() - timeWindowMs
    
    return this.requestMetrics.filter(metric => 
      metric.timestamp.getTime() >= cutoff
    )
  }

  /**
   * Get aggregated performance statistics
   */
  getPerformanceStats(timeWindowMs: number = 300000): {
    requests: {
      total: number
      averageDuration: number
      p95Duration: number
      p99Duration: number
      errorRate: number
      slowRequests: number
    }
    memory: {
      current: number
      average: number
      peak: number
    }
    topSlowEndpoints: Array<{
      path: string
      method: string
      averageDuration: number
      count: number
    }>
  } {
    const requests = this.getRequestMetrics(timeWindowMs)
    const memoryMetrics = this.getMetrics(timeWindowMs, 'memory_usage')

    // Request statistics
    const totalRequests = requests.length
    const errorRequests = requests.filter(r => r.statusCode >= 400).length
    const slowRequests = requests.filter(r => r.duration > this.alertThresholds.slowRequestMs).length
    
    const durations = requests.map(r => r.duration).sort((a, b) => a - b)
    const averageDuration = durations.length > 0 
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
      : 0
    
    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)
    const p95Duration = durations[p95Index] || 0
    const p99Duration = durations[p99Index] || 0
    
    const errorRate = totalRequests > 0 ? errorRequests / totalRequests : 0

    // Memory statistics
    const memoryValues = memoryMetrics.map(m => m.value)
    const currentMemory = memoryValues[memoryValues.length - 1] || 0
    const averageMemory = memoryValues.length > 0
      ? memoryValues.reduce((sum, v) => sum + v, 0) / memoryValues.length
      : 0
    const peakMemory = Math.max(...memoryValues, 0)

    // Top slow endpoints
    const endpointStats = new Map<string, { durations: number[], count: number }>()
    
    requests.forEach(req => {
      const key = `${req.method} ${req.path}`
      const existing = endpointStats.get(key) || { durations: [], count: 0 }
      existing.durations.push(req.duration)
      existing.count++
      endpointStats.set(key, existing)
    })

    const topSlowEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => {
        const [method, path] = endpoint.split(' ', 2)
        const averageDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.durations.length
        return {
          path,
          method,
          averageDuration,
          count: stats.count
        }
      })
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 10)

    return {
      requests: {
        total: totalRequests,
        averageDuration,
        p95Duration,
        p99Duration,
        errorRate,
        slowRequests
      },
      memory: {
        current: currentMemory,
        average: averageMemory,
        peak: peakMemory
      },
      topSlowEndpoints
    }
  }

  /**
   * Record system metrics (memory, CPU, etc.)
   */
  recordSystemMetrics(): void {
    const memoryUsage = process.memoryUsage()
    
    // Record memory metrics
    this.recordMetric('memory_heap_used', memoryUsage.heapUsed / 1024 / 1024, 'MB')
    this.recordMetric('memory_heap_total', memoryUsage.heapTotal / 1024 / 1024, 'MB')
    this.recordMetric('memory_rss', memoryUsage.rss / 1024 / 1024, 'MB')
    this.recordMetric('memory_external', memoryUsage.external / 1024 / 1024, 'MB')
    
    // Record uptime
    this.recordMetric('uptime', process.uptime(), 'seconds')

    // Check memory alerts
    const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024
    if (heapUsedMB > this.alertThresholds.highMemoryMB) {
      this.alertHighMemoryUsage(heapUsedMB)
    }
  }

  /**
   * Start automatic system metrics collection
   */
  startSystemMetricsCollection(intervalMs: number = 60000): () => void {
    const interval = setInterval(() => {
      this.recordSystemMetrics()
    }, intervalMs)

    // Record initial metrics
    this.recordSystemMetrics()

    return () => clearInterval(interval)
  }

  private trimMetrics(): void {
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }
  }

  private trimRequestMetrics(): void {
    if (this.requestMetrics.length > this.maxMetrics) {
      this.requestMetrics = this.requestMetrics.slice(-this.maxMetrics)
    }
  }

  private checkPerformanceAlerts(metric: PerformanceMetric): void {
    // Check for performance degradation patterns
    if (metric.name === 'request_duration' && metric.value > this.alertThresholds.slowRequestMs) {
      // Already handled in recordRequest
      return
    }

    // Check for memory alerts
    if (metric.name === 'memory_heap_used' && metric.value > this.alertThresholds.highMemoryMB) {
      // Already handled in recordSystemMetrics
      return
    }
  }

  private async alertSlowRequest(request: RequestMetrics): Promise<void> {
    await errorLogger.logWarning(
      `Slow request detected: ${request.method} ${request.path} took ${request.duration}ms`,
      {
        additionalData: {
          path: request.path,
          method: request.method,
          duration: request.duration,
          statusCode: request.statusCode,
          userId: request.userId,
          storeId: request.storeId
        }
      },
      {
        alertType: 'slow_request',
        threshold: this.alertThresholds.slowRequestMs
      }
    )
  }

  private async alertHighMemoryUsage(memoryMB: number): Promise<void> {
    await errorLogger.logWarning(
      `High memory usage detected: ${memoryMB.toFixed(2)}MB`,
      {
        additionalData: {
          memoryUsage: memoryMB,
          threshold: this.alertThresholds.highMemoryMB
        }
      },
      {
        alertType: 'high_memory',
        threshold: this.alertThresholds.highMemoryMB
      }
    )
  }

  /**
   * Clear all metrics (for testing)
   */
  clearMetrics(): void {
    this.metrics = []
    this.requestMetrics = []
  }
}

// Singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance()

// Middleware function for Next.js API routes
export function createPerformanceMiddleware() {
  return (req: Request, res: Response, next: () => void) => {
    const startTime = Date.now()
    const url = new URL(req.url || '', 'http://localhost')
    
    // Override res.end to capture response
    const originalEnd = (res as any).end
    ;(res as any).end = function(chunk?: unknown) {
      const duration = Date.now() - startTime
      
      performanceMonitor.recordRequest({
        path: url.pathname,
        method: req.method || 'GET',
        statusCode: res.status || 200,
        duration,
        userAgent: req.headers.get('user-agent') || undefined
      })
      
      return originalEnd.call(this, chunk)
    }
    
    next()
  }
}

// Utility function to measure function execution time
export function measurePerformance<T extends unknown[], R>(
  name: string,
  fn: (...args: T) => R,
  tags?: Record<string, string>
): (...args: T) => R {
  return (...args: T): R => {
    const startTime = Date.now()
    
    try {
      const result = fn(...args)
      const duration = Date.now() - startTime
      
      performanceMonitor.recordMetric(name, duration, 'ms', {
        ...tags,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      performanceMonitor.recordMetric(name, duration, 'ms', {
        ...tags,
        status: 'error'
      })
      
      throw error
    }
  }
}

// Utility function to measure async function execution time
export function measureAsyncPerformance<T extends unknown[], R>(
  name: string,
  fn: (...args: T) => Promise<R>,
  tags?: Record<string, string>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    return performanceMonitor.measureAsync(name, () => fn(...args), tags)
  }
}
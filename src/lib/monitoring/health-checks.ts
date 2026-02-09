// Health check system for monitoring application status
import { createServiceSupabaseClient } from '../database/client'
import { config } from '../config'
import { errorLogger } from '../error-handling'

export interface HealthCheckResult {
  name: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  message?: string
  details?: Record<string, unknown>
  timestamp: Date
}

export interface SystemHealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy'
  checks: HealthCheckResult[]
  timestamp: Date
  uptime: number
}

export abstract class HealthCheck {
  abstract name: string
  abstract timeout: number

  async execute(): Promise<HealthCheckResult> {
    const startTime = Date.now()
    
    try {
      const result = await Promise.race([
        this.check(),
        this.timeoutPromise()
      ])
      
      const responseTime = Date.now() - startTime
      
      return {
        name: this.name,
        status: result.status,
        responseTime,
        message: result.message,
        details: result.details,
        timestamp: new Date()
      }
    } catch (error) {
      const responseTime = Date.now() - startTime
      const message = error instanceof Error ? error.message : 'Unknown error'
      
      await errorLogger.logError(
        error instanceof Error ? error : new Error(message),
        { additionalData: { healthCheck: this.name } }
      )
      
      return {
        name: this.name,
        status: 'unhealthy',
        responseTime,
        message,
        timestamp: new Date()
      }
    }
  }

  protected abstract check(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    message?: string
    details?: Record<string, unknown>
  }>

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Health check timeout after ${this.timeout}ms`))
      }, this.timeout)
    })
  }
}

// Database health check
export class DatabaseHealthCheck extends HealthCheck {
  name = 'database'
  timeout = 5000 // 5 seconds

  protected async check() {
    const supabase = createServiceSupabaseClient()
    
    // Test basic connectivity
    const { data, error } = await supabase
      .from('stores')
      .select('id')
      .limit(1)
    
    if (error) {
      return {
        status: 'unhealthy' as const,
        message: `Database connection failed: ${error.message}`,
        details: { error: error.message }
      }
    }

    // Test write capability (if needed)
    const writeTest = await supabase
      .from('webhook_events')
      .insert({
        store_id: 'health-check',
        topic: 'health_check',
        payload: { timestamp: new Date().toISOString() },
        processed: true
      } as any)
      .select('id')

    if (writeTest.error) {
      return {
        status: 'degraded' as const,
        message: 'Database read OK, write failed',
        details: { writeError: writeTest.error.message }
      }
    }

    // Clean up test record
    if ((writeTest.data as any)?.[0]?.id) {
      await supabase
        .from('webhook_events')
        .delete()
        .eq('id', (writeTest.data as any)[0].id)
    }

    return {
      status: 'healthy' as const,
      message: 'Database connection healthy'
    }
  }
}

// External API health checks
export class ShopifyAPIHealthCheck extends HealthCheck {
  name = 'shopify_api'
  timeout = 10000 // 10 seconds

  protected async check() {
    try {
      // Test Shopify API availability with a simple request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch('https://shopify.dev/api', {
        method: 'HEAD',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        return {
          status: 'degraded' as const,
          message: `Shopify API returned ${response.status}`,
          details: { statusCode: response.status }
        }
      }

      return {
        status: 'healthy' as const,
        message: 'Shopify API accessible'
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Shopify API unreachable',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

export class ResendAPIHealthCheck extends HealthCheck {
  name = 'resend_api'
  timeout = 10000 // 10 seconds

  protected async check() {
    if (!config.resend.apiKey) {
      return {
        status: 'unhealthy' as const,
        message: 'Resend API key not configured'
      }
    }

    try {
      // Test Resend API with a simple domains list request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch('https://api.resend.com/domains', {
        headers: {
          'Authorization': `Bearer ${config.resend.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.status === 401) {
        return {
          status: 'unhealthy' as const,
          message: 'Resend API authentication failed',
          details: { statusCode: response.status }
        }
      }

      if (!response.ok) {
        return {
          status: 'degraded' as const,
          message: `Resend API returned ${response.status}`,
          details: { statusCode: response.status }
        }
      }

      return {
        status: 'healthy' as const,
        message: 'Resend API accessible'
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Resend API unreachable',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

export class TelnyxAPIHealthCheck extends HealthCheck {
  name = 'telnyx_api'
  timeout = 10000 // 10 seconds

  protected async check() {
    if (!config.telnyx.apiKey) {
      return {
        status: 'unhealthy' as const,
        message: 'Telnyx API key not configured'
      }
    }

    try {
      // Test Telnyx API with a simple profile request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)
      
      const response = await fetch('https://api.telnyx.com/v2/phone_numbers', {
        headers: {
          'Authorization': `Bearer ${config.telnyx.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (response.status === 401) {
        return {
          status: 'unhealthy' as const,
          message: 'Telnyx API authentication failed',
          details: { statusCode: response.status }
        }
      }

      if (!response.ok) {
        return {
          status: 'degraded' as const,
          message: `Telnyx API returned ${response.status}`,
          details: { statusCode: response.status }
        }
      }

      return {
        status: 'healthy' as const,
        message: 'Telnyx API accessible'
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        message: 'Telnyx API unreachable',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

// Memory and performance health check
export class SystemResourcesHealthCheck extends HealthCheck {
  name = 'system_resources'
  timeout = 2000 // 2 seconds

  protected async check() {
    const memoryUsage = process.memoryUsage()
    const uptime = process.uptime()
    
    // Convert bytes to MB
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024)
    
    // Memory usage thresholds (in MB)
    const memoryWarningThreshold = 512 // 512MB
    const memoryCriticalThreshold = 1024 // 1GB
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    let message = 'System resources normal'
    
    if (heapUsedMB > memoryCriticalThreshold) {
      status = 'unhealthy'
      message = `Critical memory usage: ${heapUsedMB}MB`
    } else if (heapUsedMB > memoryWarningThreshold) {
      status = 'degraded'
      message = `High memory usage: ${heapUsedMB}MB`
    }
    
    return {
      status,
      message,
      details: {
        memory: {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          rss: `${rssMB}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
        },
        uptime: `${Math.round(uptime)}s`,
        nodeVersion: process.version,
        platform: process.platform
      }
    }
  }
}

// Health check manager
export class HealthCheckManager {
  private checks: HealthCheck[] = []
  private startTime = Date.now()

  constructor() {
    this.registerDefaultChecks()
  }

  private registerDefaultChecks() {
    this.checks = [
      new DatabaseHealthCheck(),
      new ShopifyAPIHealthCheck(),
      new ResendAPIHealthCheck(),
      new TelnyxAPIHealthCheck(),
      new SystemResourcesHealthCheck()
    ]
  }

  registerCheck(check: HealthCheck) {
    this.checks.push(check)
  }

  async runAllChecks(): Promise<SystemHealthStatus> {
    const results = await Promise.all(
      this.checks.map(check => check.execute())
    )

    const overall = this.determineOverallStatus(results)
    const uptime = Date.now() - this.startTime

    return {
      overall,
      checks: results,
      timestamp: new Date(),
      uptime: Math.round(uptime / 1000) // Convert to seconds
    }
  }

  async runCheck(checkName: string): Promise<HealthCheckResult | null> {
    const check = this.checks.find(c => c.name === checkName)
    if (!check) {
      return null
    }

    return await check.execute()
  }

  private determineOverallStatus(results: HealthCheckResult[]): 'healthy' | 'degraded' | 'unhealthy' {
    const hasUnhealthy = results.some(r => r.status === 'unhealthy')
    const hasDegraded = results.some(r => r.status === 'degraded')

    if (hasUnhealthy) {
      return 'unhealthy'
    }
    if (hasDegraded) {
      return 'degraded'
    }
    return 'healthy'
  }

  getRegisteredChecks(): string[] {
    return this.checks.map(c => c.name)
  }
}

// Singleton instance
export const healthCheckManager = new HealthCheckManager()
// Alerting system for critical failures
import { BaseError, ErrorSeverity } from '../error-handling/error-types'
import { errorLogger } from '../error-handling/error-logger'
import { performanceMonitor } from './performance-monitor'
import { healthCheckManager } from './health-checks'

export interface Alert {
  id: string
  type: AlertType
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  timestamp: Date
  resolved: boolean
  resolvedAt?: Date
  metadata?: Record<string, unknown>
}

export enum AlertType {
  SYSTEM_ERROR = 'system_error',
  HIGH_ERROR_RATE = 'high_error_rate',
  SLOW_RESPONSE = 'slow_response',
  HIGH_MEMORY = 'high_memory',
  EXTERNAL_API_FAILURE = 'external_api_failure',
  DATABASE_CONNECTION = 'database_connection',
  HEALTH_CHECK_FAILURE = 'health_check_failure',
  CRITICAL_BUSINESS_LOGIC = 'critical_business_logic'
}

export interface AlertRule {
  type: AlertType
  condition: (context: AlertContext) => boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldownMs: number
  title: string
  messageTemplate: string
}

export interface AlertContext {
  errorMetrics: Record<string, unknown>
  performanceStats: Record<string, unknown>
  healthStatus: Record<string, unknown>
  recentErrors: BaseError[]
  timeWindow: number
}

export class AlertManager {
  private static instance: AlertManager
  private alerts: Alert[] = []
  private rules: AlertRule[] = []
  private lastAlertTime = new Map<string, number>()
  private maxAlerts = 1000

  private constructor() {
    this.setupDefaultRules()
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager()
    }
    return AlertManager.instance
  }

  private setupDefaultRules(): void {
    this.rules = [
      {
        type: AlertType.HIGH_ERROR_RATE,
        condition: (context) => {
          const errorRate = (context.performanceStats.requests as any)?.errorRate || 0
          return errorRate > 0.1 // 10% error rate
        },
        severity: 'high',
        cooldownMs: 300000, // 5 minutes
        title: 'High Error Rate Detected',
        messageTemplate: 'Error rate is {{errorRate}}% over the last {{timeWindow}} minutes'
      },
      {
        type: AlertType.SLOW_RESPONSE,
        condition: (context) => {
          const p95Duration = (context.performanceStats.requests as any)?.p95Duration || 0
          return p95Duration > 5000 // 5 seconds
        },
        severity: 'medium',
        cooldownMs: 600000, // 10 minutes
        title: 'Slow Response Times',
        messageTemplate: '95th percentile response time is {{p95Duration}}ms'
      },
      {
        type: AlertType.HIGH_MEMORY,
        condition: (context) => {
          const currentMemory = (context.performanceStats.memory as any)?.current || 0
          return currentMemory > 512 // 512MB
        },
        severity: 'medium',
        cooldownMs: 300000, // 5 minutes
        title: 'High Memory Usage',
        messageTemplate: 'Memory usage is {{currentMemory}}MB'
      },
      {
        type: AlertType.DATABASE_CONNECTION,
        condition: (context) => {
          const checks = (context.healthStatus.checks as any[]) || []
          const dbCheck = checks.find((c: { name: string; status: string }) => c.name === 'database')
          return dbCheck && dbCheck.status === 'unhealthy'
        },
        severity: 'critical',
        cooldownMs: 60000, // 1 minute
        title: 'Database Connection Failure',
        messageTemplate: 'Database health check failed: {{dbMessage}}'
      },
      {
        type: AlertType.EXTERNAL_API_FAILURE,
        condition: (context) => {
          const checks = (context.healthStatus.checks as any[]) || []
          const apiChecks = checks.filter((c: { name: string; status: string }) => 
            c.name.includes('_api') && c.status === 'unhealthy'
          )
          return apiChecks.length > 0
        },
        severity: 'high',
        cooldownMs: 300000, // 5 minutes
        title: 'External API Failure',
        messageTemplate: 'External API health checks failing: {{failedApis}}'
      },
      {
        type: AlertType.SYSTEM_ERROR,
        condition: (context) => {
          const criticalErrors = context.recentErrors.filter(e => 
            e.severity === ErrorSeverity.CRITICAL
          )
          return criticalErrors.length >= 3 // 3 critical errors in time window
        },
        severity: 'critical',
        cooldownMs: 180000, // 3 minutes
        title: 'Multiple Critical System Errors',
        messageTemplate: '{{criticalErrorCount}} critical errors in the last {{timeWindow}} minutes'
      }
    ]
  }

  /**
   * Check all alert rules and trigger alerts if conditions are met
   */
  async checkAlerts(): Promise<Alert[]> {
    try {
      // Gather context data
      const context = await this.gatherAlertContext()
      const triggeredAlerts: Alert[] = []

      for (const rule of this.rules) {
        const ruleKey = `${rule.type}_${rule.severity}`
        const lastAlert = this.lastAlertTime.get(ruleKey) || 0
        const now = Date.now()

        // Check cooldown period
        if (now - lastAlert < rule.cooldownMs) {
          continue
        }

        // Check rule condition
        if (rule.condition(context)) {
          const alert = await this.createAlert(rule, context)
          triggeredAlerts.push(alert)
          this.lastAlertTime.set(ruleKey, now)
        }
      }

      return triggeredAlerts
    } catch (error) {
      await errorLogger.logError(
        error instanceof Error ? error : new Error('Alert check failed'),
        { additionalData: { source: 'AlertManager.checkAlerts' } }
      )
      return []
    }
  }

  /**
   * Create and send an alert
   */
  private async createAlert(rule: AlertRule, context: AlertContext): Promise<Alert> {
    const alert: Alert = {
      id: this.generateAlertId(),
      type: rule.type,
      severity: rule.severity,
      title: rule.title,
      message: this.formatMessage(rule.messageTemplate, context),
      timestamp: new Date(),
      resolved: false,
      metadata: {
        rule: rule.type,
        context: this.sanitizeContext(context)
      }
    }

    this.alerts.push(alert)
    this.trimAlerts()

    // Send alert through configured channels
    await this.sendAlert(alert)

    // Log the alert
    await errorLogger.logWarning(
      `Alert triggered: ${alert.title}`,
      {
        additionalData: {
          alertId: alert.id,
          alertType: alert.type,
          severity: alert.severity
        }
      },
      {
        alert: alert
      }
    )

    return alert
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    try {
      // Console logging (always enabled)
      console.error(`[ALERT] ${alert.severity.toUpperCase()}: ${alert.title}`, {
        message: alert.message,
        timestamp: alert.timestamp,
        metadata: alert.metadata
      })

      // Email notifications for high/critical alerts
      if (alert.severity === 'high' || alert.severity === 'critical') {
        await this.sendEmailAlert(alert)
      }

      // Slack notifications (if configured)
      if (process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackAlert(alert)
      }

      // PagerDuty for critical alerts (if configured)
      if (alert.severity === 'critical' && process.env.PAGERDUTY_INTEGRATION_KEY) {
        await this.sendPagerDutyAlert(alert)
      }

      // Discord webhook (if configured)
      if (process.env.DISCORD_WEBHOOK_URL) {
        await this.sendDiscordAlert(alert)
      }

    } catch (error) {
      console.error('Failed to send alert:', error)
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<boolean> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (!alert || alert.resolved) {
      return false
    }

    alert.resolved = true
    alert.resolvedAt = new Date()

    await errorLogger.logInfo(
      `Alert resolved: ${alert.title}`,
      {
        additionalData: {
          alertId: alert.id,
          alertType: alert.type,
          duration: alert.resolvedAt.getTime() - alert.timestamp.getTime()
        }
      }
    )

    return true
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alerts
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  private async gatherAlertContext(): Promise<AlertContext> {
    const timeWindow = 300000 // 5 minutes
    
    const [performanceStats, healthStatus] = await Promise.all([
      performanceMonitor.getPerformanceStats(timeWindow),
      healthCheckManager.runAllChecks()
    ])

    const errorMetrics = errorLogger.getErrorMetrics(timeWindow)
    const recentLogs = errorLogger.getRecentLogs(100)
    const recentErrors = recentLogs
      .filter(log => log.error)
      .map(log => log.error!)

    return {
      errorMetrics,
      performanceStats,
      healthStatus,
      recentErrors,
      timeWindow: timeWindow / 60000 // Convert to minutes
    } as any
  }

  private formatMessage(template: string, context: AlertContext): string {
    let message = template

    // Replace template variables
    message = message.replace('{{errorRate}}', (((context.performanceStats.requests as any)?.errorRate || 0) * 100).toFixed(1))
    message = message.replace('{{p95Duration}}', ((context.performanceStats.requests as any)?.p95Duration || 0).toString())
    message = message.replace('{{currentMemory}}', ((context.performanceStats.memory as any)?.current || 0).toFixed(0))
    message = message.replace('{{timeWindow}}', (context.timeWindow || 0).toString())
    message = message.replace('{{criticalErrorCount}}', context.recentErrors.filter(e => e.severity === ErrorSeverity.CRITICAL).length.toString())

    // Database message
    const checks = (context.healthStatus.checks as any[]) || []
    const dbCheck = checks.find((c: { name: string; message?: string }) => c.name === 'database')
    if (dbCheck) {
      message = message.replace('{{dbMessage}}', dbCheck.message || 'Unknown error')
    }

    // Failed APIs
    const failedApis = checks
      .filter((c: { name: string; status: string }) => c.name.includes('_api') && c.status === 'unhealthy')
      .map((c: { name: string }) => c.name)
      .join(', ')
    message = message.replace('{{failedApis}}', failedApis)

    return message
  }

  private sanitizeContext(context: AlertContext): Record<string, unknown> {
    return {
      errorCount: (context.errorMetrics as any)?.errorCount || 0,
      errorRate: (context.performanceStats.requests as any)?.errorRate || 0,
      p95Duration: (context.performanceStats.requests as any)?.p95Duration || 0,
      memoryUsage: (context.performanceStats.memory as any)?.current || 0,
      healthStatus: (context.healthStatus as any)?.overall || 'unknown',
      timeWindow: context.timeWindow || 0
    }
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    // Email alert implementation would go here
    // This would integrate with your email service
    console.log(`Would send email alert: ${alert.title}`)
  }

  private async sendSlackAlert(alert: Alert): Promise<void> {
    if (!process.env.SLACK_WEBHOOK_URL) return

    try {
      const color = alert.severity === 'critical' ? 'danger' :
                   alert.severity === 'high' ? 'warning' : 'good'

      const payload = {
        attachments: [{
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            },
            {
              title: 'Time',
              value: alert.timestamp.toISOString(),
              short: true
            }
          ]
        }]
      }

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send Slack alert:', error)
    }
  }

  private async sendPagerDutyAlert(alert: Alert): Promise<void> {
    if (!process.env.PAGERDUTY_INTEGRATION_KEY) return

    try {
      const payload = {
        routing_key: process.env.PAGERDUTY_INTEGRATION_KEY,
        event_action: 'trigger',
        dedup_key: `${alert.type}_${alert.severity}`,
        payload: {
          summary: alert.title,
          source: 'marketing-platform',
          severity: alert.severity === 'critical' ? 'critical' : 'error',
          custom_details: {
            message: alert.message,
            metadata: alert.metadata
          }
        }
      }

      await fetch('https://events.pagerduty.com/v2/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send PagerDuty alert:', error)
    }
  }

  private async sendDiscordAlert(alert: Alert): Promise<void> {
    if (!process.env.DISCORD_WEBHOOK_URL) return

    try {
      const color = alert.severity === 'critical' ? 0xFF0000 :
                   alert.severity === 'high' ? 0xFF8C00 : 0xFFFF00

      const payload = {
        embeds: [{
          title: alert.title,
          description: alert.message,
          color,
          timestamp: alert.timestamp.toISOString(),
          fields: [
            {
              name: 'Severity',
              value: alert.severity.toUpperCase(),
              inline: true
            },
            {
              name: 'Type',
              value: alert.type,
              inline: true
            }
          ]
        }]
      }

      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Failed to send Discord alert:', error)
    }
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private trimAlerts(): void {
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts)
    }
  }
}

// Singleton instance
export const alertManager = AlertManager.getInstance()

// Start periodic alert checking
export function startAlertMonitoring(intervalMs: number = 60000): () => void {
  const interval = setInterval(async () => {
    await alertManager.checkAlerts()
  }, intervalMs)

  return () => clearInterval(interval)
}
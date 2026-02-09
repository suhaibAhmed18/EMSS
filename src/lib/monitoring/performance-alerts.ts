// Performance monitoring and alerting system
import { createServiceSupabaseClient } from '../database/client'

interface PerformanceMetric {
  metric: string
  value: number
  threshold: number
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface AlertRule {
  metric: string
  threshold: number
  operator: 'gt' | 'lt' | 'eq'
  severity: 'low' | 'medium' | 'high' | 'critical'
  cooldownMs: number
}

export class PerformanceMonitor {
  private supabase = createServiceSupabaseClient()
  private alertCooldowns = new Map<string, number>()
  
  private alertRules: AlertRule[] = [
    // Database performance alerts
    {
      metric: 'db_query_time',
      threshold: 5000, // 5 seconds
      operator: 'gt',
      severity: 'high',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
    },
    {
      metric: 'db_connection_count',
      threshold: 80, // 80% of max connections
      operator: 'gt',
      severity: 'medium',
      cooldownMs: 10 * 60 * 1000, // 10 minutes
    },
    
    // API performance alerts
    {
      metric: 'api_response_time',
      threshold: 3000, // 3 seconds
      operator: 'gt',
      severity: 'medium',
      cooldownMs: 5 * 60 * 1000,
    },
    {
      metric: 'api_error_rate',
      threshold: 5, // 5% error rate
      operator: 'gt',
      severity: 'high',
      cooldownMs: 5 * 60 * 1000,
    },
    
    // Campaign performance alerts
    {
      metric: 'campaign_send_rate',
      threshold: 100, // emails per minute
      operator: 'lt',
      severity: 'medium',
      cooldownMs: 15 * 60 * 1000,
    },
    {
      metric: 'email_bounce_rate',
      threshold: 10, // 10% bounce rate
      operator: 'gt',
      severity: 'high',
      cooldownMs: 30 * 60 * 1000,
    },
    
    // System resource alerts
    {
      metric: 'memory_usage',
      threshold: 85, // 85% memory usage
      operator: 'gt',
      severity: 'high',
      cooldownMs: 5 * 60 * 1000,
    },
    {
      metric: 'disk_usage',
      threshold: 90, // 90% disk usage
      operator: 'gt',
      severity: 'critical',
      cooldownMs: 10 * 60 * 1000,
    },
  ]

  /**
   * Record performance metric
   */
  async recordMetric(metric: string, value: number, metadata?: Record<string, unknown>): Promise<void> {
    try {
      // Store metric in database
      await this.supabase
        .from('performance_metrics')
        .insert({
          metric,
          value,
          metadata: metadata || {},
          created_at: new Date().toISOString(),
        } as any)

      // Check if metric triggers any alerts
      await this.checkAlerts(metric, value)
    } catch (error) {
      console.error('Failed to record performance metric:', error)
    }
  }

  /**
   * Monitor database query performance
   */
  async monitorDatabaseQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      await this.recordMetric('db_query_time', duration, { query: queryName })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      await this.recordMetric('db_query_error', duration, { 
        query: queryName,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Monitor API endpoint performance
   */
  async monitorAPIEndpoint<T>(
    endpoint: string,
    method: string,
    handlerFn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    
    try {
      const result = await handlerFn()
      const duration = Date.now() - startTime
      
      await this.recordMetric('api_response_time', duration, { 
        endpoint,
        method,
        status: 'success'
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      await this.recordMetric('api_response_time', duration, { 
        endpoint,
        method,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      // Record error rate
      await this.recordMetric('api_error_count', 1, { endpoint, method })
      
      throw error
    }
  }

  /**
   * Monitor campaign sending performance
   */
  async monitorCampaignSending(
    campaignId: string,
    campaignType: 'email' | 'sms',
    recipientCount: number,
    sendFn: () => Promise<{ success: number; failed: number }>
  ): Promise<{ success: number; failed: number }> {
    const startTime = Date.now()
    
    try {
      const result = await sendFn()
      const duration = Date.now() - startTime
      const sendRate = (result.success / duration) * 60000 // per minute
      
      await this.recordMetric('campaign_send_rate', sendRate, {
        campaign_id: campaignId,
        campaign_type: campaignType,
        recipient_count: recipientCount,
        success_count: result.success,
        failed_count: result.failed,
      })
      
      // Record success rate
      const successRate = (result.success / recipientCount) * 100
      await this.recordMetric('campaign_success_rate', successRate, {
        campaign_id: campaignId,
        campaign_type: campaignType,
      })
      
      return result
    } catch (error) {
      await this.recordMetric('campaign_send_error', 1, {
        campaign_id: campaignId,
        campaign_type: campaignType,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      throw error
    }
  }

  /**
   * Get performance metrics for dashboard
   */
  async getPerformanceMetrics(
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<{
    apiResponseTime: { avg: number; p95: number; p99: number }
    dbQueryTime: { avg: number; p95: number; p99: number }
    errorRate: number
    campaignMetrics: {
      emailSendRate: number
      smsSendRate: number
      bounceRate: number
    }
  }> {
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    }[timeRange]

    const since = new Date(Date.now() - timeRangeMs).toISOString()

    // Get API response time metrics
    const { data: apiMetrics } = await this.supabase
      .from('performance_metrics')
      .select('value')
      .eq('metric', 'api_response_time')
      .gte('created_at', since)
      .order('value', { ascending: true })

    // Get database query time metrics
    const { data: dbMetrics } = await this.supabase
      .from('performance_metrics')
      .select('value')
      .eq('metric', 'db_query_time')
      .gte('created_at', since)
      .order('value', { ascending: true })

    // Calculate percentiles
    const calculatePercentiles = (values: number[]) => {
      if (values.length === 0) return { avg: 0, p95: 0, p99: 0 }
      
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length
      const p95Index = Math.floor(values.length * 0.95)
      const p99Index = Math.floor(values.length * 0.99)
      
      return {
        avg: Math.round(avg),
        p95: values[p95Index] || 0,
        p99: values[p99Index] || 0,
      }
    }

    const apiResponseTime = calculatePercentiles(apiMetrics?.map((m: { value: number }) => m.value) || [])
    const dbQueryTime = calculatePercentiles(dbMetrics?.map((m: { value: number }) => m.value) || [])

    // Get error rate
    const { data: errorCount } = await this.supabase
      .from('performance_metrics')
      .select('value')
      .eq('metric', 'api_error_count')
      .gte('created_at', since)

    const { data: totalRequests } = await this.supabase
      .from('performance_metrics')
      .select('value')
      .eq('metric', 'api_response_time')
      .gte('created_at', since)

    const errorRate = totalRequests && totalRequests.length > 0 
      ? ((errorCount?.length || 0) / totalRequests.length) * 100 
      : 0

    // Get campaign metrics
    const { data: campaignMetrics } = await this.supabase
      .from('performance_metrics')
      .select('metric, value, metadata')
      .in('metric', ['campaign_send_rate', 'email_bounce_rate'])
      .gte('created_at', since)

    const emailSendRate = campaignMetrics
      ?.filter((m: { metric: string; metadata?: { campaign_type?: string } }) => 
        m.metric === 'campaign_send_rate' && m.metadata?.campaign_type === 'email')
      .reduce((sum: number, m: { value: number }) => sum + m.value, 0) || 0

    const smsSendRate = campaignMetrics
      ?.filter((m: { metric: string; metadata?: { campaign_type?: string } }) => 
        m.metric === 'campaign_send_rate' && m.metadata?.campaign_type === 'sms')
      .reduce((sum: number, m: { value: number }) => sum + m.value, 0) || 0

    const bounceRateMetrics = campaignMetrics?.filter((m: { metric: string }) => m.metric === 'email_bounce_rate') || []
    const bounceRate = bounceRateMetrics.length > 0
      ? bounceRateMetrics.reduce((sum: number, m: { value: number }) => sum + m.value, 0) / bounceRateMetrics.length
      : 0

    return {
      apiResponseTime,
      dbQueryTime,
      errorRate: Math.round(errorRate * 100) / 100,
      campaignMetrics: {
        emailSendRate: Math.round(emailSendRate),
        smsSendRate: Math.round(smsSendRate),
        bounceRate: Math.round(bounceRate * 100) / 100,
      },
    }
  }

  private async checkAlerts(metric: string, value: number): Promise<void> {
    const relevantRules = this.alertRules.filter(rule => rule.metric === metric)
    
    for (const rule of relevantRules) {
      const shouldAlert = this.evaluateAlertRule(rule, value)
      
      if (shouldAlert && !this.isInCooldown(rule)) {
        await this.triggerAlert({
          metric: rule.metric,
          value,
          threshold: rule.threshold,
          timestamp: new Date(),
          severity: rule.severity,
        })
        
        this.setCooldown(rule)
      }
    }
  }

  private evaluateAlertRule(rule: AlertRule, value: number): boolean {
    switch (rule.operator) {
      case 'gt':
        return value > rule.threshold
      case 'lt':
        return value < rule.threshold
      case 'eq':
        return value === rule.threshold
      default:
        return false
    }
  }

  private isInCooldown(rule: AlertRule): boolean {
    const key = `${rule.metric}_${rule.threshold}`
    const lastAlert = this.alertCooldowns.get(key)
    
    if (!lastAlert) return false
    
    return Date.now() - lastAlert < rule.cooldownMs
  }

  private setCooldown(rule: AlertRule): void {
    const key = `${rule.metric}_${rule.threshold}`
    this.alertCooldowns.set(key, Date.now())
  }

  private async triggerAlert(metric: PerformanceMetric): Promise<void> {
    try {
      // Store alert in database
      await this.supabase
        .from('performance_alerts')
        .insert({
          metric: metric.metric,
          value: metric.value,
          threshold: metric.threshold,
          severity: metric.severity,
          created_at: metric.timestamp.toISOString(),
        } as any)

      // Send notification based on severity
      if (metric.severity === 'critical' || metric.severity === 'high') {
        await this.sendAlertNotification(metric)
      }
    } catch (error) {
      console.error('Failed to trigger alert:', error)
    }
  }

  private async sendAlertNotification(metric: PerformanceMetric): Promise<void> {
    // In a real implementation, this would send notifications via:
    // - Email
    // - Slack
    // - PagerDuty
    // - SMS
    
    console.warn(`PERFORMANCE ALERT [${metric.severity.toUpperCase()}]:`, {
      metric: metric.metric,
      value: metric.value,
      threshold: metric.threshold,
      timestamp: metric.timestamp,
    })
    
    // Example: Send to monitoring service
    // await this.sendToMonitoringService(metric)
  }
}

export const performanceMonitor = new PerformanceMonitor()
// Monitoring module exports
export * from './health-checks'
export * from './performance-monitor'
export * from './alerting'

// Import instances
import { performanceMonitor } from './performance-monitor'
import { startAlertMonitoring } from './alerting'

// Re-export commonly used utilities
export {
  healthCheckManager,
  HealthCheck,
  DatabaseHealthCheck,
  ShopifyAPIHealthCheck,
  ResendAPIHealthCheck,
  TelnyxAPIHealthCheck,
  SystemResourcesHealthCheck
} from './health-checks'

export {
  performanceMonitor,
  measurePerformance,
  measureAsyncPerformance,
  createPerformanceMiddleware
} from './performance-monitor'

export {
  alertManager,
  startAlertMonitoring,
  AlertType
} from './alerting'

// Initialize monitoring systems
export function initializeMonitoring(): {
  stopSystemMetrics: () => void
  stopAlertMonitoring: () => void
} {
  // Start system metrics collection every minute
  const stopSystemMetrics = performanceMonitor.startSystemMetricsCollection(60000)
  
  // Start alert monitoring every minute
  const stopAlertMonitoring = startAlertMonitoring(60000)
  
  console.log('Monitoring systems initialized')
  
  return {
    stopSystemMetrics,
    stopAlertMonitoring
  }
}

// Utility function to create monitoring context for requests
export function createMonitoringContext(req?: {
  url?: string
  method?: string
  headers?: Record<string, string | string[] | undefined>
}): {
  userId?: string
  storeId?: string
  userAgent?: string
  path?: string
  method?: string
} {
  if (!req) return {}

  const url = req.url ? new URL(req.url, 'http://localhost') : undefined
  
  return {
    userAgent: Array.isArray(req.headers?.['user-agent']) 
      ? req.headers['user-agent'][0] 
      : req.headers?.['user-agent'],
    path: url?.pathname,
    method: req.method,
    // Extract user/store IDs from headers or URL if available
    userId: Array.isArray(req.headers?.['x-user-id'])
      ? req.headers['x-user-id'][0]
      : req.headers?.['x-user-id'],
    storeId: Array.isArray(req.headers?.['x-store-id'])
      ? req.headers['x-store-id'][0]
      : req.headers?.['x-store-id']
  }
}
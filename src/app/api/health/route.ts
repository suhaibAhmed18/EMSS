// Health check API endpoint
import { NextRequest, NextResponse } from 'next/server'
import { healthCheckManager } from '@/lib/monitoring/health-checks'
import { performanceMonitor } from '@/lib/monitoring/performance-monitor'
import { errorLogger } from '@/lib/error-handling'

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const url = new URL(request.url)
    const checkName = url.searchParams.get('check')
    const includeDetails = url.searchParams.get('details') === 'true'
    const includePerformance = url.searchParams.get('performance') === 'true'

    let result: Record<string, unknown> | null = null

    if (checkName) {
      // Run specific health check
      const checkResult = await healthCheckManager.runCheck(checkName)
      
      if (!checkResult) {
        return NextResponse.json(
          { error: `Health check '${checkName}' not found` },
          { status: 404 }
        )
      }

      result = checkResult as unknown as Record<string, unknown>
    } else {
      // Run all health checks
      const healthStatus = await healthCheckManager.runAllChecks()
      
      result = {
        status: healthStatus.overall,
        timestamp: healthStatus.timestamp,
        uptime: healthStatus.uptime,
        checks: includeDetails ? healthStatus.checks : healthStatus.checks.map(check => ({
          name: check.name,
          status: check.status,
          responseTime: check.responseTime
        }))
      }

      // Include performance metrics if requested
      if (includePerformance) {
        const perfStats = performanceMonitor.getPerformanceStats()
        result.performance = perfStats
      }
    }

    const duration = Date.now() - startTime
    
    // Record performance metrics
    performanceMonitor.recordRequest({
      path: '/api/health',
      method: 'GET',
      statusCode: 200,
      duration,
      userAgent: request.headers.get('user-agent') || undefined
    })

    // Set appropriate status code based on health
    const statusCode = result.status === 'healthy' ? 200 :
                      result.status === 'degraded' ? 200 : 503

    return NextResponse.json(result, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })

  } catch (error) {
    const duration = Date.now() - startTime
    
    await errorLogger.logError(
      error instanceof Error ? error : new Error('Health check failed'),
      {
        additionalData: {
          path: '/api/health',
          method: 'GET'
        }
      }
    )

    performanceMonitor.recordRequest({
      path: '/api/health',
      method: 'GET',
      statusCode: 500,
      duration,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check system failure',
        timestamp: new Date()
      },
      { status: 500 }
    )
  }
}

// Simple liveness probe
export async function HEAD(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Just return 200 OK for liveness probe
    const duration = Date.now() - startTime
    
    performanceMonitor.recordRequest({
      path: '/api/health',
      method: 'HEAD',
      statusCode: 200,
      duration,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    const duration = Date.now() - startTime
    
    performanceMonitor.recordRequest({
      path: '/api/health',
      method: 'HEAD',
      statusCode: 500,
      duration,
      userAgent: request.headers.get('user-agent') || undefined
    })

    return new NextResponse(null, { status: 500 })
  }
}
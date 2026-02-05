import { NextRequest, NextResponse } from 'next/server'
import { authServer } from '@/lib/auth/server'
import { DataExportService } from '@/lib/analytics/data-export'
import { shopifyStoreManager } from '@/lib/shopify/store-manager'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const shop = searchParams.get('shop')
    
    let storeId: string
    
    if (shop) {
      // Shopify app request
      const store = await shopifyStoreManager.getStoreByDomain(shop)
      if (!store) {
        return NextResponse.json({ error: 'Store not found' }, { status: 404 })
      }
      storeId = store.id
    } else {
      // Web app request
      const user = await authServer.requireAuth()
      const stores = await shopifyStoreManager.getStoresForUser(user.id)
      if (stores.length === 0) {
        return NextResponse.json({ error: 'No store connected' }, { status: 404 })
      }
      storeId = stores[0].id
    }

    const body = await request.json()
    const { format = 'csv', type = 'all', dateRange } = body

    // Initialize export service
    const exportService = new DataExportService()
    
    let exportResult
    let error
    
    if (type === 'email' || type === 'all') {
      const result = await exportService.exportEmailCampaigns(storeId, {
        format,
        dateRange: dateRange ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined
      })
      exportResult = result.data
      error = result.error
    }
    
    if (type === 'sms' || type === 'all') {
      const result = await exportService.exportSMSCampaigns(storeId, {
        format,
        dateRange: dateRange ? {
          start: new Date(dateRange.start),
          end: new Date(dateRange.end)
        } : undefined
      })
      
      if (type === 'all' && exportResult) {
        // Combine email and SMS exports
        // This would need more sophisticated merging logic
        exportResult = result.data || exportResult
      } else {
        exportResult = result.data
        error = result.error
      }
    }

    if (error || !exportResult) {
      return NextResponse.json({ error: error?.message || 'Export failed' }, { status: 500 })
    }

    // Return the export data with appropriate headers
    return new NextResponse(exportResult.data, {
      status: 200,
      headers: {
        'Content-Type': exportResult.mimeType,
        'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
        'Content-Length': exportResult.size.toString(),
        'X-Record-Count': exportResult.recordCount.toString()
      }
    })

  } catch (error) {
    console.error('Failed to export campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to export campaigns' },
      { status: 500 }
    )
  }
}
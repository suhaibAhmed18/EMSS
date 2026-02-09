'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ScopeStatus {
  hasStore: boolean
  hasAllScopes: boolean
  grantedScopes: string[]
  missingScopes: string[]
  requiresReauth: boolean
  reauthorizationUrl?: string
  storeName?: string
  shopDomain?: string
}

export function ScopeVerificationBanner() {
  const [scopeStatus, setScopeStatus] = useState<ScopeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    checkScopes()
  }, [])

  const checkScopes = async () => {
    try {
      const response = await fetch('/api/auth/shopify/verify-scopes')
      if (response.ok) {
        const data = await response.json()
        setScopeStatus(data)
      }
    } catch (error) {
      console.error('Failed to check scopes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReauthorize = () => {
    if (scopeStatus?.reauthorizationUrl) {
      window.location.href = scopeStatus.reauthorizationUrl
    }
  }

  // Don't show banner if loading, dismissed, no store, or all scopes are granted
  if (loading || dismissed || !scopeStatus?.hasStore || scopeStatus.hasAllScopes) {
    return null
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Shopify Permissions Required
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Your Shopify store <strong>{scopeStatus.storeName}</strong> needs additional permissions to access customer data.
            </p>
            {scopeStatus.missingScopes.length > 0 && (
              <p className="mt-1">
                Missing permissions: <strong>{scopeStatus.missingScopes.join(', ')}</strong>
              </p>
            )}
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleReauthorize}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reauthorize App
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

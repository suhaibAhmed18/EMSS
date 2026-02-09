'use client'

import { useShopifyScopes } from '@/hooks/useShopifyScopes'
import { AlertCircle, CheckCircle, RefreshCw, Shield } from 'lucide-react'

export function ShopifyScopeStatus() {
  const { scopeStatus, loading, error, checkScopes, reauthorize, needsReauth } = useShopifyScopes()

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Checking permissions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="ml-2 text-sm">Failed to check permissions: {error}</span>
        </div>
      </div>
    )
  }

  if (!scopeStatus?.hasStore) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center text-gray-500">
          <Shield className="h-5 w-5" />
          <span className="ml-2 text-sm">No Shopify store connected</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Shopify Permissions
        </h3>
        <button
          onClick={checkScopes}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {/* Store Info */}
        <div>
          <p className="text-sm text-gray-500">Connected Store</p>
          <p className="text-sm font-medium text-gray-900">{scopeStatus.storeName}</p>
          <p className="text-xs text-gray-400">{scopeStatus.shopDomain}</p>
        </div>

        {/* Status */}
        <div>
          {scopeStatus.hasAllScopes ? (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="ml-2 text-sm font-medium">All permissions granted</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <AlertCircle className="h-5 w-5" />
              <span className="ml-2 text-sm font-medium">Missing permissions</span>
            </div>
          )}
        </div>

        {/* Granted Scopes */}
        {scopeStatus.grantedScopes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Granted Permissions</p>
            <div className="flex flex-wrap gap-2">
              {scopeStatus.grantedScopes.map((scope) => (
                <span
                  key={scope}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Scopes */}
        {scopeStatus.missingScopes.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Missing Permissions</p>
            <div className="flex flex-wrap gap-2">
              {scopeStatus.missingScopes.map((scope) => (
                <span
                  key={scope}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reauthorization Button */}
        {needsReauth && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={reauthorize}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reauthorize App
            </button>
            <p className="mt-2 text-xs text-gray-500 text-center">
              You'll be redirected to Shopify to grant additional permissions
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

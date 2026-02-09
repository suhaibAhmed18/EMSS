'use client'

import { useEffect, useState } from 'react'

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

export function useShopifyScopes() {
  const [scopeStatus, setScopeStatus] = useState<ScopeStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkScopes = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/auth/shopify/verify-scopes')
      
      if (!response.ok) {
        throw new Error('Failed to verify scopes')
      }
      
      const data = await response.json()
      setScopeStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Failed to check scopes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkScopes()
  }, [])

  const reauthorize = () => {
    if (scopeStatus?.reauthorizationUrl) {
      window.location.href = scopeStatus.reauthorizationUrl
    }
  }

  return {
    scopeStatus,
    loading,
    error,
    checkScopes,
    reauthorize,
    needsReauth: scopeStatus?.requiresReauth ?? false,
    hasStore: scopeStatus?.hasStore ?? false,
  }
}

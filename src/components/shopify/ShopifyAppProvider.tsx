'use client'

// Shopify App Bridge provider component
import { ReactNode, useEffect, useState } from 'react'

interface ShopifyAppProviderProps {
  children: ReactNode
}

export function ShopifyAppProvider({ children }: ShopifyAppProviderProps) {
  const [shop, setShop] = useState<string | null>(() => {
    // Initialize shop from URL parameters on mount
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      return urlParams.get('shop')
    }
    return null
  })
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // If no shop parameter, redirect to installation
    if (!shop && typeof window !== 'undefined' && window.location.pathname.startsWith('/shopify')) {
      window.location.href = '/shopify/install'
      return
    }

    // Use a timeout to avoid synchronous setState in effect
    const timer = setTimeout(() => {
      setIsReady(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [shop])

  // Don't render until we have the shop parameter and are ready
  if (!shop || !isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    )
  }

  return <>{children}</>
}
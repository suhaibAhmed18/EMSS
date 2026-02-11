'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionExpiryBannerProps {
  userId?: string
}

export default function SubscriptionExpiryBanner({ userId }: SubscriptionExpiryBannerProps) {
  const [isExpired, setIsExpired] = useState(false)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      checkSubscriptionStatus()
    }
  }, [userId])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/settings/pricing')
      if (response.ok) {
        const data = await response.json()
        setIsExpired(data.isExpired || false)
        setExpiresAt(data.expiresAt)
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !isExpired || dismissed) {
    return null
  }

  return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-red-400 hover:text-red-300"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-400 font-semibold mb-1">
            Subscription Expired
          </h3>
          <p className="text-red-300/80 text-sm mb-3">
            Your subscription has expired. You cannot send campaigns or use automations until you renew your plan. 
            Your data is safe and will be available when you reactivate.
          </p>
          <Link
            href="/settings?tab=pricing"
            className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Renew Plan
          </Link>
        </div>
      </div>
    </div>
  )
}

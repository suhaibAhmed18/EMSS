'use client'

import { useState, useEffect } from 'react'
import { Store, Globe, Calendar, CreditCard, Settings, ExternalLink, RefreshCw } from 'lucide-react'

interface StoreData {
  id: string
  shop_domain: string
  display_name: string | null
  description: string | null
  logo_url: string | null
  timezone: string
  currency: string
  plan_type: string
  subscription_status: string
  installed_at: string
  is_active: boolean
}

export default function StoreInformation() {
  const [storeData, setStoreData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStoreData()
  }, [])

  const loadStoreData = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/settings/store-info')
      
      if (response.ok) {
        const data = await response.json()
        setStoreData(data.store)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to load store information')
      }
    } catch (error) {
      console.error('Failed to load store data:', error)
      setError('Failed to load store information')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card-premium p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Store information</h2>
          <p className="text-white/60 text-sm">View your connected Shopify store details</p>
        </div>

        <div className="card-premium p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
            <Store className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Store Connected</h3>
          <p className="text-white/60 mb-6">{error}</p>
          <button 
            onClick={loadStoreData}
            className="btn-secondary inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your store? This will remove all store data and settings.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/shopify/disconnect', {
        method: 'POST',
      })

      if (response.ok) {
        // Reload to show "no store connected" state
        setStoreData(null)
        setError('')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to disconnect store')
      }
    } catch (error) {
      console.error('Failed to disconnect store:', error)
      setError('Failed to disconnect store')
    } finally {
      setLoading(false)
    }
  }

  if (!storeData) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Store information</h2>
          <p className="text-white/60 text-sm">View your connected Shopify store details</p>
        </div>

        <div className="card-premium p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/20 mb-4">
            <Store className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Store Connected</h3>
          <p className="text-white/60 mb-6">
            Connect your Shopify store to start using MarketingPro
          </p>
          <a 
            href="/stores/connect"
            className="btn-primary inline-flex items-center"
          >
            Connect Store
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Store information</h2>
        <p className="text-white/60 text-sm">View and manage your connected Shopify store</p>
      </div>

      {/* Store Header */}
      <div className="card-premium p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center">
            {storeData.logo_url ? (
              <img 
                src={storeData.logo_url} 
                alt={storeData.display_name || storeData.shop_domain}
                className="w-16 h-16 rounded-lg object-cover mr-4"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-[#16a085]/20 flex items-center justify-center mr-4">
                <Store className="w-8 h-8 text-[#16a085]" />
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                {storeData.display_name || storeData.shop_domain}
              </h3>
              <a 
                href={`https://${storeData.shop_domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#16a085] hover:underline inline-flex items-center"
              >
                {storeData.shop_domain}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              storeData.is_active 
                ? 'bg-green-500/20 text-green-400' 
                : 'bg-red-500/20 text-red-400'
            }`}>
              {storeData.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {storeData.description && (
          <p className="text-sm text-white/70 mb-6">
            {storeData.description}
          </p>
        )}

        {/* Store Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="flex items-center text-white/60 mb-2">
              <Globe className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">Domain</span>
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {storeData.shop_domain}
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="flex items-center text-white/60 mb-2">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">Plan</span>
            </div>
            <div className="text-sm font-semibold text-white capitalize">
              {storeData.plan_type}
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="flex items-center text-white/60 mb-2">
              <Calendar className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">Connected</span>
            </div>
            <div className="text-sm font-semibold text-white">
              {new Date(storeData.installed_at).toLocaleDateString()}
            </div>
          </div>

          <div className="bg-white/[0.02] rounded-lg p-4">
            <div className="flex items-center text-white/60 mb-2">
              <Settings className="w-4 h-4 mr-2" />
              <span className="text-xs font-medium">Status</span>
            </div>
            <div className="text-sm font-semibold text-white capitalize">
              {storeData.subscription_status}
            </div>
          </div>
        </div>
      </div>

      {/* Store Details */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Store Details</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-sm text-white/60">Store ID</span>
            <span className="text-sm text-white font-mono">{storeData.id}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-sm text-white/60">Shop Domain</span>
            <span className="text-sm text-white">{storeData.shop_domain}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-sm text-white/60">Display Name</span>
            <span className="text-sm text-white">
              {storeData.display_name || 'Not set'}
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-sm text-white/60">Timezone</span>
            <span className="text-sm text-white">{storeData.timezone}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-sm text-white/60">Currency</span>
            <span className="text-sm text-white">{storeData.currency}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-sm text-white/60">Plan Type</span>
            <span className="text-sm text-white capitalize">{storeData.plan_type}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <span className="text-sm text-white/60">Subscription Status</span>
            <span className={`text-sm font-medium capitalize ${
              storeData.subscription_status === 'active' 
                ? 'text-green-400' 
                : 'text-yellow-400'
            }`}>
              {storeData.subscription_status}
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-white/60">Installed At</span>
            <span className="text-sm text-white">
              {new Date(storeData.installed_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Store Actions</h3>
        
        <div className="space-y-3">
          <a
            href={`https://${storeData.shop_domain}/admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full btn-secondary inline-flex items-center justify-center"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open Shopify Admin
          </a>

          <button
            onClick={loadStoreData}
            className="w-full px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] text-white rounded-lg transition-colors inline-flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Store Data
          </button>

          <button
            onClick={handleDisconnect}
            disabled={loading}
            className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Store className="w-4 h-4 mr-2" />
            Disconnect Store
          </button>
        </div>
      </div>
    </div>
  )
}

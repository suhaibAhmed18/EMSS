'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/lib/auth/session'
import { Plus, Store, Users, TrendingUp, Mail, MessageSquare, Zap, DollarSign, ShoppingCart, Activity, Settings, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface StoreData {
  id: string
  shop_domain: string
  store_name: string
  store_email: string
  currency: string
  plan_name: string
  is_active: boolean
  created_at: string
  analytics?: {
    totalContacts: number
    emailCampaigns: number
    smsCampaigns: number
    automations: number
    revenue: number
  }
}

export default function StoresPage() {
  const { user, loading } = useRequireAuth()
  const [stores, setStores] = useState<StoreData[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadStores()
    }
    
    // Check for error parameters in URL
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const detailsParam = params.get('details')
    
    if (errorParam === 'limit_reached') {
      setError('You can only connect one store at a time. Please disconnect your existing store first.')
    }
  }, [user])

  const loadStores = async () => {
    try {
      setLoadingStores(true)
      setError(null)
      
      const response = await fetch('/api/stores')
      if (!response.ok) {
        throw new Error('Failed to load stores')
      }
      
      const data = await response.json()
      setStores(data.stores || [])
    } catch (error) {
      console.error('Failed to load stores:', error)
      setError('Failed to load stores. Please try again.')
    } finally {
      setLoadingStores(false)
    }
  }

  const handleDisconnectStore = async (storeId: string, storeName: string) => {
    if (!confirm(`⚠️ WARNING: This will PERMANENTLY delete ${storeName} and ALL associated data (contacts, campaigns, etc.).\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      return
    }

    try {
      console.log('Attempting to permanently delete store:', storeId)
      
      // Show loading state
      setLoadingStores(true)
      
      // Try Method 1: DELETE /api/stores/[id]
      console.log('Method 1: Trying DELETE /api/stores/' + storeId)
      let response = await fetch(`/api/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      // If 404, try Method 2: POST /api/stores/delete
      if (response.status === 404) {
        console.log('Method 1 failed with 404, trying Method 2: POST /api/stores/delete')
        response = await fetch('/api/stores/delete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ storeId })
        })
      }

      console.log('Delete response status:', response.status)
      const responseData = await response.json().catch(() => ({}))
      console.log('Delete response data:', responseData)
      
      if (!response.ok) {
        console.error('Delete failed with error:', responseData)
        throw new Error(responseData.error || responseData.details || `Failed to delete store (${response.status})`)
      }

      console.log('Store permanently deleted successfully')
      
      // Show success message
      alert(`✅ ${storeName} has been permanently deleted!\n\nAll associated data has been removed.`)
      
      // Reload stores
      await loadStores()
    } catch (error) {
      console.error('Failed to delete store:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`❌ Failed to delete store: ${errorMessage}\n\nPlease check the browser console for more details.`)
    } finally {
      setLoadingStores(false)
    }
  }

  const handleConnectStore = () => {
    window.location.href = '/stores/connect'
  }

  if (loading || loadingStores) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Connected Stores
            </h1>
            <p className="text-gray-400 mt-2">
              {stores.length > 0 
                ? 'You can connect one Shopify store at a time' 
                : 'Connect your Shopify store to start marketing'}
            </p>
          </div>
          {stores.length === 0 && (
            <button
              onClick={handleConnectStore}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Connect Store
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Stores Grid */}
        {stores.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No stores connected</h3>
            <p className="text-gray-500 mb-6">Connect your first Shopify store to start marketing</p>
            <button
              onClick={handleConnectStore}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Connect Your First Store
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <div key={store.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                {/* Store Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{store.store_name}</h3>
                      <p className="text-sm text-gray-400">{store.shop_domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`https://${store.shop_domain}/admin`}
                      target="_blank"
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Open Shopify Admin"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDisconnectStore(store.id, store.store_name)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Disconnect Store"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Store Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Plan:</span>
                    <span className="text-white capitalize">{store.plan_name || 'Basic'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Currency:</span>
                    <span className="text-white">{store.currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`${store.is_active ? 'text-green-400' : 'text-red-400'}`}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Analytics */}
                {store.analytics && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-gray-400">Contacts</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{store.analytics.totalContacts}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-gray-400">Revenue</span>
                      </div>
                      <p className="text-lg font-semibold text-white">${store.analytics.revenue.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Mail className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-gray-400">Campaigns</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{store.analytics.emailCampaigns + store.analytics.smsCampaigns}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-gray-400">Automations</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{store.analytics.automations}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard?store=${store.id}`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    View Dashboard
                  </Link>
                  <Link
                    href={`/contacts?store=${store.id}`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Manage Contacts
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {stores.length > 0 && (
          <div className="mt-12 bg-gray-900/30 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Store className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Total Stores</span>
                </div>
                <p className="text-2xl font-bold text-white">{stores.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">Total Contacts</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stores.reduce((sum, store) => sum + (store.analytics?.totalContacts || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Total Campaigns</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {stores.reduce((sum, store) => sum + (store.analytics?.emailCampaigns || 0) + (store.analytics?.smsCampaigns || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${stores.reduce((sum, store) => sum + (store.analytics?.revenue || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
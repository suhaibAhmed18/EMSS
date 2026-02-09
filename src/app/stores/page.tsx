'use client'

import { useState, useEffect } from 'react'
import { useRequireAuth } from '@/lib/auth/session'
import { Plus, Store, Users, Mail, Zap, DollarSign, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { toast } from '@/components/ui/toaster'

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
    
    // Check for error or success parameters in URL
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const detailsParam = params.get('details')
    const connected = params.get('connected')
    const status = params.get('status')
    const message = params.get('message')
    
    if (errorParam === 'limit_reached') {
      setError('You can only connect one store at a time. Please disconnect your existing store first.')
    }
    
    // If store was just connected, show success and refetch stores
    if (connected && status === 'success' && user) {
      toast({
        type: 'success',
        title: 'Store Connected!',
        description: message || 'Your Shopify store has been connected successfully.',
        duration: 5000
      })
      
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname)
      
      // Refetch stores to show the new store
      setTimeout(() => {
        loadStores()
      }, 1000)
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
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-56 rounded-xl bg-white/[0.06]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium">Connected Store</h1>
          <p className="mt-2 text-white/60">
            {stores.length > 0 ? 'You can connect one Shopify store at a time.' : 'Connect your Shopify store to start marketing.'}
          </p>
        </div>
        {stores.length === 0 && (
          <button onClick={handleConnectStore} className="btn-primary w-fit">
            <Plus className="w-4 h-4" />
            Connect Store
          </button>
        )}
      </div>

      {error && (
        <div className="card-premium p-4 border-red-400/20">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {stores.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <Store className="w-14 h-14 text-white/35 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No stores connected</h3>
          <p className="text-white/55 mb-6">Connect your first Shopify store to start marketing.</p>
          <button onClick={handleConnectStore} className="btn-primary">
            <Plus className="w-4 h-4" />
            Connect Your First Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="card-premium-hover p-6">
              <div className="flex items-start justify-between mb-5 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shrink-0">
                    <Store className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{store.store_name}</h3>
                    <p className="text-sm text-white/55 truncate">{store.shop_domain}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`https://${store.shop_domain}/admin`}
                    target="_blank"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Open Shopify Admin"
                    aria-label="Open Shopify Admin"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>

                {/* Store Info */}
              <div className="space-y-2 mb-5 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Plan</span>
                  <span className="text-white capitalize">{store.plan_name || 'Basic'}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Currency</span>
                  <span className="text-white">{store.currency}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-white/55">Status</span>
                  <span className={store.is_active ? 'badge badge-success' : 'badge badge-danger'}>
                    {store.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

                {/* Analytics */}
                {store.analytics && (
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1 text-white/60">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Contacts</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{store.analytics.totalContacts}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1 text-white/60">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Revenue</span>
                      </div>
                      <p className="text-lg font-semibold text-white">${store.analytics.revenue.toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1 text-white/60">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">Campaigns</span>
                      </div>
                      <p className="text-lg font-semibold text-white">
                        {store.analytics.emailCampaigns + store.analytics.smsCampaigns}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1 text-white/60">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm">Automations</span>
                      </div>
                      <p className="text-lg font-semibold text-white">{store.analytics.automations}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Link href={`/dashboard?store=${store.id}`} className="btn-secondary w-full justify-center">
                  View Dashboard
                </Link>
                <Link href={`/contacts?store=${store.id}`} className="btn-ghost w-full justify-center">
                  Manage Contacts
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* Summary Stats */}
        {stores.length > 0 && (
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Account Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Store className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Stores</span>
              </div>
              <p className="text-2xl font-semibold text-white">{stores.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Contacts</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {stores.reduce((sum, store) => sum + (store.analytics?.totalContacts || 0), 0)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Campaigns</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {stores.reduce(
                  (sum, store) =>
                    sum + (store.analytics?.emailCampaigns || 0) + (store.analytics?.smsCampaigns || 0),
                  0
                )}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Revenue</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                ${stores.reduce((sum, store) => sum + (store.analytics?.revenue || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        )}
    </div>
  )
}

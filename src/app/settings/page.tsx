'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  User, 
  Store, 
  Shield, 
  CreditCard,
  Globe,
  Key,
  Database,
  Zap,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import NotificationSystem from '@/components/notifications/NotificationSystem'

const settingsTabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'shopify', name: 'Shopify', icon: Store },
  { id: 'security', name: 'Security', icon: Shield },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [shopifyData, setShopifyData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [emailDomainVerified] = useState(true) // Mock value for demo
  const { notifications, removeNotification, showSuccess, showError } = useNotifications()
  
  // Settings form state
  const [settings, setSettings] = useState({
    firstName: '',
    lastName: '',
    email: '',
    emailFromName: '',
    emailFromAddress: '',
    customDomain: '',
    smsFromNumber: '',
    messagingProfileId: '',
    enableEmailMarketing: true,
    enableSmsMarketing: false,
    autoSyncContacts: true,
    syncFrequency: 'daily'
  })
  const [saving, setSaving] = useState(false)

  // Password update state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [updatingPassword, setUpdatingPassword] = useState(false)

  // Load Shopify data when the Shopify tab is active
  useEffect(() => {
    if (activeTab === 'shopify' && !shopifyData) {
      loadShopifyData()
    }
  }, [activeTab])

  // Load settings when component mounts
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      // Set some default values for demo
      setSettings(prev => ({
        ...prev,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }))
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings }),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      showSuccess('Settings Saved', 'Your configuration has been updated successfully')
    } catch (error) {
      showError('Save Failed', 'Could not save your settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const loadShopifyData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/shopify')
      if (!response.ok) {
        throw new Error('Failed to load Shopify data')
      }
      const data = await response.json()
      setShopifyData(data)
    } catch (error) {
      showError('Failed to Load', 'Could not load Shopify integration data')
    } finally {
      setLoading(false)
    }
  }

  const toggleWebhook = async (webhookName: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/settings/shopify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'toggle_webhook',
          webhookName,
          enabled
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update webhook')
      }

      // Update local state
      setShopifyData((prev: any) => ({
        ...prev,
        webhooks: prev.webhooks.map((webhook: any) =>
          webhook.name === webhookName ? { ...webhook, enabled } : webhook
        )
      }))

      showSuccess('Webhook Updated', `${webhookName} has been ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      showError('Update Failed', 'Could not update webhook settings')
    }
  }

  const syncShopifyData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/shopify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync_data'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to sync data')
      }

      await loadShopifyData() // Reload data after sync
      showSuccess('Sync Complete', 'Shopify data has been synchronized successfully')
    } catch (error) {
      showError('Sync Failed', 'Could not synchronize Shopify data')
    } finally {
      setLoading(false)
    }
  }
  const handleDisconnectShopify = async () => {
    if (!shopifyData?.connected || !shopifyData?.store) {
      return
    }

    const storeName = shopifyData.store.domain || 'your store'

    if (!confirm(`⚠️ WARNING: This will PERMANENTLY delete ${storeName} and ALL associated data (contacts, campaigns, automations, etc.).\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      return
    }

    try {
      setLoading(true)

      const response = await fetch('/api/auth/shopify/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to disconnect store')
      }

      showSuccess('Store Disconnected', `${storeName} has been permanently deleted along with all associated data`)

      // Reload Shopify data to reflect disconnection
      await loadShopifyData()
    } catch (error) {
      console.error('Failed to disconnect store:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showError('Disconnect Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async () => {
    try {
      // Validate passwords
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showError('Validation Error', 'All password fields are required')
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showError('Validation Error', 'New passwords do not match')
        return
      }

      if (passwordData.newPassword.length < 8) {
        showError('Validation Error', 'New password must be at least 8 characters long')
        return
      }

      setUpdatingPassword(true)
      const response = await fetch('/api/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password')
      }

      showSuccess('Password Updated', 'Your password has been changed successfully')
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      showError('Update Failed', error.message || 'Could not update password. Please try again.')
    } finally {
      setUpdatingPassword(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={settings.firstName}
                    onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={settings.lastName}
                    onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="input-premium w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={saveSettings}
                disabled={saving}
                className="btn-primary"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )

      case 'shopify':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Shopify Integration</h3>
                <button
                  onClick={syncShopifyData}
                  disabled={loading}
                  className="btn-ghost"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? 'Syncing...' : 'Sync Data'}
                </button>
              </div>
              
              {loading && !shopifyData ? (
                <div className="card-premium p-6">
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading Shopify data...</p>
                  </div>
                </div>
              ) : shopifyData ? (
                <>
                  <div className="card-premium p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${shopifyData.connected ? 'bg-green-400' : 'bg-red-400'}`} />
                        <div>
                          <h4 className="font-medium text-white">Store Connection</h4>
                          <p className="text-sm text-gray-400">
                            {shopifyData.connected ? `Connected to ${shopifyData.store.domain}` : 'Not connected'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={shopifyData.connected ? handleDisconnectShopify : () => window.location.href = '/stores/connect'}
                        disabled={loading}
                        className={`${shopifyData.connected ? 'btn-secondary' : 'btn-primary'} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {shopifyData.connected ? 'Disconnect' : 'Connect Store'}
                      </button>
                    </div>
                    
                    {shopifyData.connected && (
                      <>
                        <div className="border-t border-gray-700 pt-4 mb-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-2xl font-bold text-white">{shopifyData.stats.products.toLocaleString()}</div>
                              <div className="text-sm text-gray-400">Products</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-white">{shopifyData.stats.customers.toLocaleString()}</div>
                              <div className="text-sm text-gray-400">Customers</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-white">{shopifyData.stats.orders.toLocaleString()}</div>
                              <div className="text-sm text-gray-400">Orders</div>
                            </div>
                            <div>
                              <div className="text-2xl font-bold text-white">${shopifyData.stats.revenue.toLocaleString()}</div>
                              <div className="text-sm text-gray-400">Revenue</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-700 pt-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Store Name:</span>
                              <span className="text-white ml-2">{shopifyData.store.name}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Plan:</span>
                              <span className="text-white ml-2">{shopifyData.store.plan}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Currency:</span>
                              <span className="text-white ml-2">{shopifyData.store.currency}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Last Sync:</span>
                              <span className="text-white ml-2">
                                {new Date(shopifyData.lastSync).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="card-premium p-6">
                  <div className="text-center py-8">
                    <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Connect Your Shopify Store</h3>
                    <p className="text-gray-400 mb-6">
                      Connect your Shopify store to sync customers, orders, and products
                    </p>
                    <button className="btn-primary">
                      Connect Shopify Store
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Password</h3>
              <div className="card-premium p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      className="input-premium w-full"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      disabled={updatingPassword}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="input-premium w-full"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      disabled={updatingPassword}
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="input-premium w-full"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      disabled={updatingPassword}
                    />
                  </div>
                  <button 
                    className="btn-primary"
                    onClick={updatePassword}
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-premium mb-2">Settings</h1>
        <p className="text-white/60">Manage your account and platform configuration.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="card-premium p-6">
            <nav className="space-y-2">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-left rounded-xl border transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white/[0.06] border-white/10 text-white'
                      : 'border-transparent text-white/70 hover:text-white hover:bg-white/[0.04] hover:border-white/10'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-3" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="card-premium p-6">{renderTabContent()}</div>
        </div>
      </div>
      
      {/* Notification System */}
      <NotificationSystem 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
    </div>
  )
}

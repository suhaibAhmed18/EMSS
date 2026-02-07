'use client'

import { useState, useEffect } from 'react'
import { 
  Settings, 
  User, 
  Store, 
  Mail, 
  MessageSquare, 
  Shield, 
  CreditCard,
  Bell,
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
  { id: 'email', name: 'Email', icon: Mail },
  { id: 'sms', name: 'SMS', icon: MessageSquare },
  { id: 'notifications', name: 'Notifications', icon: Bell },
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
    phone: '',
    companyName: '',
    industry: '',
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
        email: 'john@example.com',
        phone: '+1 (555) 123-4567',
        companyName: 'My Store',
        industry: 'Fashion & Apparel'
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
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="input-premium w-full"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    className="input-premium w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Industry
                  </label>
                  <select 
                    value={settings.industry}
                    onChange={(e) => setSettings(prev => ({ ...prev, industry: e.target.value }))}
                    className="input-premium w-full"
                  >
                    <option>Fashion & Apparel</option>
                    <option>Electronics</option>
                    <option>Home & Garden</option>
                    <option>Health & Beauty</option>
                    <option>Sports & Outdoors</option>
                    <option>Other</option>
                  </select>
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
                      <button className={`${shopifyData.connected ? 'btn-secondary' : 'btn-primary'}`}>
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

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Webhook Settings</h3>
                    <div className="space-y-4">
                      {shopifyData.webhooks.map((webhook: any) => (
                        <div key={webhook.name} className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                          <div>
                            <h4 className="font-medium text-white">{webhook.name}</h4>
                            <p className="text-sm text-gray-400">
                              {webhook.enabled ? 'Active' : 'Inactive'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{webhook.url}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={webhook.enabled}
                              onChange={(e) => toggleWebhook(webhook.name, e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[color:var(--accent)]"></div>
                          </label>
                        </div>
                      ))}
                    </div>
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

      case 'email':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Email Configuration</h3>
              <div className="card-premium p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Resend API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value="re_configured_in_environment"
                      className="input-premium w-full pr-10"
                      disabled
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <span className="text-xs">Configured</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">API key is configured in environment variables</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    From Name
                  </label>
                  <input
                    type="text"
                    value={settings.emailFromName}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailFromName: e.target.value }))}
                    placeholder="Your Store Name"
                    className="input-premium w-full"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    From Email
                  </label>
                  <input
                    type="email"
                    value={settings.emailFromAddress}
                    onChange={(e) => setSettings(prev => ({ ...prev, emailFromAddress: e.target.value }))}
                    placeholder="hello@mystore.com"
                    className="input-premium w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Custom Domain</h3>
              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${emailDomainVerified ? 'bg-green-400' : 'bg-yellow-400'}`} />
                    <div>
                      <h4 className="font-medium text-white">mystore.com</h4>
                      <p className="text-sm text-gray-400">
                        {emailDomainVerified ? 'Verified and active' : 'Pending verification'}
                      </p>
                    </div>
                  </div>
                  <button className="btn-secondary">
                    {emailDomainVerified ? 'Manage' : 'Verify'}
                  </button>
                </div>

                {emailDomainVerified && (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">98.2%</div>
                        <div className="text-sm text-gray-400">Delivery Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">1.8%</div>
                        <div className="text-sm text-gray-400">Bounce Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">0.1%</div>
                        <div className="text-sm text-gray-400">Spam Rate</div>
                      </div>
                    </div>
                  </div>
                )}
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

      case 'sms':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">SMS Configuration</h3>
              <div className="card-premium p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Telnyx API Key
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value="KEY_configured_in_environment"
                      className="input-premium w-full pr-10"
                      disabled
                      readOnly
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      <span className="text-xs">Configured</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">API key is configured in environment variables</p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.smsFromNumber}
                    onChange={(e) => setSettings(prev => ({ ...prev, smsFromNumber: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="input-premium w-full"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Messaging Profile ID
                  </label>
                  <input
                    type="text"
                    value={settings.messagingProfileId}
                    onChange={(e) => setSettings(prev => ({ ...prev, messagingProfileId: e.target.value }))}
                    placeholder="profile_1234567890"
                    className="input-premium w-full"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">SMS Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">Auto-opt out on STOP</h4>
                    <p className="text-sm text-gray-400">Automatically unsubscribe users who reply STOP</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[color:var(--accent)]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div>
                    <h4 className="font-medium text-white">Delivery receipts</h4>
                    <p className="text-sm text-gray-400">Track message delivery status</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[color:var(--accent)]"></div>
                  </label>
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

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
              <div className="space-y-4">
                {[
                  { name: 'Campaign completed', description: 'Get notified when campaigns finish sending', enabled: true },
                  { name: 'Automation triggered', description: 'Get notified when automations are triggered', enabled: false },
                  { name: 'Weekly reports', description: 'Receive weekly performance summaries', enabled: true },
                  { name: 'Monthly reports', description: 'Receive monthly performance summaries', enabled: true },
                  { name: 'System alerts', description: 'Important system notifications and updates', enabled: true },
                ].map((notification) => (
                  <div key={notification.name} className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div>
                      <h4 className="font-medium text-white">{notification.name}</h4>
                      <p className="text-sm text-gray-400">{notification.description}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={notification.enabled} className="sr-only peer" />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[color:var(--accent)]"></div>
                    </label>
                  </div>
                ))}
              </div>
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="input-premium w-full"
                    />
                  </div>
                  <button className="btn-primary">Update Password</button>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Account Security</h3>
              <div className="card-premium p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div>
                      <h4 className="font-medium text-white">API Access</h4>
                      <p className="text-sm text-gray-400">Email and SMS API keys are configured securely</p>
                    </div>
                    <div className="text-green-400 text-sm font-medium">
                      ✓ Configured
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div>
                      <h4 className="font-medium text-white">Data Encryption</h4>
                      <p className="text-sm text-gray-400">All sensitive data is encrypted at rest</p>
                    </div>
                    <div className="text-green-400 text-sm font-medium">
                      ✓ Enabled
                    </div>
                  </div>
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import { 
  Plus, 
  Zap, 
  Mail, 
  MessageSquare, 
  Clock, 
  Users, 
  ShoppingCart, 
  UserPlus, 
  DollarSign,
  Save,
  ArrowLeft,
  Settings,
  Trash2
} from 'lucide-react'

interface Store {
  id: string
  shop_domain: string
  store_name: string
}

interface AutomationAction {
  id: string
  type: 'send_email' | 'send_sms' | 'wait' | 'add_tag' | 'remove_tag'
  delay: number
  config: any
}

const TRIGGER_TYPES = [
  {
    id: 'customer_created',
    name: 'Customer Created',
    description: 'When a new customer signs up or is created',
    icon: <UserPlus className="w-5 h-5" />
  },
  {
    id: 'cart_abandoned',
    name: 'Cart Abandoned',
    description: 'When a customer abandons their cart',
    icon: <ShoppingCart className="w-5 h-5" />
  },
  {
    id: 'order_placed',
    name: 'Order Placed',
    description: 'When a customer completes a purchase',
    icon: <DollarSign className="w-5 h-5" />
  },
  {
    id: 'email_opened',
    name: 'Email Opened',
    description: 'When a customer opens an email campaign',
    icon: <Mail className="w-5 h-5" />
  }
]

const ACTION_TYPES = [
  {
    id: 'send_email',
    name: 'Send Email',
    description: 'Send an email to the customer',
    icon: <Mail className="w-5 h-5" />
  },
  {
    id: 'send_sms',
    name: 'Send SMS',
    description: 'Send an SMS to the customer',
    icon: <MessageSquare className="w-5 h-5" />
  },
  {
    id: 'wait',
    name: 'Wait',
    description: 'Wait for a specified amount of time',
    icon: <Clock className="w-5 h-5" />
  },
  {
    id: 'add_tag',
    name: 'Add Tag',
    description: 'Add a tag to the customer',
    icon: <Plus className="w-5 h-5" />
  }
]

export default function CreateAutomationPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    store_id: '',
    name: '',
    description: '',
    trigger_type: '',
    trigger_config: {},
    is_active: true
  })
  const [actions, setActions] = useState<AutomationAction[]>([])

  useEffect(() => {
    if (user) {
      loadStores()
    }
  }, [user])

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
        if (data.stores?.length > 0) {
          setFormData(prev => ({ ...prev, store_id: data.stores[0].id }))
        }
      }
    } catch (error) {
      console.error('Failed to load stores:', error)
    } finally {
      setLoadingStores(false)
    }
  }

  const addAction = (type: string) => {
    const newAction: AutomationAction = {
      id: Date.now().toString(),
      type: type as any,
      delay: 0,
      config: getDefaultActionConfig(type)
    }
    setActions([...actions, newAction])
  }

  const getDefaultActionConfig = (type: string) => {
    switch (type) {
      case 'send_email':
        return {
          subject: '',
          content: '',
          template: ''
        }
      case 'send_sms':
        return {
          message: ''
        }
      case 'wait':
        return {
          duration: 24,
          unit: 'hours'
        }
      case 'add_tag':
        return {
          tag: ''
        }
      default:
        return {}
    }
  }

  const updateAction = (actionId: string, updates: Partial<AutomationAction>) => {
    setActions(actions.map(action => 
      action.id === actionId ? { ...action, ...updates } : action
    ))
  }

  const removeAction = (actionId: string) => {
    setActions(actions.filter(action => action.id !== actionId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.trigger_type || !formData.store_id) {
      alert('Please fill in all required fields')
      return
    }

    if (actions.length === 0) {
      alert('Please add at least one action')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          actions: actions.map(({ id, ...action }) => action)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create automation')
      }

      router.push('/automations')
    } catch (error) {
      console.error('Failed to create automation:', error)
      alert('Failed to create automation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingStores) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-6"></div>
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 h-32"></div>
              <div className="bg-gray-900 rounded-lg p-6 h-48"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Create Automation
            </h1>
            <p className="text-gray-400 mt-2">
              Build automated workflows to engage customers at the right time
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Automation Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Welcome Series"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Store *
                </label>
                <select
                  value={formData.store_id}
                  onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.store_name} ({store.shop_domain})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe what this automation does..."
              />
            </div>
          </div>

          {/* Trigger Selection */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Trigger</h2>
            <p className="text-gray-400 mb-4">Choose what event will start this automation</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TRIGGER_TYPES.map((trigger) => (
                <div
                  key={trigger.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    formData.trigger_type === trigger.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-700 hover:border-gray-600'
                  }`}
                  onClick={() => setFormData({ ...formData, trigger_type: trigger.id })}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      {trigger.icon}
                    </div>
                    <h3 className="font-medium text-white">{trigger.name}</h3>
                  </div>
                  <p className="text-sm text-gray-400">{trigger.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Actions</h2>
                <p className="text-gray-400">Define what happens when the automation is triggered</p>
              </div>
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addAction(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Add Action</option>
                  {ACTION_TYPES.map((action) => (
                    <option key={action.id} value={action.id}>
                      {action.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No actions added yet. Add your first action to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {actions.map((action, index) => (
                  <div key={action.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <h3 className="font-medium text-white">
                          {ACTION_TYPES.find(t => t.id === action.type)?.name}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAction(action.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Action Configuration */}
                    {action.type === 'send_email' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Email Subject
                          </label>
                          <input
                            type="text"
                            value={action.config.subject || ''}
                            onChange={(e) => updateAction(action.id, {
                              config: { ...action.config, subject: e.target.value }
                            })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                            placeholder="Enter email subject"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Email Content
                          </label>
                          <textarea
                            value={action.config.content || ''}
                            onChange={(e) => updateAction(action.id, {
                              config: { ...action.config, content: e.target.value }
                            })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                            rows={3}
                            placeholder="Enter email content"
                          />
                        </div>
                      </div>
                    )}

                    {action.type === 'send_sms' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          SMS Message
                        </label>
                        <textarea
                          value={action.config.message || ''}
                          onChange={(e) => updateAction(action.id, {
                            config: { ...action.config, message: e.target.value }
                          })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                          rows={2}
                          placeholder="Enter SMS message"
                        />
                      </div>
                    )}

                    {action.type === 'wait' && (
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Duration
                          </label>
                          <input
                            type="number"
                            value={action.config.duration || 1}
                            onChange={(e) => updateAction(action.id, {
                              config: { ...action.config, duration: parseInt(e.target.value) }
                            })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                            min="1"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Unit
                          </label>
                          <select
                            value={action.config.unit || 'hours'}
                            onChange={(e) => updateAction(action.id, {
                              config: { ...action.config, unit: e.target.value }
                            })}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                          >
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {action.type === 'add_tag' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Tag Name
                        </label>
                        <input
                          type="text"
                          value={action.config.tag || ''}
                          onChange={(e) => updateAction(action.id, {
                            config: { ...action.config, tag: e.target.value }
                          })}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                          placeholder="Enter tag name"
                        />
                      </div>
                    )}

                    {/* Delay */}
                    {index > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Delay before this action (minutes)
                        </label>
                        <input
                          type="number"
                          value={action.delay}
                          onChange={(e) => updateAction(action.id, { delay: parseInt(e.target.value) || 0 })}
                          className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm"
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-gray-300">
                Activate automation immediately after creation
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Creating...' : 'Create Automation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
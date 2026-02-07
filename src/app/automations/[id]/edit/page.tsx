'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import { 
  Plus, 
  Zap, 
  Mail, 
  MessageSquare, 
  Clock, 
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

interface Automation {
  id: string
  store_id: string
  name: string
  description: string
  trigger_type: string
  trigger_config: any
  actions: AutomationAction[]
  conditions: any[]
  is_active: boolean
  created_at: string
  updated_at: string
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

export default function EditAutomationPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const params = useParams()
  const automationId = params.id as string

  const [stores, setStores] = useState<Store[]>([])
  const [loadingAutomation, setLoadingAutomation] = useState(true)
  const [loadingStores, setLoadingStores] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    if (user && automationId) {
      loadAutomation()
      loadStores()
    }
  }, [user, automationId])

  const loadAutomation = async () => {
    try {
      setLoadingAutomation(true)
      setError(null)
      
      const response = await fetch(`/api/automations/${automationId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Automation not found')
          return
        }
        throw new Error('Failed to load automation')
      }
      
      const data = await response.json()
      const automationData: Automation = data.automation
      
      setFormData({
        store_id: automationData.store_id,
        name: automationData.name,
        description: automationData.description || '',
        trigger_type: automationData.trigger_type,
        trigger_config: automationData.trigger_config || {},
        is_active: automationData.is_active
      })
      
      // Convert actions to include temporary IDs for editing
      const actionsWithIds = automationData.actions.map((action: any, index: number) => ({
        ...action,
        id: action.id || `temp-${index}`
      }))
      setActions(actionsWithIds)
      
    } catch (error) {
      console.error('Failed to load automation:', error)
      setError('Failed to load automation. Please try again.')
    } finally {
      setLoadingAutomation(false)
    }
  }

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      }
    } catch (error) {
      console.error('Failed to load stores:', error)
    } finally {
      setLoadingStores(false)
    }
  }

  const addAction = (type: string) => {
    const newAction: AutomationAction = {
      id: `new-${Date.now()}`,
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
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          actions: actions.map(({ id, ...action }) => action)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update automation')
      }

      router.push('/automations')
    } catch (error) {
      console.error('Failed to update automation:', error)
      alert('Failed to update automation. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || loadingAutomation || loadingStores) {
    return (
      <div className="animate-pulse max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 rounded-xl bg-white/[0.06]" />
        <div className="space-y-6">
          <div className="h-32 rounded-2xl border border-white/10 bg-white/[0.03]" />
          <div className="h-48 rounded-2xl border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card-premium p-10 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Zap className="h-6 w-6 text-white/70" />
          </div>
          <h3 className="text-xl font-semibold text-white">{error}</h3>
          <p className="mt-2 text-white/60">Return to your automations and try again.</p>
          <div className="mt-6 flex justify-center">
            <button onClick={() => router.push('/automations')} className="btn-secondary">
              Back to Automations
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/automations')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Back to automations"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold text-premium">Edit Automation</h1>
            <span className={`badge ${formData.is_active ? 'badge-success' : 'badge-muted'}`}>
              {formData.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="text-white/60 mt-2">Modify your automated workflow.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card-premium p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Automation Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input-premium w-full"
                placeholder="e.g., Welcome Series"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Store *
              </label>
              <select
                value={formData.store_id}
                onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
                className="input-premium w-full"
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
            <label className="block text-sm font-medium text-white/70 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input-premium w-full"
              rows={3}
              placeholder="Describe what this automation does..."
            />
          </div>
        </div>

        <div className="card-premium p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Trigger</h2>
          <p className="text-white/60 mb-4">Choose what event will start this automation.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TRIGGER_TYPES.map((trigger) => (
              <div
                key={trigger.id}
                className={`border rounded-2xl p-4 cursor-pointer transition-colors ${
                  formData.trigger_type === trigger.id
                    ? 'border-white/15 bg-white/[0.04]'
                    : 'border-white/10 hover:border-white/15 hover:bg-white/[0.02]'
                }`}
                onClick={() => setFormData({ ...formData, trigger_type: trigger.id })}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white">
                    {trigger.icon}
                  </div>
                  <h3 className="font-medium text-white">{trigger.name}</h3>
                </div>
                <p className="text-sm text-white/55">{trigger.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Actions</h2>
              <p className="text-white/60">Define what happens when the automation is triggered.</p>
            </div>
            <div className="relative">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addAction(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="input-premium text-sm py-2.5"
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
            <div className="text-center py-8 text-white/60">
              <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No actions added yet. Add your first action to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div
                  key={action.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.03] hover:border-white/15"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-6 w-6 place-items-center rounded-full border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-xs font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.45)]">
                        {index + 1}
                      </span>
                      <h3 className="font-medium text-white">
                        {ACTION_TYPES.find((t) => t.id === action.type)?.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAction(action.id)}
                      className="p-1 text-white/55 hover:text-red-200 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Configuration */}
                  {action.type === 'send_email' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Email Subject
                        </label>
                        <input
                          type="text"
                          value={action.config.subject || ''}
                          onChange={(e) =>
                            updateAction(action.id, {
                              config: { ...action.config, subject: e.target.value },
                            })
                          }
                          className="input-premium w-full text-sm py-2.5"
                          placeholder="Enter email subject"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Email Content
                        </label>
                        <textarea
                          value={action.config.content || ''}
                          onChange={(e) =>
                            updateAction(action.id, {
                              config: { ...action.config, content: e.target.value },
                            })
                          }
                          className="input-premium w-full text-sm py-2.5"
                          rows={3}
                          placeholder="Enter email content"
                        />
                      </div>
                    </div>
                  )}

                  {action.type === 'send_sms' && (
                    <div>
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        SMS Message
                      </label>
                      <textarea
                        value={action.config.message || ''}
                        onChange={(e) =>
                          updateAction(action.id, {
                            config: { ...action.config, message: e.target.value },
                          })
                        }
                        className="input-premium w-full text-sm py-2.5"
                        rows={2}
                        placeholder="Enter SMS message"
                      />
                    </div>
                  )}

                  {action.type === 'wait' && (
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Duration
                        </label>
                        <input
                          type="number"
                          value={action.config.duration || 1}
                          onChange={(e) =>
                            updateAction(action.id, {
                              config: { ...action.config, duration: parseInt(e.target.value) },
                            })
                          }
                          className="input-premium w-full text-sm py-2.5"
                          min="1"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-white/70 mb-1">
                          Unit
                        </label>
                        <select
                          value={action.config.unit || 'hours'}
                          onChange={(e) =>
                            updateAction(action.id, {
                              config: { ...action.config, unit: e.target.value },
                            })
                          }
                          className="input-premium w-full text-sm py-2.5"
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
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Tag Name
                      </label>
                      <input
                        type="text"
                        value={action.config.tag || ''}
                        onChange={(e) =>
                          updateAction(action.id, {
                            config: { ...action.config, tag: e.target.value },
                          })
                        }
                        className="input-premium w-full text-sm py-2.5"
                        placeholder="Enter tag name"
                      />
                    </div>
                  )}

                  {/* Delay */}
                  {index > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <label className="block text-sm font-medium text-white/70 mb-1">
                        Delay before this action (minutes)
                      </label>
                      <input
                        type="number"
                        value={action.delay}
                        onChange={(e) =>
                          updateAction(action.id, { delay: parseInt(e.target.value) || 0 })
                        }
                        className="input-premium w-32 text-sm py-2.5"
                        min="0"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card-premium p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-[color:var(--accent-hi)] bg-white/10 border-white/20 rounded focus:ring-white/20"
            />
            <label htmlFor="is_active" className="text-white/70">
              Keep automation active
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => router.push('/automations')} className="btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

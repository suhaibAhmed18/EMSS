'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import CampaignWizard from '@/components/campaigns/CampaignWizard'
import { Zap, Check, ShoppingCart, UserPlus, Mail, DollarSign, Clock, Target } from 'lucide-react'

const WIZARD_STEPS = [
  { id: 'intro', title: 'Introduction', description: 'Learn about automations' },
  { id: 'trigger', title: 'Choose Trigger', description: 'Select when to run' },
  { id: 'action', title: 'Configure Action', description: 'What to do' },
  { id: 'review', title: 'Review & Create', description: 'Final review' }
]

interface AutomationTrigger {
  id: string
  name: string
  description: string
  icon: any
  category: string
}

const TRIGGERS: AutomationTrigger[] = [
  {
    id: 'customer_created',
    name: 'Welcome New Customer',
    description: 'Trigger when a new customer signs up',
    icon: UserPlus,
    category: 'customer'
  },
  {
    id: 'cart_abandoned',
    name: 'Cart Abandoned',
    description: 'Trigger when a customer abandons their cart',
    icon: ShoppingCart,
    category: 'cart'
  },
  {
    id: 'order_created',
    name: 'Order Created',
    description: 'Trigger when a customer creates an order',
    icon: DollarSign,
    category: 'order'
  },
  {
    id: 'order_paid',
    name: 'Order Paid',
    description: 'Trigger when a customer pays for an order',
    icon: DollarSign,
    category: 'order'
  },
  {
    id: 'customer_updated',
    name: 'Customer Updated',
    description: 'Trigger when customer information changes',
    icon: UserPlus,
    category: 'customer'
  }
]

export default function CreateAutomationPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTrigger, setSelectedTrigger] = useState<AutomationTrigger | null>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  const [automationData, setAutomationData] = useState({
    name: '',
    description: '',
    actionType: 'send_email',
    actionConfig: {
      delay: 0,
      delayUnit: 'minutes',
      // Email config
      subject: '',
      htmlContent: '',
      fromEmail: '',
      fromName: '',
      // SMS config
      message: '',
      fromNumber: '',
      // Tag config
      tags: []
    }
  })

  const handleNext = async () => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      await handleCreateAutomation()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleCreateAutomation = async () => {
    if (!storeId) {
      alert('No store found. Please connect a Shopify store first.')
      return
    }

    try {
      // Build action config based on action type
      let actionConfig: any = {}
      
      if (automationData.actionType === 'send_email') {
        actionConfig = {
          subject: automationData.actionConfig.subject,
          htmlContent: automationData.actionConfig.htmlContent,
          fromEmail: automationData.actionConfig.fromEmail || 'noreply@yourstore.com',
          fromName: automationData.actionConfig.fromName || 'Your Store'
        }
      } else if (automationData.actionType === 'send_sms') {
        actionConfig = {
          message: automationData.actionConfig.message,
          fromNumber: automationData.actionConfig.fromNumber
        }
      } else if (automationData.actionType === 'add_tag') {
        actionConfig = {
          tags: automationData.actionConfig.tags
        }
      } else if (automationData.actionType === 'delay') {
        actionConfig = {
          duration: automationData.actionConfig.delay,
          unit: automationData.actionConfig.delayUnit
        }
      }

      const response = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          name: automationData.name,
          description: automationData.description,
          trigger_type: selectedTrigger?.id,
          trigger_config: {},
          actions: [{
            id: `action_${Date.now()}`,
            type: automationData.actionType,
            config: actionConfig,
            delay: automationData.actionConfig.delay
          }],
          conditions: [],
          is_active: false
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/automations/${data.automation.id}/edit`)
      } else {
        const error = await response.json()
        console.error('Failed to create automation:', error)
        alert(`Failed to create automation: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create automation:', error)
      alert('Failed to create automation. Please try again.')
    }
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return true
      case 1: return selectedTrigger !== null
      case 2: {
        if (!automationData.name || !automationData.actionType) return false
        // Validate action-specific required fields
        if (automationData.actionType === 'send_email') {
          return !!(automationData.actionConfig.subject && automationData.actionConfig.htmlContent)
        }
        if (automationData.actionType === 'send_sms') {
          return !!(automationData.actionConfig.message && automationData.actionConfig.fromNumber)
        }
        if (automationData.actionType === 'add_tag') {
          return !!(automationData.actionConfig.tags && automationData.actionConfig.tags.length > 0)
        }
        return true
      }
      case 3: return true
      default: return false
    }
  }

  // Fetch user's store on mount
  useEffect(() => {
    const fetchStore = async () => {
      if (!user) return
      
      try {
        const response = await fetch('/api/stores')
        if (response.ok) {
          const data = await response.json()
          if (data.stores && data.stores.length > 0) {
            setStoreId(data.stores[0].id)
          }
        }
      } catch (error) {
        console.error('Failed to fetch store:', error)
      }
    }
    
    fetchStore()
  }, [user])

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-premium">Create Automation</h1>
        <p className="mt-2 text-white/60">Follow the steps to create your automation workflow</p>
      </div>

      <CampaignWizard
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoNext()}
        canGoPrevious={currentStep > 0}
      >
        {/* Step 1: Introduction */}
        {currentStep === 0 && (
          <div className="card-premium p-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Automate your marketing and save time
              </h2>
              <p className="text-white/60 text-lg mb-8">
                Create automated workflows that engage customers at the perfect moment
              </p>

              <div className="grid md:grid-cols-3 gap-6 text-left mb-8">
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Save time</h3>
                  <p className="text-white/60 text-sm">
                    Set it once and let it run automatically
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Perfect timing</h3>
                  <p className="text-white/60 text-sm">
                    Reach customers at exactly the right moment
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Increase revenue</h3>
                  <p className="text-white/60 text-sm">
                    Recover abandoned carts and boost sales
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Easy to set up</span>
                <span className="text-white/30">•</span>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Powerful triggers</span>
                <span className="text-white/30">•</span>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Track performance</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Trigger Selection */}
        {currentStep === 1 && (
          <div className="card-premium p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">Choose a trigger</h2>
              <p className="text-white/60">
                Select what event should start this automation
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {TRIGGERS.map((trigger) => {
                const Icon = trigger.icon
                return (
                  <button
                    key={trigger.id}
                    onClick={() => setSelectedTrigger(trigger)}
                    className={`text-left p-6 rounded-2xl border transition-all ${
                      selectedTrigger?.id === trigger.id
                        ? 'border-emerald-400 bg-emerald-400/5'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <Icon className="w-6 h-6 text-emerald-400" />
                      </div>
                      {selectedTrigger?.id === trigger.id && (
                        <Check className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    <h3 className="text-white font-semibold mb-2">{trigger.name}</h3>
                    <p className="text-white/60 text-sm">{trigger.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Step 3: Action Configuration */}
        {currentStep === 2 && (
          <div className="card-premium p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Configure Action</h2>
            
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-white/80 mb-2 font-medium">Automation Name</label>
                <input
                  type="text"
                  value={automationData.name}
                  onChange={(e) => setAutomationData({ ...automationData, name: e.target.value })}
                  placeholder="e.g., Welcome Email Series"
                  className="input-premium w-full"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">Description</label>
                <textarea
                  value={automationData.description}
                  onChange={(e) => setAutomationData({ ...automationData, description: e.target.value })}
                  placeholder="Describe what this automation does"
                  rows={3}
                  className="input-premium w-full resize-none"
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">Action Type</label>
                <select
                  value={automationData.actionType}
                  onChange={(e) => setAutomationData({ ...automationData, actionType: e.target.value })}
                  className="input-premium w-full"
                >
                  <option value="send_email">Send Email</option>
                  <option value="send_sms">Send SMS</option>
                  <option value="add_tag">Add Tag</option>
                  <option value="delay">Delay</option>
                </select>
              </div>

              {/* Email Configuration */}
              {automationData.actionType === 'send_email' && (
                <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <h4 className="text-white font-semibold">Email Settings</h4>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Subject Line</label>
                    <input
                      type="text"
                      value={automationData.actionConfig.subject}
                      onChange={(e) => setAutomationData({
                        ...automationData,
                        actionConfig: { ...automationData.actionConfig, subject: e.target.value }
                      })}
                      placeholder="Welcome to our store!"
                      className="input-premium w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Email Content</label>
                    <textarea
                      value={automationData.actionConfig.htmlContent}
                      onChange={(e) => setAutomationData({
                        ...automationData,
                        actionConfig: { ...automationData.actionConfig, htmlContent: e.target.value }
                      })}
                      placeholder="Hi {{customer.first_name}}, welcome to our store!"
                      rows={4}
                      className="input-premium w-full resize-none"
                    />
                    <p className="text-white/40 text-xs mt-1">Use {`{{customer.first_name}}`}, {`{{customer.email}}`}, etc. for personalization</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/80 mb-2 text-sm">From Name</label>
                      <input
                        type="text"
                        value={automationData.actionConfig.fromName}
                        onChange={(e) => setAutomationData({
                          ...automationData,
                          actionConfig: { ...automationData.actionConfig, fromName: e.target.value }
                        })}
                        placeholder="Your Store"
                        className="input-premium w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-white/80 mb-2 text-sm">From Email</label>
                      <input
                        type="email"
                        value={automationData.actionConfig.fromEmail}
                        onChange={(e) => setAutomationData({
                          ...automationData,
                          actionConfig: { ...automationData.actionConfig, fromEmail: e.target.value }
                        })}
                        placeholder="hello@yourstore.com"
                        className="input-premium w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SMS Configuration */}
              {automationData.actionType === 'send_sms' && (
                <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <h4 className="text-white font-semibold">SMS Settings</h4>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Message</label>
                    <textarea
                      value={automationData.actionConfig.message}
                      onChange={(e) => setAutomationData({
                        ...automationData,
                        actionConfig: { ...automationData.actionConfig, message: e.target.value }
                      })}
                      placeholder="Hi {{customer.first_name}}, thanks for your order!"
                      rows={3}
                      className="input-premium w-full resize-none"
                      maxLength={160}
                    />
                    <p className="text-white/40 text-xs mt-1">
                      {automationData.actionConfig.message?.length || 0}/160 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">From Number</label>
                    <input
                      type="tel"
                      value={automationData.actionConfig.fromNumber}
                      onChange={(e) => setAutomationData({
                        ...automationData,
                        actionConfig: { ...automationData.actionConfig, fromNumber: e.target.value }
                      })}
                      placeholder="+1234567890"
                      className="input-premium w-full"
                    />
                  </div>
                </div>
              )}

              {/* Tag Configuration */}
              {automationData.actionType === 'add_tag' && (
                <div className="space-y-4 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <h4 className="text-white font-semibold">Tag Settings</h4>
                  <div>
                    <label className="block text-white/80 mb-2 text-sm">Tags (comma-separated)</label>
                    <input
                      type="text"
                      value={automationData.actionConfig.tags?.join(', ') || ''}
                      onChange={(e) => setAutomationData({
                        ...automationData,
                        actionConfig: { 
                          ...automationData.actionConfig, 
                          tags: e.target.value.split(',').map(t => t.trim()).filter(t => t)
                        }
                      })}
                      placeholder="vip, new-customer, high-value"
                      className="input-premium w-full"
                    />
                    <p className="text-white/40 text-xs mt-1">Enter tags separated by commas</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-white/80 mb-2 font-medium">Delay</label>
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={automationData.actionConfig.delay}
                    onChange={(e) => setAutomationData({
                      ...automationData,
                      actionConfig: { ...automationData.actionConfig, delay: parseInt(e.target.value) }
                    })}
                    min="0"
                    className="input-premium flex-1"
                  />
                  <select
                    value={automationData.actionConfig.delayUnit}
                    onChange={(e) => setAutomationData({
                      ...automationData,
                      actionConfig: { ...automationData.actionConfig, delayUnit: e.target.value }
                    })}
                    className="input-premium w-32"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
                <p className="text-white/40 text-sm mt-1">
                  How long to wait after the trigger before executing the action
                </p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Automation Flow</h4>
                    <p className="text-white/60 text-sm">
                      When <strong>{selectedTrigger?.name}</strong> happens, wait{' '}
                      <strong>{automationData.actionConfig.delay} {automationData.actionConfig.delayUnit}</strong>, then{' '}
                      <strong>{automationData.actionType.replace('_', ' ')}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 3 && (
          <div className="card-premium p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Review Your Automation</h2>
            
            <div className="space-y-6 max-w-2xl">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-semibold mb-4">Automation Summary</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-white/60">Name:</dt>
                    <dd className="text-white font-medium">{automationData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Trigger:</dt>
                    <dd className="text-white font-medium">{selectedTrigger?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Action:</dt>
                    <dd className="text-white font-medium capitalize">{automationData.actionType.replace('_', ' ')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Delay:</dt>
                    <dd className="text-white font-medium">
                      {automationData.actionConfig.delay} {automationData.actionConfig.delayUnit}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-semibold mb-3">Workflow Preview</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      {selectedTrigger && <selectedTrigger.icon className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">Trigger: {selectedTrigger?.name}</p>
                      <p className="text-white/60 text-sm">{selectedTrigger?.description}</p>
                    </div>
                  </div>
                  <div className="ml-5 border-l-2 border-white/10 h-8" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        Wait {automationData.actionConfig.delay} {automationData.actionConfig.delayUnit}
                      </p>
                    </div>
                  </div>
                  <div className="ml-5 border-l-2 border-white/10 h-8" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">
                        {automationData.actionType.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Ready to create</h4>
                    <p className="text-white/60 text-sm">
                      Click "Finish" to create your automation. It will be created as inactive - you can configure it further and activate it when ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CampaignWizard>
    </div>
  )
}

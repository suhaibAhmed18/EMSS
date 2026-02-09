'use client'

import { useState } from 'react'

interface TriggerOption {
  type: string
  label: string
  description: string
  icon: string
}

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    type: 'cart_abandoned',
    label: 'Abandoned Cart',
    description: 'When a customer leaves items in their cart',
    icon: '🛒'
  },
  {
    type: 'order_created',
    label: 'Order Placed',
    description: 'When a customer places an order',
    icon: '📦'
  },
  {
    type: 'order_paid',
    label: 'Order Paid',
    description: 'When an order payment is confirmed',
    icon: '💳'
  },
  {
    type: 'customer_created',
    label: 'New Customer',
    description: 'When a new customer signs up',
    icon: '👤'
  },
  {
    type: 'customer_updated',
    label: 'Customer Updated',
    description: 'When customer information changes',
    icon: '✏️'
  }
]

interface TriggerSelectorProps {
  selectedTrigger: string
  triggerConfig: any
  onTriggerSelect: (type: string, config: any) => void
}

export default function TriggerSelector({ selectedTrigger, onTriggerSelect }: TriggerSelectorProps) {
  const [showConfig, setShowConfig] = useState(false)
  const [tempTrigger, setTempTrigger] = useState('')
  const [delayMinutes, setDelayMinutes] = useState(60)

  const handleTriggerClick = (type: string) => {
    setTempTrigger(type)
    
    // For cart_abandoned, show config modal
    if (type === 'cart_abandoned') {
      setShowConfig(true)
    } else {
      // For other triggers, use default config
      onTriggerSelect(type, {
        description: TRIGGER_OPTIONS.find(t => t.type === type)?.description
      })
    }
  }

  const handleConfigSave = () => {
    onTriggerSelect(tempTrigger, {
      delay_minutes: delayMinutes,
      description: `Wait ${delayMinutes} minutes after cart abandonment`
    })
    setShowConfig(false)
  }

  return (
    <div className="space-y-2">
      {TRIGGER_OPTIONS.map(trigger => (
        <button
          key={trigger.type}
          onClick={() => handleTriggerClick(trigger.type)}
          className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
            selectedTrigger === trigger.type
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="text-2xl">{trigger.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">{trigger.label}</div>
              <div className="text-sm text-gray-600 mt-1">{trigger.description}</div>
            </div>
            {selectedTrigger === trigger.type && (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </button>
      ))}

      {/* Config Modal for Cart Abandoned */}
      {showConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configure Abandoned Cart Trigger
              </h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wait time before triggering
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 0)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                  />
                  <span className="text-gray-600">minutes</span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  The workflow will start {delayMinutes} minutes after a cart is abandoned
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfig(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfigSave}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

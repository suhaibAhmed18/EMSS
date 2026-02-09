'use client'

import { useState } from 'react'
import ActionEditor from './ActionEditor'

interface WorkflowCanvasProps {
  trigger: any
  triggerType: string
  actions: any[]
  onTriggerClick: () => void
  onActionClick: (index: number) => void
  onActionUpdate: (index: number, action: any) => void
  onActionDelete: (index: number) => void
  onActionMove: (fromIndex: number, toIndex: number) => void
}

export default function WorkflowCanvas({
  trigger,
  triggerType,
  actions,
  onActionUpdate,
  onActionDelete,
  onActionMove
}: WorkflowCanvasProps) {
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null)

  const getTriggerIcon = () => {
    switch (triggerType) {
      case 'cart_abandoned':
        return '🛒'
      case 'order_created':
        return '📦'
      case 'customer_created':
        return '👤'
      default:
        return '⚡'
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'send_email':
        return '📧'
      case 'send_sms':
        return '💬'
      case 'delay':
        return '⏱️'
      case 'add_tag':
        return '🏷️'
      case 'update_contact':
        return '✏️'
      default:
        return '⚙️'
    }
  }

  const getActionLabel = (action: any) => {
    switch (action.type) {
      case 'send_email':
        return action.config.subject || 'Send Email'
      case 'send_sms':
        return action.config.message ? 'Send SMS' : 'Send SMS'
      case 'delay':
        return `Wait ${action.delay || 0} minutes`
      case 'add_tag':
        return `Add tag: ${action.config.tag || 'tag'}`
      case 'update_contact':
        return 'Update Contact'
      default:
        return action.type
    }
  }

  return (
    <div className="p-8 min-h-full bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Trigger Node */}
        {trigger && (
          <div className="relative">
            <div className="bg-white rounded-lg shadow-sm border-2 border-blue-500 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                  {getTriggerIcon()}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-blue-600 uppercase mb-1">Trigger</div>
                  <div className="font-semibold text-gray-900">
                    {triggerType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  {trigger.description && (
                    <div className="text-sm text-gray-600 mt-1">{trigger.description}</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Connector Line */}
            {actions.length > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300" style={{ top: '100%' }}></div>
            )}
          </div>
        )}

        {/* Action Nodes */}
        {actions.map((action, index) => (
          <div key={action.id} className="relative mt-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-blue-400 transition-colors">
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                    {getActionIcon(action.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Action {index + 1}
                    </div>
                    <div className="font-semibold text-gray-900 mb-1">
                      {getActionLabel(action)}
                    </div>
                    {action.config.description && (
                      <div className="text-sm text-gray-600">{action.config.description}</div>
                    )}
                    {action.delay > 0 && action.type !== 'delay' && (
                      <div className="text-xs text-gray-500 mt-2">
                        ⏱️ Delay: {action.delay} minutes
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {index > 0 && (
                      <button
                        onClick={() => onActionMove(index, index - 1)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {index < actions.length - 1 && (
                      <button
                        onClick={() => onActionMove(index, index + 1)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                        title="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setEditingActionIndex(index)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onActionDelete(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Connector Line */}
            {index < actions.length - 1 && (
              <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300" style={{ top: '100%' }}></div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {!trigger && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start Building Your Workflow</h3>
            <p className="text-gray-600">Choose a trigger from the right panel to get started</p>
          </div>
        )}
      </div>

      {/* Action Editor Modal */}
      {editingActionIndex !== null && (
        <ActionEditor
          action={actions[editingActionIndex]}
          onSave={(updatedAction) => {
            onActionUpdate(editingActionIndex, updatedAction)
            setEditingActionIndex(null)
          }}
          onClose={() => setEditingActionIndex(null)}
        />
      )}
    </div>
  )
}

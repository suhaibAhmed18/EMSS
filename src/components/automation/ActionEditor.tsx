'use client'

import { useState } from 'react'

interface ActionEditorProps {
  action: any
  onSave: (action: any) => void
  onClose: () => void
}

export default function ActionEditor({ action, onSave, onClose }: ActionEditorProps) {
  const [editedAction, setEditedAction] = useState({ ...action })

  const handleSave = () => {
    onSave(editedAction)
  }

  const updateConfig = (key: string, value: any) => {
    setEditedAction({
      ...editedAction,
      config: {
        ...editedAction.config,
        [key]: value
      }
    })
  }

  const renderEditor = () => {
    switch (editedAction.type) {
      case 'send_email':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={editedAction.config.subject || ''}
                onChange={(e) => updateConfig('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email subject"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Body
              </label>
              <textarea
                value={editedAction.config.body || ''}
                onChange={(e) => updateConfig('body', e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email content..."
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use variables: {'{customer_name}'}, {'{order_total}'}, {'{cart_url}'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay (minutes)
              </label>
              <input
                type="number"
                value={editedAction.delay || 0}
                onChange={(e) => setEditedAction({ ...editedAction, delay: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Wait time before sending this email
              </p>
            </div>
          </div>
        )

      case 'send_sms':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMS Message
              </label>
              <textarea
                value={editedAction.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter SMS message..."
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {(editedAction.config.message || '').length}/160 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delay (minutes)
              </label>
              <input
                type="number"
                value={editedAction.delay || 0}
                onChange={(e) => setEditedAction({ ...editedAction, delay: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="0"
                placeholder="0"
              />
            </div>
          </div>
        )

      case 'delay':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wait Duration
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={editedAction.delay || 0}
                  onChange={(e) => setEditedAction({ ...editedAction, delay: parseInt(e.target.value) || 0 })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  placeholder="60"
                />
                <span className="flex items-center text-gray-600">minutes</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                The workflow will pause for this duration before continuing
              </p>
            </div>
          </div>
        )

      case 'add_tag':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tag Name
              </label>
              <input
                type="text"
                value={editedAction.config.tag || ''}
                onChange={(e) => updateConfig('tag', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., cart-abandoner, vip-customer"
              />
            </div>
          </div>
        )

      case 'update_contact':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field to Update
              </label>
              <select
                value={editedAction.config.field || ''}
                onChange={(e) => updateConfig('field', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="">Select field</option>
                <option value="first_name">First Name</option>
                <option value="last_name">Last Name</option>
                <option value="phone">Phone</option>
                <option value="tags">Tags</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Value
              </label>
              <input
                type="text"
                value={editedAction.config.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter new value"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-gray-600">
            No configuration available for this action type
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Action: {editedAction.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {renderEditor()}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Action
          </button>
        </div>
      </div>
    </div>
  )
}

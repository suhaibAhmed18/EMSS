'use client'

import { useState } from 'react'
import { X, Save } from 'lucide-react'

interface SaveTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  type: 'email' | 'sms'
}

export default function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  type
}: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Please enter a template name')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await onSave(templateName.trim())
      setTemplateName('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setTemplateName('')
      setError(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-premium w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Save {type === 'email' ? 'Email' : 'SMS'} Template
          </h2>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => {
                setTemplateName(e.target.value)
                setError(null)
              }}
              className="input-premium w-full"
              placeholder={type === 'email' ? 'e.g., Welcome Email' : 'e.g., Flash Sale SMS'}
              disabled={saving}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave()
                }
              }}
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">{error}</p>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-sm text-white/60">
              This template will be saved and available for reuse in future campaigns.
              You can access it from the campaign builder or the templates page in settings.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleClose}
              disabled={saving}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !templateName.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

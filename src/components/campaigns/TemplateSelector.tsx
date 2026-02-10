'use client'

import { useState, useEffect } from 'react'
import { X, Search, FileText, Mail, MessageSquare } from 'lucide-react'

interface Template {
  id: string
  name: string
  type: 'email' | 'sms'
  content: any
  variables?: string[]
  created_at: string
  updated_at: string
}

interface TemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: Template) => void
  type: 'email' | 'sms'
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onSelect,
  type
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadTemplates()
    }
  }, [isOpen, type])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/templates?type=${type}`)
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="card-premium w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center">
            {type === 'email' ? (
              <Mail className="w-5 h-5 mr-2" />
            ) : (
              <MessageSquare className="w-5 h-5 mr-2" />
            )}
            Select {type === 'email' ? 'Email' : 'SMS'} Template
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium w-full pl-10"
              placeholder="Search templates..."
            />
          </div>
        </div>

        {/* Templates List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
              <p className="text-white/60">Loading templates...</p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {searchTerm ? 'No templates found' : 'No saved templates'}
              </h3>
              <p className="text-white/60">
                {searchTerm
                  ? 'Try a different search term'
                  : 'Save your first template to see it here'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    onSelect(template)
                    onClose()
                  }}
                  className="text-left rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:bg-white/[0.04] hover:border-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">{template.name}</h3>
                    {type === 'email' ? (
                      <Mail className="w-4 h-4 text-white/40 flex-shrink-0" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-white/40 flex-shrink-0" />
                    )}
                  </div>
                  
                  {type === 'sms' && typeof template.content === 'string' && (
                    <p className="text-sm text-white/60 line-clamp-2 mb-3">
                      {template.content}
                    </p>
                  )}
                  
                  {template.variables && template.variables.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.variables.slice(0, 3).map((variable) => (
                        <span
                          key={variable}
                          className="text-xs px-2 py-1 rounded-lg bg-white/[0.05] text-white/60"
                        >
                          {`{{${variable}}}`}
                        </span>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="text-xs px-2 py-1 text-white/60">
                          +{template.variables.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <p className="text-xs text-white/45">
                    Updated {new Date(template.updated_at).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="btn-secondary w-full"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

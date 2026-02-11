'use client'

import { useState } from 'react'
import { Save, Eye, Code } from 'lucide-react'
import { sanitizeHTML } from '@/lib/security/sanitize'

interface TemplateEditorProps {
  type: 'email' | 'sms'
  initialContent: string
  onSave: (content: string) => void
  variables?: string[]
}

export default function TemplateEditor({
  type,
  initialContent,
  onSave,
  variables = []
}: TemplateEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')

  const handleSave = () => {
    onSave(content)
  }

  const insertVariable = (variable: string) => {
    setContent(prev => prev + `{{${variable}}}`)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('edit')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              mode === 'edit'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08]'
            }`}
          >
            <Code className="w-4 h-4 inline mr-2" />
            Edit
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              mode === 'preview'
                ? 'bg-emerald-500 text-white'
                : 'bg-white/[0.05] text-white/60 hover:bg-white/[0.08]'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-2" />
            Preview
          </button>
        </div>
        <button onClick={handleSave} className="btn-primary">
          <Save className="w-4 h-4" />
          Save Template
        </button>
      </div>

      {/* Variables */}
      {variables.length > 0 && mode === 'edit' && (
        <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
          <p className="text-white/60 text-sm mb-2">Available variables:</p>
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <button
                key={variable}
                onClick={() => insertVariable(variable)}
                className="px-3 py-1 rounded-lg bg-white/[0.05] text-white/80 text-sm hover:bg-white/[0.08] transition-colors"
              >
                {`{{${variable}}}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      {mode === 'edit' && (
        <div>
          {type === 'email' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-premium w-full h-96 font-mono text-sm resize-none"
              placeholder="Enter your email HTML content..."
            />
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="input-premium w-full h-48 resize-none"
              placeholder="Enter your SMS message..."
              maxLength={160}
            />
          )}
          {type === 'sms' && (
            <div className="flex justify-between items-center mt-2">
              <p className="text-white/40 text-sm">
                SMS messages are limited to 160 characters
              </p>
              <p className={`text-sm font-medium ${
                content.length > 160 ? 'text-red-400' : 'text-white/60'
              }`}>
                {content.length}/160
              </p>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {mode === 'preview' && (
        <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
          {type === 'email' ? (
            <div
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: sanitizeHTML(content) }}
            />
          ) : (
            <div className="max-w-sm mx-auto">
              <div className="bg-blue-500 text-white p-4 rounded-2xl rounded-bl-none shadow-lg">
                <p className="text-sm">{content}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

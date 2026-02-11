'use client'

import { useState, useEffect } from 'react'
import { FileText, ExternalLink, Search, Mail, MessageSquare, Trash2 } from 'lucide-react'

export default function SavedTemplates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/campaigns/templates')
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

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadTemplates()
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || template.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Saved templates</h2>
        <p className="text-sm text-white/60 mb-4">
          View and manage templates saved from your campaigns
        </p>
        <a href="#" className="text-sm text-[#16a085] hover:underline inline-flex items-center">
          Find out more <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-premium w-full pl-10"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-premium"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/[0.05] mb-6">
              <FileText className="w-10 h-10 text-white/40" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              No saved templates yet
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              When you save templates from your campaigns, they will appear here for easy reuse
            </p>
            <a 
              href="/campaigns/email/new"
              className="btn-primary inline-flex items-center"
            >
              <Mail className="w-4 h-4 mr-2" />
              Create Email Campaign
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id}
                className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors group relative"
              >
                <div className="aspect-video bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-lg mb-3 flex items-center justify-center">
                  {template.type === 'email' ? (
                    <Mail className="w-8 h-8 text-emerald-400/60" />
                  ) : (
                    <MessageSquare className="w-8 h-8 text-emerald-400/60" />
                  )}
                </div>
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-white flex-1 truncate">{template.name}</h4>
                  <span className="text-xs px-2 py-0.5 bg-emerald-400/10 text-emerald-400 rounded-full ml-2 shrink-0">
                    {template.type === 'email' ? 'Email' : 'SMS'}
                  </span>
                </div>
                {template.content && (
                  <p className="text-xs text-white/60 mb-2 line-clamp-2">
                    {template.type === 'sms' 
                      ? template.content 
                      : template.content.replace(/<[^>]*>/g, '').substring(0, 100)
                    }
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-white/50 mt-3">
                  <span>Saved {new Date(template.updated_at).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

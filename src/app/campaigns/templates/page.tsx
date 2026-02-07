'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/session'
import { 
  Mail, 
  MessageSquare, 
  Search, 
  Edit,
  Copy,
  Trash2,
  Eye,
  FileText,
  Star,
  Clock
} from 'lucide-react'

interface CampaignTemplate {
  id: string
  name: string
  type: 'email' | 'sms'
  content: string
  variables: string[]
  is_default: boolean
  created_at: string
  updated_at: string
}

export default function CampaignTemplatesPage() {
  const { user, loading } = useRequireAuth()
  const [templates, setTemplates] = useState<CampaignTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'email' | 'sms'>('all')

  useEffect(() => {
    if (user) {
      loadTemplates()
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true)
      setError(null)
      
      const response = await fetch('/api/campaigns/templates')
      if (!response.ok) {
        throw new Error('Failed to load templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
      setError('Failed to load templates. Please try again.')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      // Reload templates
      await loadTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/campaigns/templates/${templateId}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate template')
      }

      // Reload templates
      await loadTemplates()
    } catch (error) {
      console.error('Failed to duplicate template:', error)
      alert('Failed to duplicate template. Please try again.')
    }
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || template.type === filterType
    
    return matchesSearch && matchesType
  })

  if (loading || loadingTemplates) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-56 rounded-xl bg-white/[0.06]" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium">Campaign Templates</h1>
          <p className="text-white/60 mt-2">Create reusable templates for your email and SMS campaigns.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/campaigns" className="btn-ghost">
            Back to Campaigns
          </Link>
          <Link href="/campaigns/templates/email/new" className="btn-primary">
            <Mail className="w-4 h-4" />
            Email Template
          </Link>
          <Link href="/campaigns/templates/sms/new" className="btn-secondary">
            <MessageSquare className="w-4 h-4" />
            SMS Template
          </Link>
        </div>
      </div>

      {error && (
        <div className="card-premium p-4 border-red-400/20">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="card-premium p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-premium px-3 py-2.5 text-sm"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <FileText className="w-14 h-14 text-white/35 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {templates.length === 0 ? 'No templates found' : 'No templates match your filters'}
          </h3>
          <p className="text-white/55 mb-6">
            {templates.length === 0 ? 'Create your first template to reuse in campaigns.' : 'Try adjusting your search or filter criteria.'}
          </p>
          {templates.length === 0 && (
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/campaigns/templates/email/new" className="btn-primary">
                <Mail className="w-4 h-4" />
                Create Email Template
              </Link>
              <Link href="/campaigns/templates/sms/new" className="btn-secondary">
                <MessageSquare className="w-4 h-4" />
                Create SMS Template
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="card-premium-hover p-6">
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shrink-0">
                    {template.type === 'email' ? <Mail className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{template.name}</h3>
                      {template.is_default && <Star className="w-4 h-4 text-yellow-300 fill-current" />}
                    </div>
                    <div className="mt-1">
                      <span className="badge badge-muted">{template.type.toUpperCase()} TEMPLATE</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/campaigns/templates/${template.type}/${template.id}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Preview Template"
                    aria-label="Preview template"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/campaigns/templates/${template.type}/${template.id}/edit`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Edit Template"
                    aria-label="Edit template"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicateTemplate(template.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Duplicate Template"
                    aria-label="Duplicate template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id, template.name)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15 transition-colors"
                    title="Delete Template"
                    aria-label="Delete template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 max-h-32 overflow-hidden">
                <div className="text-white/70 text-sm line-clamp-4">
                  {template.type === 'email'
                    ? `${template.content.replace(/<[^>]*>/g, '').substring(0, 150)}...`
                    : `${template.content.substring(0, 150)}...`}
                </div>
              </div>

              {template.variables && template.variables.length > 0 && (
                <div className="mb-4">
                  <p className="text-white/55 text-sm mb-2">Variables</p>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.slice(0, 3).map((variable, index) => (
                      <span key={index} className="badge badge-muted">
                        {variable}
                      </span>
                    ))}
                    {template.variables.length > 3 && (
                      <span className="badge badge-muted">+{template.variables.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-white/55">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link href={`/campaigns/${template.type}/new?template=${template.id}`} className="btn-primary w-full justify-center">
                  Use Template
                </Link>
                <Link href={`/campaigns/templates/${template.type}/${template.id}/edit`} className="btn-secondary w-full justify-center">
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {templates.length > 0 && (
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Template Library</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Templates</span>
              </div>
              <p className="text-2xl font-semibold text-white">{templates.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Email Templates</span>
              </div>
              <p className="text-2xl font-semibold text-white">{templates.filter((t) => t.type === 'email').length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-white/60" />
                <span className="text-white/55">SMS Templates</span>
              </div>
              <p className="text-2xl font-semibold text-white">{templates.filter((t) => t.type === 'sms').length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-300" />
                <span className="text-white/55">Default Templates</span>
              </div>
              <p className="text-2xl font-semibold text-white">{templates.filter((t) => t.is_default).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

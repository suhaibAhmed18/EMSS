'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/session'
import { 
  Plus, 
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
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-48 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-6 h-64"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Campaign Templates
            </h1>
            <p className="text-gray-400 mt-2">
              Create reusable templates for your email and SMS campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/campaigns"
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              Back to Campaigns
            </Link>
            <div className="flex gap-2">
              <Link
                href="/campaigns/templates/email/new"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
              >
                <Mail className="w-5 h-5" />
                Email Template
              </Link>
              <Link
                href="/campaigns/templates/sms/new"
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
              >
                <MessageSquare className="w-5 h-5" />
                SMS Template
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              {templates.length === 0 ? 'No templates found' : 'No templates match your filters'}
            </h3>
            <p className="text-gray-500 mb-6">
              {templates.length === 0 
                ? 'Create your first template to reuse in campaigns'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {templates.length === 0 && (
              <div className="flex justify-center gap-3">
                <Link
                  href="/campaigns/templates/email/new"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  Create Email Template
                </Link>
                <Link
                  href="/campaigns/templates/sms/new"
                  className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <MessageSquare className="w-5 h-5" />
                  Create SMS Template
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                {/* Template Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      template.type === 'email' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : 'bg-gradient-to-r from-green-600 to-teal-600'
                    }`}>
                      {template.type === 'email' ? (
                        <Mail className="w-6 h-6 text-white" />
                      ) : (
                        <MessageSquare className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">{template.name}</h3>
                        {template.is_default && (
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        )}
                      </div>
                      <p className="text-gray-400 text-sm capitalize">{template.type} Template</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/campaigns/templates/${template.type}/${template.id}`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Preview Template"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/campaigns/templates/${template.type}/${template.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Edit Template"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDuplicateTemplate(template.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Duplicate Template"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id, template.name)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Template Preview */}
                <div className="mb-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 max-h-32 overflow-hidden">
                    <div className="text-gray-300 text-sm line-clamp-4">
                      {template.type === 'email' 
                        ? template.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...'
                        : template.content.substring(0, 150) + '...'
                      }
                    </div>
                  </div>
                </div>

                {/* Template Variables */}
                {template.variables && template.variables.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">Variables:</p>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.slice(0, 3).map((variable, index) => (
                        <span key={index} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                          {variable}
                        </span>
                      ))}
                      {template.variables.length > 3 && (
                        <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                          +{template.variables.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Template Info */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Updated {new Date(template.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/campaigns/${template.type}/new?template=${template.id}`}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-all duration-200"
                  >
                    Use Template
                  </Link>
                  <Link
                    href={`/campaigns/templates/${template.type}/${template.id}/edit`}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium text-center transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Template Stats */}
        {templates.length > 0 && (
          <div className="mt-12 bg-gray-900/30 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Template Library</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Total Templates</span>
                </div>
                <p className="text-2xl font-bold text-white">{templates.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Email Templates</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {templates.filter(t => t.type === 'email').length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">SMS Templates</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {templates.filter(t => t.type === 'sms').length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">Default Templates</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {templates.filter(t => t.is_default).length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
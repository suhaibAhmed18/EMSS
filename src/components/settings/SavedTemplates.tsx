'use client'

import { useState, useEffect } from 'react'
import { FileText, Upload, ExternalLink, Search, Filter } from 'lucide-react'

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
      const response = await fetch('/api/settings/templates')
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

  const handleImport = () => {
    // Trigger file input
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.html,.json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        const formData = new FormData()
        formData.append('template', file)
        
        try {
          const response = await fetch('/api/settings/templates/import', {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            await loadTemplates()
            alert('Template imported successfully!')
          }
        } catch (error) {
          console.error('Failed to import template:', error)
          alert('Failed to import template')
        }
      }
    }
    input.click()
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
          Manage all your saved templates
        </p>
        <a href="#" className="text-sm text-[#16a085] hover:underline inline-flex items-center">
          Find out more <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
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
          <button 
            onClick={handleImport}
            className="btn-primary text-sm inline-flex items-center ml-4"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import template
          </button>
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
              Imported templates will appear here
            </h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Import your custom email or SMS templates to use them in your campaigns and automations
            </p>
            <button 
              onClick={handleImport}
              className="btn-primary inline-flex items-center"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div 
                key={template.id}
                className="border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors cursor-pointer"
              >
                <div className="aspect-video bg-white/[0.02] rounded-lg mb-3 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-white/40" />
                </div>
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-sm font-semibold text-white flex-1">{template.name}</h4>
                  {template.source === 'campaign' && (
                    <span className="text-xs px-2 py-0.5 bg-[#16a085]/20 text-[#16a085] rounded-full ml-2">
                      Campaign
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/60 mb-2 capitalize">{template.type}</p>
                <div className="flex items-center justify-between text-xs text-white/50">
                  <span>Modified {new Date(template.updatedAt || template.updated_at).toLocaleDateString()}</span>
                  <button className="text-[#16a085] hover:underline">
                    {template.source === 'campaign' ? 'View' : 'Edit'}
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

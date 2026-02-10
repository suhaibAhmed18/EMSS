'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Save, FileText } from 'lucide-react'
import EmailCampaignBuilder from '@/components/campaigns/EmailCampaignBuilder'
import SMSCampaignBuilder from '@/components/campaigns/SMSCampaignBuilder'
import SaveTemplateModal from '@/components/campaigns/SaveTemplateModal'
import TemplateSelector from '@/components/campaigns/TemplateSelector'

interface Campaign {
  id: string
  name: string
  subject?: string
  message?: string
  html_content?: string
  text_content?: string
  json_content?: string
  status: string
  recipient_count: number
  from_name?: string
  from_email?: string
  from_number?: string
}

interface EmailElement {
  id: string
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer'
  content: any
  styles: any
}

export default function EditCampaignPage() {
  const params = useParams()
  const router = useRouter()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [emailElements, setEmailElements] = useState<EmailElement[]>([])
  const [emailAddresses, setEmailAddresses] = useState<any[]>([])
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [storeId, setStoreId] = useState<string | null>(null)

  const campaignType = params.type as string
  const campaignId = params.id as string

  useEffect(() => {
    loadCampaign()
    loadEmailAddresses()
  }, [campaignId, campaignType])

  const loadEmailAddresses = async () => {
    try {
      const response = await fetch('/api/settings/email-addresses')
      if (response.ok) {
        const data = await response.json()
        setEmailAddresses(data.emailAddresses || [])
      }
    } catch (error) {
      console.error('Failed to load email addresses:', error)
    }
  }

  const loadCampaign = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}?type=${campaignType}`)
      
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
        setStoreId(data.campaign.store_id)
        
        // Load email elements if available
        if (data.campaign.json_content) {
          try {
            const elements = JSON.parse(data.campaign.json_content)
            setEmailElements(elements)
          } catch (e) {
            console.error('Failed to parse json_content:', e)
          }
        }
      } else {
        setError('Campaign not found')
      }
    } catch (error) {
      console.error('Error loading campaign:', error)
      setError('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  // Convert email elements to HTML
  const convertElementsToHTML = (elements: EmailElement[]): string => {
    let html = '<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">'
    
    elements.forEach(element => {
      switch (element.type) {
        case 'text':
          const tag = element.content.tag || 'p'
          const textStyles = `
            font-size: ${element.styles?.fontSize || '16px'};
            color: ${element.styles?.color || '#333'};
            font-weight: ${element.styles?.fontWeight || 'normal'};
            line-height: ${element.styles?.lineHeight || '1.5'};
            text-align: ${element.content?.alignment || 'left'};
            padding: ${element.styles?.padding || '10px'};
          `
          html += `<${tag} style="${textStyles}">${element.content.text}</${tag}>`
          break
          
        case 'image':
          const imgStyles = `
            width: ${element.styles?.width || '100%'};
            max-width: ${element.styles?.maxWidth || '600px'};
            height: auto;
            display: block;
            margin: 0 auto;
          `
          const imgWrapperStyles = `text-align: ${element.content?.alignment || 'center'}; padding: ${element.styles?.padding || '10px'};`
          const imgHtml = `<img src="${element.content.src}" alt="${element.content.alt}" style="${imgStyles}" />`
          html += element.content.link 
            ? `<a href="${element.content.link}" style="${imgWrapperStyles}">${imgHtml}</a>`
            : `<div style="${imgWrapperStyles}">${imgHtml}</div>`
          break
          
        case 'button':
          const btnStyles = `
            background-color: ${element.styles?.backgroundColor || '#007bff'};
            color: ${element.styles?.color || '#ffffff'};
            padding: ${element.styles?.padding || '12px 24px'};
            border-radius: ${element.styles?.borderRadius || '4px'};
            font-size: ${element.styles?.fontSize || '16px'};
            text-decoration: ${element.styles?.textDecoration || 'none'};
            display: ${element.styles?.display || 'inline-block'};
            margin: ${element.styles?.margin || '0'};
          `
          html += `<div style="text-align: ${element.content?.alignment || 'center'}; padding: 10px;">
            <a href="${element.content.link}" style="${btnStyles}">${element.content.text}</a>
          </div>`
          break
          
        case 'divider':
          const dividerStyles = `
            border-top: ${element.styles?.borderTop || '1px solid #ddd'};
            margin: ${element.styles?.margin || '20px 0'};
            width: ${element.styles?.width || '100%'};
            border: 0;
          `
          html += `<hr style="${dividerStyles}" />`
          break
          
        case 'spacer':
          html += `<div style="height: ${element.styles?.height || '20px'}; width: ${element.styles?.width || '100%'};"></div>`
          break
      }
    })
    
    html += '</div>'
    return html
  }

  const handleSave = async () => {
    if (!campaign) return

    try {
      setSaving(true)
      
      // Prepare update data
      const updateData: any = {
        type: campaignType,
        name: campaign.name,
        status: campaign.status
      }

      if (campaignType === 'email') {
        // Convert elements to HTML
        const html = emailElements.length > 0 ? convertElementsToHTML(emailElements) : campaign.html_content
        
        updateData.subject = campaign.subject
        updateData.from_name = campaign.from_name
        updateData.from_email = campaign.from_email
        updateData.html_content = html
        updateData.text_content = html?.replace(/<[^>]*>/g, '') || ''
        updateData.json_content = JSON.stringify(emailElements)
      } else {
        updateData.message = campaign.message
        updateData.from_number = campaign.from_number
      }

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        router.push(`/campaigns/${campaignType}/${campaignId}/view`)
      } else {
        throw new Error('Failed to save campaign')
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('Failed to save campaign. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!campaign) return
    
    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/campaigns')
      } else {
        throw new Error('Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('Failed to delete campaign. Please try again.')
    }
  }

  const handleSaveAsTemplate = async (templateName: string) => {
    if (!campaign || !storeId) return

    try {
      const content = campaignType === 'email' 
        ? JSON.stringify(emailElements)
        : campaign.message

      // Extract variables from content
      const variableRegex = /\{\{(\w+)\}\}/g
      const variables: string[] = []
      let match
      const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
      while ((match = variableRegex.exec(contentStr)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1])
        }
      }

      const response = await fetch('/api/campaigns/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName,
          type: campaignType,
          content,
          variables,
          store_id: storeId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      alert('Template saved successfully!')
    } catch (error) {
      console.error('Error saving template:', error)
      throw error
    }
  }

  const handleLoadTemplate = (template: any) => {
    if (campaignType === 'email') {
      try {
        const elements = typeof template.content === 'string' 
          ? JSON.parse(template.content)
          : template.content
        setEmailElements(elements)
      } catch (e) {
        console.error('Failed to parse template content:', e)
        alert('Failed to load template')
      }
    } else {
      setCampaign({ ...campaign, message: template.content })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-hi)]" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="card-premium w-full max-w-md p-10 text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">Campaign Not Found</h1>
          <p className="text-white/60 mb-8">{error}</p>
          <Link href="/campaigns" className="btn-primary">
            Back to Campaigns
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/campaigns/${campaignType}/${campaignId}/view`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
            aria-label="Back to campaign"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3 min-w-0">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shrink-0">
              {campaignType === 'email' ? <Mail className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold text-white truncate">Edit Campaign</h1>
              <p className="text-white/60">{campaignType === 'email' ? 'Email campaign' : 'SMS campaign'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="btn-secondary"
          >
            <FileText className="w-4 h-4" />
            Load Template
          </button>
          <button
            onClick={() => setShowSaveTemplateModal(true)}
            className="btn-secondary"
          >
            <FileText className="w-4 h-4" />
            Save as Template
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

        {/* Edit Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Campaign Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-white/55 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  value={campaign.name}
                  onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                  className="input-premium w-full"
                  placeholder="Enter campaign name"
                />
              </div>

              {campaignType === 'email' ? (
                <>
                  {/* Email Subject */}
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-2">
                      Subject Line *
                    </label>
                    <input
                      type="text"
                      value={campaign.subject || ''}
                      onChange={(e) => setCampaign({ ...campaign, subject: e.target.value })}
                      className="input-premium w-full"
                      placeholder="Enter email subject"
                    />
                  </div>

                  {/* From Name */}
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-2">
                      From Name *
                    </label>
                    <input
                      type="text"
                      value={campaign.from_name || ''}
                      onChange={(e) => setCampaign({ ...campaign, from_name: e.target.value })}
                      className="input-premium w-full"
                      placeholder="Enter sender name"
                    />
                  </div>

                  {/* From Email */}
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-2">
                      From Email *
                    </label>
                    <select
                      value={campaign.from_email || ''}
                      onChange={(e) => setCampaign({ ...campaign, from_email: e.target.value })}
                      className="input-premium w-full"
                    >
                      <option value="">Select an email address</option>
                      {emailAddresses.map((address) => (
                        <option key={address.id} value={address.email}>
                          {address.email} {address.status === 'Verified' ? '✓' : `(${address.status})`}
                        </option>
                      ))}
                    </select>
                    {emailAddresses.length === 0 && (
                      <p className="text-amber-400 text-xs mt-1">
                        No email addresses found. Please add an email address in Settings.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* From Number */}
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-2">
                      From Number *
                    </label>
                    <input
                      type="text"
                      value={campaign.from_number || ''}
                      onChange={(e) => setCampaign({ ...campaign, from_number: e.target.value })}
                      className="input-premium w-full"
                      placeholder="Enter sender phone number"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Campaign Builder */}
          {campaignType === 'email' ? (
            <EmailCampaignBuilder
              initialContent={emailElements}
              onContentChange={setEmailElements}
            />
          ) : (
            <SMSCampaignBuilder
              initialMessage={campaign.message || ''}
              onMessageChange={(message) => {
                setCampaign({ ...campaign, message })
              }}
              fromNumber={campaign.from_number || '+1 (555) 123-4567'}
              recipientCount={campaign.recipient_count || 0}
            />
          )}

          {/* Actions */}
          <div className="card-premium p-6">
            <div className="flex justify-between">
              <button
                onClick={handleDelete}
                className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20"
              >
                Delete Campaign
              </button>
              <div className="flex space-x-3">
                <Link
                  href={`/campaigns/${campaignType}/${campaignId}/view`}
                  className="btn-secondary"
                >
                  Cancel
                </Link>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>

      {/* Save Template Modal */}
      <SaveTemplateModal
        isOpen={showSaveTemplateModal}
        onClose={() => setShowSaveTemplateModal(false)}
        onSave={handleSaveAsTemplate}
        type={campaignType as 'email' | 'sms'}
      />

      {/* Template Selector Modal */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelect={handleLoadTemplate}
        type={campaignType as 'email' | 'sms'}
      />
    </div>
  )
}

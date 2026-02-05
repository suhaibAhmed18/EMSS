'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Save } from 'lucide-react'
import EmailCampaignBuilder from '@/components/campaigns/EmailCampaignBuilder'
import SMSCampaignBuilder from '@/components/campaigns/SMSCampaignBuilder'

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

  const campaignType = params.type as string
  const campaignId = params.id as string

  useEffect(() => {
    loadCampaign()
  }, [campaignId, campaignType])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}?type=${campaignType}`)
      
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
        
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
            font-size: ${element.styles.fontSize};
            color: ${element.styles.color};
            font-weight: ${element.styles.fontWeight};
            line-height: ${element.styles.lineHeight};
            text-align: ${element.content.alignment};
            padding: ${element.styles.padding};
          `
          html += `<${tag} style="${textStyles}">${element.content.text}</${tag}>`
          break
          
        case 'image':
          const imgStyles = `
            width: ${element.styles.width};
            max-width: ${element.styles.maxWidth};
            height: auto;
            display: block;
            margin: 0 auto;
            padding: ${element.styles.padding};
          `
          const imgHtml = `<img src="${element.content.src}" alt="${element.content.alt}" style="${imgStyles}" />`
          html += element.content.link 
            ? `<a href="${element.content.link}" style="text-align: ${element.content.alignment}; display: block;">${imgHtml}</a>`
            : `<div style="text-align: ${element.content.alignment};">${imgHtml}</div>`
          break
          
        case 'button':
          const btnStyles = `
            background-color: ${element.styles.backgroundColor};
            color: ${element.styles.color};
            padding: ${element.styles.padding};
            border-radius: ${element.styles.borderRadius};
            font-size: ${element.styles.fontSize};
            text-decoration: ${element.styles.textDecoration};
            display: ${element.styles.display};
            margin: ${element.styles.margin};
          `
          html += `<div style="text-align: ${element.content.alignment}; padding: 10px;">
            <a href="${element.content.link}" style="${btnStyles}">${element.content.text}</a>
          </div>`
          break
          
        case 'divider':
          html += `<hr style="${element.styles.borderTop}; margin: ${element.styles.margin}; width: ${element.styles.width}; border: 0;" />`
          break
          
        case 'spacer':
          html += `<div style="height: ${element.styles.height}; width: ${element.styles.width};"></div>`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Campaign Not Found</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <Link href="/campaigns" className="btn-primary">
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/campaigns/${campaignType}/${campaignId}/view`} className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mr-4">
                {campaignType === 'email' ? (
                  <Mail className="w-6 h-6 text-white" />
                ) : (
                  <MessageSquare className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Edit Campaign</h1>
                <p className="text-gray-400">
                  {campaignType === 'email' ? 'Email Campaign' : 'SMS Campaign'}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
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
                <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      From Email *
                    </label>
                    <input
                      type="email"
                      value={campaign.from_email || ''}
                      onChange={(e) => setCampaign({ ...campaign, from_email: e.target.value })}
                      className="input-premium w-full"
                      placeholder="Enter sender email"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* From Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
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
      </div>
    </div>
  )
}

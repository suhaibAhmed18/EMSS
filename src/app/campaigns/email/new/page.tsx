'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import EmailCampaignBuilder from '@/components/campaigns/EmailCampaignBuilder'
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Clock, 
  Users, 
  Eye, 
  Smartphone, 
  Monitor,
  Calendar,
  Mail
} from 'lucide-react'

interface Store {
  id: string
  shop_domain: string
  store_name: string
}

interface EmailElement {
  id: string
  type: 'text' | 'image' | 'button' | 'divider' | 'spacer'
  content: any
  styles: any
}

export default function NewEmailCampaignPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const [stores, setStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    store_id: '',
    name: '',
    subject: '',
    html_content: '',
    text_content: '',
    from_email: '',
    from_name: '',
    send_type: 'now', // 'now' or 'later'
    scheduled_at: ''
  })

  const [emailElements, setEmailElements] = useState<EmailElement[]>([])

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

  // Update HTML content when elements change
  useEffect(() => {
    if (emailElements.length > 0) {
      const html = convertElementsToHTML(emailElements)
      setFormData(prev => ({ ...prev, html_content: html }))
    }
  }, [emailElements])

  useEffect(() => {
    if (user) {
      loadStores()
    }
  }, [user])

  const loadStores = async () => {
    try {
      const response = await fetch('/api/stores')
      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
        if (data.stores?.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            store_id: data.stores[0].id,
            from_email: data.stores[0].store_email || 'hello@store.com',
            from_name: data.stores[0].store_name || 'Store Team'
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load stores:', error)
    } finally {
      setLoadingStores(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!formData.name || !formData.subject || !formData.store_id) {
      alert('Please fill in the required fields: name, subject, and store')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'email',
          ...formData,
          json_content: JSON.stringify(emailElements),
          status: 'draft'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save draft')
      }

      const data = await response.json()
      alert('Draft saved successfully!')
      router.push('/campaigns')
    } catch (error) {
      console.error('Failed to save draft:', error)
      alert('Failed to save draft. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSendCampaign = async () => {
    if (!formData.name || !formData.subject || !formData.html_content || !formData.store_id) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.send_type === 'later' && !formData.scheduled_at) {
      alert('Please select a date and time for scheduling')
      return
    }

    setSending(true)
    try {
      // First create the campaign
      const createResponse = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'email',
          ...formData,
          json_content: JSON.stringify(emailElements),
          status: formData.send_type === 'now' ? 'sending' : 'scheduled'
        })
      })

      if (!createResponse.ok) {
        throw new Error('Failed to create campaign')
      }

      const campaignData = await createResponse.json()

      // If sending now, trigger the send
      if (formData.send_type === 'now') {
        const sendResponse = await fetch(`/api/campaigns/${campaignData.campaign.id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (!sendResponse.ok) {
          throw new Error('Failed to send campaign')
        }

        alert('Campaign sent successfully!')
      } else {
        alert(`Campaign scheduled for ${new Date(formData.scheduled_at).toLocaleString()}`)
      }

      router.push('/campaigns')
    } catch (error) {
      console.error('Failed to send campaign:', error)
      alert('Failed to send campaign. Please try again.')
    } finally {
      setSending(false)
    }
  }

  if (loading || loadingStores) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-64 mb-6"></div>
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 h-32"></div>
              <div className="bg-gray-900 rounded-lg p-6 h-48"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Create Email Campaign
            </h1>
            <p className="text-gray-400 mt-2">
              Design and send email campaigns to your customers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Campaign Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Welcome Email Series"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Store *
                  </label>
                  <select
                    value={formData.store_id}
                    onChange={(e) => {
                      const selectedStore = stores.find(s => s.id === e.target.value)
                      setFormData({ 
                        ...formData, 
                        store_id: e.target.value,
                        from_email: selectedStore?.store_email || 'hello@store.com',
                        from_name: selectedStore?.store_name || 'Store Team'
                      })
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a store</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.store_name} ({store.shop_domain})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Welcome to our store! 🎉"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sender Information */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Sender Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Name *
                  </label>
                  <input
                    type="text"
                    value={formData.from_name}
                    onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Store Team"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Email *
                  </label>
                  <input
                    type="email"
                    value={formData.from_email}
                    onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="hello@store.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Builder */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Design Your Email</h2>
              <EmailCampaignBuilder
                initialContent={emailElements}
                onContentChange={setEmailElements}
              />
            </div>

            {/* Send Options */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Send Options</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="send_type"
                      value="now"
                      checked={formData.send_type === 'now'}
                      onChange={(e) => setFormData({ ...formData, send_type: e.target.value })}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Send Now</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="send_type"
                      value="later"
                      checked={formData.send_type === 'later'}
                      onChange={(e) => setFormData({ ...formData, send_type: e.target.value })}
                      className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-700 focus:ring-blue-500"
                    />
                    <span className="text-gray-300">Schedule for Later</span>
                  </label>
                </div>

                {formData.send_type === 'later' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Schedule Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_at}
                      onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSendCampaign}
                disabled={sending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 disabled:opacity-50"
              >
                {formData.send_type === 'now' ? (
                  <>
                    <Send className="w-5 h-5" />
                    {sending ? 'Sending...' : 'Send Now'}
                  </>
                ) : (
                  <>
                    <Clock className="w-5 h-5" />
                    {sending ? 'Scheduling...' : 'Schedule Campaign'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
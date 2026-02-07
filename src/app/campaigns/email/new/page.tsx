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
      <div className="animate-pulse max-w-4xl mx-auto space-y-6">
        <div className="h-8 w-64 rounded-xl bg-white/[0.06]" />
        <div className="space-y-6">
          <div className="h-32 rounded-2xl border border-white/10 bg-white/[0.03]" />
          <div className="h-48 rounded-2xl border border-white/10 bg-white/[0.03]" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-premium">Create Email Campaign</h1>
          <p className="text-white/60 mt-2">Design and send email campaigns to your customers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="card-premium p-6">
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
                    className="input-premium w-full"
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
                    className="input-premium w-full"
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
                    className="input-premium w-full"
                    placeholder="e.g., Welcome to our store! 🎉"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sender Information */}
            <div className="card-premium p-6">
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
                    className="input-premium w-full"
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
                    className="input-premium w-full"
                    placeholder="hello@store.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email Builder */}
            <div className="card-premium p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Design Your Email</h2>
              <EmailCampaignBuilder
                initialContent={emailElements}
                onContentChange={setEmailElements}
              />
            </div>

            {/* Send Options */}
            <div className="card-premium p-6">
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
                      className="w-4 h-4 text-[color:var(--accent-hi)] bg-white/10 border-white/20 focus:ring-white/20"
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
                      className="w-4 h-4 text-[color:var(--accent-hi)] bg-white/10 border-white/20 focus:ring-white/20"
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
                      className="input-premium w-full"
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
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                onClick={handleSendCampaign}
                disabled={sending}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
  )
}

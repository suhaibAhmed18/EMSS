'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Clock, 
  Users, 
  MessageSquare,
  Calendar,
  Smartphone
} from 'lucide-react'

interface Store {
  id: string
  shop_domain: string
  store_name: string
}

export default function NewSMSCampaignPage() {
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
    message: '',
    from_number: '+1234567890',
    send_type: 'now', // 'now' or 'later'
    scheduled_at: ''
  })

  const maxLength = 160
  const messageLength = formData.message.length

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
            store_id: data.stores[0].id
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
    if (!formData.name || !formData.message || !formData.store_id) {
      alert('Please fill in the required fields: name, message, and store')
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
          type: 'sms',
          ...formData,
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
    if (!formData.name || !formData.message || !formData.store_id) {
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
          type: 'sms',
          ...formData,
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

        alert('SMS campaign sent successfully!')
      } else {
        alert(`SMS campaign scheduled for ${new Date(formData.scheduled_at).toLocaleString()}`)
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-premium">Create SMS Campaign</h1>
          <p className="text-white/60 mt-2">Send SMS messages to your customers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="card-premium p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-premium w-full"
                    placeholder="e.g., Flash Sale Alert"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Store *
                  </label>
                  <select
                    value={formData.store_id}
                    onChange={(e) => setFormData({ ...formData, store_id: e.target.value })}
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
              </div>
            </div>

            {/* SMS Content */}
            <div className="card-premium p-6">
              <h2 className="text-xl font-semibold text-white mb-4">SMS Message</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Message *
                    </label>
                    <span className={`text-sm ${
                      messageLength > maxLength ? 'text-red-400' : 'text-white/55'
                    }`}>
                      {messageLength}/{maxLength}
                    </span>
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-premium w-full"
                    rows={4}
                    placeholder="🔥 Flash Sale! 50% off everything. Use code FLASH50. Shop now: [link]"
                    required
                    maxLength={maxLength}
                  />
                  <p className="text-xs text-white/45 mt-1">
                    Keep your message under 160 characters for best delivery rates
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    From Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.from_number}
                    onChange={(e) => setFormData({ ...formData, from_number: e.target.value })}
                    className="input-premium w-full"
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>
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
                    <span className="text-white/70">Send Now</span>
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
                    <span className="text-white/70">Schedule for Later</span>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="card-premium p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-white/70" />
                  <span className="text-sm text-white/55">SMS Preview</span>
                </div>
                <div className="bg-[linear-gradient(135deg,rgba(4,31,26,0.98),rgba(10,83,70,0.95))] text-white p-3 rounded-2xl border border-white/10 text-sm max-w-xs">
                  {formData.message || 'Your SMS message will appear here...'}
                </div>
                <div className="text-xs text-white/45 mt-2">
                  From: {formData.from_number || '+1234567890'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card-premium p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="btn-secondary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formData.send_type === 'now' ? (
                    <>
                      <Send className="w-4 h-4" />
                      {sending ? 'Sending...' : 'Send Now'}
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4" />
                      {sending ? 'Scheduling...' : 'Schedule SMS'}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="card-premium p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Estimated Reach</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-white/55">Total Contacts</span>
                  <span className="text-white font-semibold">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/55">SMS Subscribers</span>
                  <span className="text-white font-semibold">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/55">Estimated Delivery</span>
                  <span className="text-white font-semibold">-</span>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

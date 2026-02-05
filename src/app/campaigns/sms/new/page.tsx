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
              Create SMS Campaign
            </h1>
            <p className="text-gray-400 mt-2">
              Send SMS messages to your customers
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              </div>
            </div>

            {/* SMS Content */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">SMS Message</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Message *
                    </label>
                    <span className={`text-sm ${
                      messageLength > maxLength ? 'text-red-400' : 'text-gray-400'
                    }`}>
                      {messageLength}/{maxLength}
                    </span>
                  </div>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="🔥 Flash Sale! 50% off everything. Use code FLASH50. Shop now: [link]"
                    required
                    maxLength={maxLength}
                  />
                  <p className="text-xs text-gray-500 mt-1">
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1234567890"
                    required
                  />
                </div>
              </div>
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Preview</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-gray-400">SMS Preview</span>
                </div>
                <div className="bg-blue-600 text-white p-3 rounded-lg text-sm max-w-xs">
                  {formData.message || 'Your SMS message will appear here...'}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  From: {formData.from_number || '+1234567890'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                <button
                  onClick={handleSendCampaign}
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
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
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Estimated Reach</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Contacts</span>
                  <span className="text-white font-semibold">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">SMS Subscribers</span>
                  <span className="text-white font-semibold">-</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Estimated Delivery</span>
                  <span className="text-white font-semibold">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
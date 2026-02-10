'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, ExternalLink, Info, Save } from 'lucide-react'

export default function SmsSettings() {
  const [settings, setSettings] = useState({
    phoneNumber: '',
    keyword: 'JOIN',
    senderName: 'TESTINGAPP',
    quietHoursEnabled: false,
    quietHoursStart: '00:00',
    quietHoursEnd: '00:00',
    dailyLimit: 400,
    timezone: 'America/New_York'
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasPhoneNumber, setHasPhoneNumber] = useState(false)

  useEffect(() => {
    loadSmsSettings()
  }, [])

  const loadSmsSettings = async () => {
    try {
      const response = await fetch('/api/settings/sms')
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, ...data.settings }))
        setHasPhoneNumber(!!data.settings?.phoneNumber)
      }
    } catch (error) {
      console.error('Failed to load SMS settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      
      if (response.ok) {
        alert('SMS settings saved successfully!')
      }
    } catch (error) {
      console.error('Failed to save SMS settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerateNumber = async () => {
    try {
      const response = await fetch('/api/settings/sms/generate-number', {
        method: 'POST'
      })
      
      if (response.ok) {
        const data = await response.json()
        setSettings(prev => ({ ...prev, phoneNumber: data.phoneNumber }))
        setHasPhoneNumber(true)
      }
    } catch (error) {
      console.error('Failed to generate phone number:', error)
    }
  }

  if (loading) {
    return (
      <div className="card-premium p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">SMS</h2>
        <p className="text-sm text-white/60 mb-4">
          SMS channel lets you extend your reach and increase engagement for your campaigns and automated sends.
        </p>
        <a href="#" className="text-sm text-[#16a085] hover:underline inline-flex items-center">
          Find out more <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-yellow-200">
          Messages from unverified phone numbers will not be delivered to US customers.
        </p>
      </div>

      {/* Phone Number Section */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Phone number (US only)</h3>
        <p className="text-sm text-white/60 mb-4">
          GENERATE PHONE NUMBER
        </p>
        <p className="text-sm text-white/60 mb-6">
          Starting SMS turns on with buying a number. Get yours here.
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={handleGenerateNumber}
            disabled={hasPhoneNumber}
            className="btn-primary"
          >
            Generate phone number
          </button>
        </div>

        {hasPhoneNumber && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <p className="text-sm text-emerald-200">
              Phone Number: <span className="font-semibold">{settings.phoneNumber}</span>
            </p>
          </div>
        )}
      </div>

      {/* Keyword Section */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Keyword (US/CA only)</h3>
        <p className="text-sm text-white/60 mb-4">
          Let customers subscribe to your SMS messages by texting this keyword to your number.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Keyword</label>
          <input
            type="text"
            value={settings.keyword}
            onChange={(e) => setSettings(prev => ({ ...prev, keyword: e.target.value.toUpperCase() }))}
            className="input-premium w-full max-w-xs"
            placeholder="JOIN"
          />
        </div>

        <a href="#" className="text-sm text-[#16a085] hover:underline inline-flex items-center mt-4">
          Find out more <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      {/* Sender's Name Section */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Sender's name</h3>
        <p className="text-sm text-white/60 mb-4">
          Your sender's name is the name that shows up as the sender of your SMS messages. It takes recipients to your brand. 
          Use up to 11 characters: letters and numbers only, no spaces or special characters. Will only be shown to non-US/CA recipients.
        </p>
        
        <div>
          <label className="block text-sm font-medium text-white/70 mb-2">Sender's name</label>
          <input
            type="text"
            value={settings.senderName}
            onChange={(e) => setSettings(prev => ({ ...prev, senderName: e.target.value.toUpperCase() }))}
            className="input-premium w-full max-w-xs"
            maxLength={11}
            placeholder="TESTINGAPP"
          />
          <p className="text-xs text-white/50 mt-2">
            {settings.senderName.length}/11 characters
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary mt-4"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Quiet Hours Section */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quiet hours</h3>
        <p className="text-sm text-white/60 mb-4">
          Daily SMS sending time so customers don't receive their at inconvenient times, like late at night or early in the morning.
        </p>
        
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.quietHoursEnabled}
              onChange={(e) => setSettings(prev => ({ ...prev, quietHoursEnabled: e.target.checked }))}
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#16a085] focus:ring-[#16a085] focus:ring-offset-0"
            />
            <span className="ml-3 text-sm text-white">Don't send SMS messages between</span>
          </label>
        </div>

        {settings.quietHoursEnabled && (
          <div className="flex items-center gap-4">
            <input
              type="time"
              value={settings.quietHoursStart}
              onChange={(e) => setSettings(prev => ({ ...prev, quietHoursStart: e.target.value }))}
              className="input-premium w-32"
            />
            <span className="text-white/60">and</span>
            <input
              type="time"
              value={settings.quietHoursEnd}
              onChange={(e) => setSettings(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
              className="input-premium w-32"
            />
            <span className="text-white/60">based on the customer's time zone</span>
          </div>
        )}

        <a href="#" className="text-sm text-[#16a085] hover:underline inline-flex items-center mt-4">
          Find out more <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      </div>

      {/* Daily Sending Limits Section */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Daily sending limits</h3>
        <p className="text-sm text-white/60 mb-4">
          Limit the number of SMS messages a customer can receive per day.
        </p>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={true}
              readOnly
              className="w-5 h-5 rounded border-white/20 bg-white/5 text-[#16a085] focus:ring-[#16a085] focus:ring-offset-0"
            />
            <span className="ml-3 text-sm text-white">Count on more than</span>
          </label>
          <input
            type="number"
            value={settings.dailyLimit}
            readOnly
            className="input-premium w-24 bg-white/5 cursor-not-allowed opacity-60"
            min="1"
          />
          <span className="text-white/60">SMS messages to a customer number</span>
        </div>

        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-200">
            Daily sending limit is determined by your subscription plan. Upgrade your plan to increase this limit.
          </p>
        </div>
      </div>
    </div>
  )
}

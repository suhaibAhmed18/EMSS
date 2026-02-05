'use client'

import { useState } from 'react'
import { Mail, MessageSquare, Eye, Save, Send } from 'lucide-react'
import EmailCampaignBuilder from './EmailCampaignBuilder'
import SMSCampaignBuilder from './SMSCampaignBuilder'
import CampaignPreview from './CampaignPreview'

interface CampaignBuilderWrapperProps {
  type: 'email' | 'sms'
  initialData?: any
  onSave?: (data: any, status: 'draft' | 'scheduled' | 'send') => void
  onPreview?: () => void
}

export default function CampaignBuilderWrapper({
  type,
  initialData = {},
  onSave,
  onPreview
}: CampaignBuilderWrapperProps) {
  const [campaignData, setCampaignData] = useState({
    name: initialData.name || '',
    // Email specific
    subject: initialData.subject || '',
    fromName: initialData.fromName || 'Your Store',
    fromEmail: initialData.fromEmail || 'hello@yourstore.com',
    emailContent: initialData.emailContent || [],
    // SMS specific
    message: initialData.message || '',
    fromNumber: initialData.fromNumber || '+1 (555) 123-4567',
    // Common
    recipients: initialData.recipients || 'all',
    scheduledAt: initialData.scheduledAt || '',
    sendImmediately: initialData.sendImmediately !== false,
    ...initialData
  })

  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async (status: 'draft' | 'scheduled' | 'send') => {
    if (!onSave) return

    try {
      setSaving(true)
      await onSave(campaignData, status)
    } catch (error) {
      console.error('Failed to save campaign:', error)
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    setShowPreview(true)
    onPreview?.()
  }

  const canSave = () => {
    if (type === 'email') {
      return campaignData.name && campaignData.subject && campaignData.fromName && campaignData.fromEmail
    } else {
      return campaignData.name && campaignData.message && campaignData.fromNumber
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {type === 'email' ? (
            <Mail className="w-8 h-8 text-blue-500 mr-3" />
          ) : (
            <MessageSquare className="w-8 h-8 text-green-500 mr-3" />
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">
              {type === 'email' ? 'Email' : 'SMS'} Campaign Builder
            </h1>
            <p className="text-gray-400">
              Create and design your {type === 'email' ? 'email' : 'SMS'} campaign
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreview}
            className="btn-ghost"
            disabled={!canSave()}
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving || !canSave()}
            className="btn-secondary"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(campaignData.sendImmediately ? 'send' : 'scheduled')}
            disabled={saving || !canSave()}
            className="btn-primary"
          >
            <Send className="w-4 h-4 mr-2" />
            {saving ? 'Sending...' : campaignData.sendImmediately ? 'Send Now' : 'Schedule'}
          </button>
        </div>
      </div>

      {/* Campaign Basic Info */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Campaign Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={campaignData.name}
              onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
              className="input-premium w-full"
              placeholder={type === 'email' ? 'Summer Sale Newsletter' : 'Flash Sale Alert'}
              required
            />
          </div>

          {type === 'email' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Subject Line *
                </label>
                <input
                  type="text"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                  className="input-premium w-full"
                  placeholder="Don't miss our biggest sale of the year!"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  From Name *
                </label>
                <input
                  type="text"
                  value={campaignData.fromName}
                  onChange={(e) => setCampaignData({ ...campaignData, fromName: e.target.value })}
                  className="input-premium w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  From Email *
                </label>
                <input
                  type="email"
                  value={campaignData.fromEmail}
                  onChange={(e) => setCampaignData({ ...campaignData, fromEmail: e.target.value })}
                  className="input-premium w-full"
                  required
                />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                From Number *
              </label>
              <select
                value={campaignData.fromNumber}
                onChange={(e) => setCampaignData({ ...campaignData, fromNumber: e.target.value })}
                className="input-premium w-full"
                required
              >
                <option value="+1 (555) 123-4567">+1 (555) 123-4567</option>
                <option value="+1 (555) 987-6543">+1 (555) 987-6543</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Builder */}
      {type === 'email' ? (
        <EmailCampaignBuilder
          initialContent={campaignData.emailContent}
          onContentChange={(content) => {
            setCampaignData({ ...campaignData, emailContent: content })
          }}
          onPreview={handlePreview}
        />
      ) : (
        <SMSCampaignBuilder
          initialMessage={campaignData.message}
          onMessageChange={(message, metadata) => {
            setCampaignData({ ...campaignData, message })
          }}
          onPreview={handlePreview}
          fromNumber={campaignData.fromNumber}
          recipientCount={1850}
        />
      )}

      {/* Preview Modal */}
      <CampaignPreview
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        type={type}
        content={type === 'email' ? campaignData.emailContent : campaignData.message}
        subject={campaignData.subject}
        fromName={campaignData.fromName}
        fromEmail={campaignData.fromEmail}
        fromNumber={campaignData.fromNumber}
      />
    </div>
  )
}
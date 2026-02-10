'use client'

import { useState } from 'react'
import { AlertTriangle, Info, Smartphone } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'

interface SMSMessageMetadata {
  characterCount: number
  segmentCount: number
  includeOptOut: boolean
}

interface SMSCampaignBuilderProps {
  initialMessage?: string
  onMessageChange?: (message: string, metadata: SMSMessageMetadata) => void
  onPreview?: () => void
  fromNumber?: string
  recipientCount?: number
}

export default function SMSCampaignBuilder({
  initialMessage = '',
  onMessageChange,
  fromNumber = '+1 (555) 123-4567',
  recipientCount = 0
}: SMSCampaignBuilderProps) {
  const [message, setMessage] = useState(initialMessage)
  const [includeOptOut, setIncludeOptOut] = useState(true)

  const handleMessageChange = (newMessage: string) => {
    setMessage(newMessage)
    onMessageChange?.(newMessage, {
      characterCount: newMessage.length,
      segmentCount: Math.ceil(newMessage.length / 160),
      includeOptOut
    })
  }

  const getMessageWithOptOut = () => {
    if (!includeOptOut || !message) return message
    return message + '\n\nReply STOP to opt out'
  }

  const finalMessage = getMessageWithOptOut()
  const characterCount = finalMessage.length
  const segmentCount = Math.ceil(characterCount / 160)
  const estimatedCost = (recipientCount * segmentCount * 0.01).toFixed(2)

  return (
    <div className="space-y-6">
      {/* Message Composer */}
      <div className="card-premium p-6">
        <h3 className="text-lg font-semibold text-white mb-4">SMS Message</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Message Content *
            </label>
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                className="input-premium w-full h-32 resize-none"
                placeholder="🔥 FLASH SALE: 50% off everything! Use code FLASH50. Shop now: [link]"
                maxLength={140} // Leave room for opt-out text
              />
              <div className="absolute bottom-3 right-3 text-sm text-white/55">
                {message.length}/140
              </div>
            </div>
            <p className="text-sm text-white/45 mt-2">
              Keep your message under 140 characters to leave room for opt-out instructions.
            </p>
          </div>

          <Checkbox
            id="includeOptOut"
            label="Automatically include opt-out instructions (Reply STOP to opt out)"
            checked={includeOptOut}
            onChange={(e) => setIncludeOptOut(e.target.checked)}
          />
        </div>
      </div>

      {/* Message Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Mobile Preview
          </h3>
          
          <div className="max-w-sm mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md shadow-premium">
            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <div className="text-xs text-white/55 mb-1">From: {fromNumber}</div>
              <div className="text-white text-sm whitespace-pre-wrap">
                {finalMessage || 'Your message will appear here...'}
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Message Statistics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-white/60">Character Count:</span>
              <span className="text-white font-medium">{characterCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">SMS Segments:</span>
              <span className="text-white font-medium">{segmentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Recipients:</span>
              <span className="text-white font-medium">{recipientCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Estimated Cost:</span>
              <span className="text-white font-medium">${estimatedCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-amber-200 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-200 mb-2">SMS Compliance Requirements</h4>
            <ul className="text-sm text-amber-100/90 space-y-1">
              <li>• All recipients must have explicitly opted in to receive SMS messages</li>
              <li>• Include clear opt-out instructions in every message</li>
              <li>• Honor opt-out requests immediately</li>
              <li>• Only send messages during appropriate hours (8 AM - 9 PM local time)</li>
              <li>• Messages over 160 characters will be split into multiple SMS segments</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Message Tips */}
      <div className="rounded-2xl border border-white/10 border-l-2 border-l-[color:var(--accent-hi)] bg-white/[0.02] p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-[color:var(--accent-hi)] mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-[color:var(--accent-hi)] mb-2">SMS Best Practices</h4>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• Keep messages concise and actionable</li>
              <li>• Use emojis sparingly to add personality</li>
              <li>• Include a clear call-to-action</li>
              <li>• Personalize with customer names when possible</li>
              <li>• Test your message on different devices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { MessageSquare, AlertTriangle, Info, Smartphone } from 'lucide-react'

interface SMSCampaignBuilderProps {
  initialMessage?: string
  onMessageChange?: (message: string, metadata: any) => void
  onPreview?: () => void
  fromNumber?: string
  recipientCount?: number
}

export default function SMSCampaignBuilder({
  initialMessage = '',
  onMessageChange,
  onPreview,
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
            <label className="block text-sm font-medium text-gray-400 mb-2">
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
              <div className="absolute bottom-3 right-3 text-sm text-gray-400">
                {message.length}/140
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Keep your message under 140 characters to leave room for opt-out instructions.
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="includeOptOut"
              checked={includeOptOut}
              onChange={(e) => setIncludeOptOut(e.target.checked)}
              className="mr-3"
            />
            <label htmlFor="includeOptOut" className="text-white">
              Automatically include opt-out instructions (Reply STOP to opt out)
            </label>
          </div>
        </div>
      </div>

      {/* Message Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Mobile Preview
          </h3>
          
          <div className="bg-gray-900 rounded-2xl p-4 max-w-sm mx-auto">
            <div className="bg-gray-800 rounded-lg p-3 mb-2">
              <div className="text-xs text-gray-400 mb-1">From: {fromNumber}</div>
              <div className="text-white text-sm">
                {finalMessage || 'Your message will appear here...'}
              </div>
            </div>
          </div>
        </div>

        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Message Statistics</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-400">Character Count:</span>
              <span className="text-white font-medium">{characterCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">SMS Segments:</span>
              <span className="text-white font-medium">{segmentCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Recipients:</span>
              <span className="text-white font-medium">{recipientCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Cost:</span>
              <span className="text-white font-medium">${estimatedCost}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
        <div className="flex items-start">
          <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-400 mb-2">SMS Compliance Requirements</h4>
            <ul className="text-sm text-yellow-200 space-y-1">
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
      <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-400 mb-2">SMS Best Practices</h4>
            <ul className="text-sm text-blue-200 space-y-1">
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
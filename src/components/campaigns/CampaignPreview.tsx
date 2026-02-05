'use client'

import { X, Mail, MessageSquare, Smartphone, Monitor } from 'lucide-react'

interface CampaignPreviewProps {
  isOpen: boolean
  onClose: () => void
  type: 'email' | 'sms'
  content?: any
  subject?: string
  fromName?: string
  fromEmail?: string
  fromNumber?: string
}

export default function CampaignPreview({
  isOpen,
  onClose,
  type,
  content,
  subject,
  fromName,
  fromEmail,
  fromNumber
}: CampaignPreviewProps) {
  if (!isOpen) return null

  const renderEmailPreview = () => (
    <div className="bg-white text-black rounded-lg overflow-hidden">
      <div className="bg-gray-100 p-4 border-b">
        <div className="text-sm">
          <div><strong>From:</strong> {fromName} &lt;{fromEmail}&gt;</div>
          <div><strong>Subject:</strong> {subject}</div>
        </div>
      </div>
      <div className="p-6">
        {content && Array.isArray(content) && content.length > 0 ? (
          <div>
            {content.map((element: any, index: number) => (
              <div key={index} className="mb-4">
                {element.type === 'text' && (
                  <div style={{ 
                    fontSize: element.styles?.fontSize || '16px',
                    color: element.styles?.color || '#333',
                    textAlign: element.content?.alignment || 'left'
                  }}>
                    {element.content?.text || 'Text content'}
                  </div>
                )}
                {element.type === 'image' && element.content?.src && (
                  <img 
                    src={element.content.src} 
                    alt={element.content.alt || 'Image'} 
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                )}
                {element.type === 'button' && (
                  <div style={{ textAlign: element.content?.alignment || 'center' }}>
                    <a
                      href={element.content?.link || '#'}
                      style={{
                        backgroundColor: element.styles?.backgroundColor || '#007bff',
                        color: element.styles?.color || '#ffffff',
                        padding: element.styles?.padding || '12px 24px',
                        borderRadius: element.styles?.borderRadius || '4px',
                        textDecoration: 'none',
                        display: 'inline-block'
                      }}
                    >
                      {element.content?.text || 'Button'}
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-8">
            No email content to preview
          </div>
        )}
      </div>
    </div>
  )

  const renderSMSPreview = () => (
    <div className="bg-gray-900 rounded-2xl p-4 max-w-sm mx-auto">
      <div className="bg-gray-800 rounded-lg p-3">
        <div className="text-xs text-gray-400 mb-2">From: {fromNumber}</div>
        <div className="text-white text-sm whitespace-pre-wrap">
          {content || 'No message content to preview'}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl bg-gray-900 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white flex items-center">
              {type === 'email' ? (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Email Preview
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5 mr-2" />
                  SMS Preview
                </>
              )}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-white"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {type === 'email' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg">
                    <Monitor className="w-4 h-4 mr-2" />
                    Desktop
                  </button>
                  <button className="flex items-center px-3 py-2 bg-gray-700 text-gray-300 rounded-lg">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Mobile
                  </button>
                </div>
                <div className="border border-gray-700 rounded-lg overflow-hidden">
                  {renderEmailPreview()}
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                {renderSMSPreview()}
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="button"
              className="btn-primary"
            >
              Send Test {type === 'email' ? 'Email' : 'SMS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
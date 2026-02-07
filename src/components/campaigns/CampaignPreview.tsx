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
    <div className="max-w-sm mx-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md shadow-premium">
      <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
        <div className="text-xs text-white/55 mb-2">From: {fromNumber}</div>
        <div className="text-white text-sm whitespace-pre-wrap">
          {content || 'No message content to preview'}
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-3xl backdrop-blur-xl">
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
              className="text-white/55 hover:text-white transition-colors"
              onClick={onClose}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {type === 'email' ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white">
                    <Monitor className="w-4 h-4" />
                    Desktop
                  </button>
                  <button type="button" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors">
                    <Smartphone className="w-4 h-4" />
                    Mobile
                  </button>
                </div>
                <div className="border border-white/10 rounded-2xl overflow-hidden">
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import CampaignWizard from '@/components/campaigns/CampaignWizard'
import { smsTemplates, SMSTemplate } from '@/lib/templates/sms-templates'
import { MessageSquare, Check, Zap, Target, Users, Eye, Plus } from 'lucide-react'

const WIZARD_STEPS = [
  { id: 'intro', title: 'Introduction', description: 'Learn about SMS campaigns' },
  { id: 'template', title: 'Choose Template', description: 'Select a message' },
  { id: 'customize', title: 'Customize Message', description: 'Edit your message' },
  { id: 'details', title: 'Campaign Details', description: 'Configure your campaign' },
  { id: 'review', title: 'Review & Send', description: 'Final review' }
]

export default function NewSMSCampaignPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<SMSTemplate | null>(null)
  const [customizedMessage, setCustomizedMessage] = useState('')
  const [campaignData, setCampaignData] = useState({
    name: '',
    message: '',
    segmentId: ''
  })

  const handleStartFromScratch = () => {
    setSelectedTemplate({
      id: 'scratch',
      name: 'Blank Message',
      description: 'Start from scratch',
      category: 'custom',
      message: '',
      characterCount: 0,
      variables: []
    })
    setCustomizedMessage('')
  }

  const handleNext = async () => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      await handleCreateCampaign()
    } else {
      // Auto-select "Start from Scratch" when moving from intro to template selection
      if (currentStep === 0 && !selectedTemplate) {
        handleStartFromScratch()
      }
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const handleCreateCampaign = async () => {
    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'sms',
          name: campaignData.name,
          message: customizedMessage,
          status: 'draft',
          template_id: selectedTemplate?.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/campaigns/sms/${data.campaign.id}/edit`)
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
    }
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return true
      case 1: return true // Template step - will auto-select "Start from Scratch" if none selected
      case 2: return customizedMessage.length > 0 && customizedMessage.length <= 160
      case 3: return campaignData.name && customizedMessage
      case 4: return true
      default: return false
    }
  }

  const characterCount = customizedMessage.length

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-premium">Create SMS Campaign</h1>
        <p className="mt-2 text-white/60">Follow the steps to create your SMS campaign</p>
      </div>

      <CampaignWizard
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoNext()}
        canGoPrevious={currentStep > 0}
      >
        {/* Step 1: Introduction */}
        {currentStep === 0 && (
          <div className="card-premium p-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] mb-6">
                <MessageSquare className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Reach customers instantly with SMS campaigns
              </h2>
              <p className="text-white/60 text-lg mb-8">
                Send targeted text messages that get opened and read within minutes
              </p>

              <div className="grid md:grid-cols-3 gap-6 text-left mb-8">
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">98% open rate</h3>
                  <p className="text-white/60 text-sm">
                    SMS messages are opened within 3 minutes on average
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Direct & personal</h3>
                  <p className="text-white/60 text-sm">
                    Reach customers directly on their mobile devices
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">High engagement</h3>
                  <p className="text-white/60 text-sm">
                    SMS drives 6-8x higher engagement than email
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Instant delivery</span>
                <span className="text-white/30">•</span>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>High conversion</span>
                <span className="text-white/30">•</span>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Easy to create</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Template Selection */}
        {currentStep === 1 && (
          <div className="card-premium p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">Choose a template</h2>
              <p className="text-white/60">
                Select a pre-written SMS template or start from scratch
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Template List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {/* Start from Scratch Button */}
                <button
                  onClick={() => {
                    handleStartFromScratch()
                  }}
                  className="w-full text-left p-6 rounded-2xl border-2 border-dashed border-emerald-400/50 bg-emerald-400/5 hover:bg-emerald-400/10 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold mb-1">Start from Scratch</h3>
                      <p className="text-white/60 text-sm">Create your own custom SMS message</p>
                    </div>
                    {selectedTemplate?.id === 'scratch' && (
                      <Check className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
                    <p className="text-white/40 text-sm italic">Blank message - write your own</p>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-1 rounded-lg bg-emerald-400/10 text-emerald-400">
                      Blank Canvas
                    </span>
                    <span className="text-white/40">
                      0 characters
                    </span>
                  </div>
                </button>

                {smsTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template)
                      setCustomizedMessage(template.message)
                    }}
                    className={`w-full text-left p-6 rounded-2xl border transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-emerald-400 bg-emerald-400/5'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                        <p className="text-white/60 text-sm">{template.description}</p>
                      </div>
                      {selectedTemplate?.id === template.id && (
                        <Check className="w-5 h-5 text-emerald-400" />
                      )}
                    </div>
                    
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 mb-3">
                      <p className="text-white/80 text-sm">{template.message}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-1 rounded-lg bg-white/5 text-white/60 capitalize">
                        {template.category}
                      </span>
                      <span className="text-white/40">
                        {template.characterCount} characters
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Preview */}
              <div className="sticky top-0">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <div className="bg-white/[0.05] px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-white font-semibold">Preview</h3>
                    <Eye className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="p-8 flex items-center justify-center min-h-[400px]">
                    {selectedTemplate ? (
                      <div className="max-w-sm w-full">
                        <div className="bg-blue-500 text-white p-4 rounded-2xl rounded-bl-none shadow-lg break-words">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{selectedTemplate.message}</p>
                        </div>
                        <p className="text-white/40 text-xs mt-2 ml-2">
                          {selectedTemplate.characterCount}/160 characters
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-white/20 mx-auto mb-4" />
                        <p className="text-white/60">Select a template to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customize Message */}
        {currentStep === 2 && selectedTemplate && (
          <div className="card-premium p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">Customize Your Message</h2>
              <p className="text-white/60">
                Edit the SMS message and see a live preview
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Editor */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-white/80 font-medium">Message Text</label>
                    <button
                      onClick={() => setCustomizedMessage(selectedTemplate.message)}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      Reset to original
                    </button>
                  </div>
                  <textarea
                    value={customizedMessage}
                    onChange={(e) => setCustomizedMessage(e.target.value)}
                    className="input-premium w-full h-48 resize-none"
                    placeholder="Enter your SMS message..."
                    maxLength={160}
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      wordWrap: 'break-word'
                    }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-white/40 text-sm">
                      SMS messages are limited to 160 characters
                    </p>
                    <p className={`text-sm font-medium ${
                      customizedMessage.length > 160 ? 'text-red-400' : 'text-white/60'
                    }`}>
                      {customizedMessage.length}/160
                    </p>
                  </div>
                </div>

                {/* Variable Helper */}
                {selectedTemplate.variables.length > 0 && (
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <p className="text-white/80 text-sm font-medium mb-2">Available Variables:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.variables.map((variable) => (
                        <button
                          key={variable}
                          onClick={() => {
                            const textarea = document.querySelector('textarea')
                            if (textarea) {
                              const start = textarea.selectionStart
                              const end = textarea.selectionEnd
                              const text = customizedMessage
                              const before = text.substring(0, start)
                              const after = text.substring(end)
                              setCustomizedMessage(before + `{{${variable}}}` + after)
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white/[0.05] text-white/80 text-xs hover:bg-white/[0.08] transition-colors font-mono"
                        >
                          {`{{${variable}}}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border border-amber-400/20 bg-amber-400/5">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-amber-400 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">SMS Best Practices</h4>
                      <ul className="text-white/60 text-sm space-y-1">
                        <li>• Keep messages short and clear</li>
                        <li>• Include a clear call-to-action</li>
                        <li>• Always include opt-out instructions</li>
                        <li>• Send at appropriate times (9am-8pm)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview */}
              <div className="sticky top-0">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <div className="bg-white/[0.05] px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-white font-semibold">Live Preview</h3>
                    <Eye className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="p-8 flex items-center justify-center min-h-[400px]">
                    <div className="max-w-sm w-full">
                      <div className="bg-blue-500 text-white p-4 rounded-2xl rounded-bl-none shadow-lg break-words">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{customizedMessage}</p>
                      </div>
                      <p className={`text-xs mt-2 ml-2 font-medium ${
                        customizedMessage.length > 160 ? 'text-red-400' : 'text-white/40'
                      }`}>
                        {customizedMessage.length}/160 characters
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Campaign Details */}
        {currentStep === 3 && (
          <div className="card-premium p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Campaign Details</h2>
            
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-white/80 mb-2 font-medium">Campaign Name</label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  placeholder="Optional campaign name for internal use"
                  className="input-premium w-full"
                />
                <p className="text-white/40 text-sm mt-1">For internal tracking only</p>
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">Message Preview</label>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-white/80 whitespace-pre-wrap break-words">{customizedMessage}</p>
                </div>
                <p className="text-white/40 text-sm mt-1">
                  This is how your message will appear to recipients
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {currentStep === 4 && (
          <div className="card-premium p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Review Your Campaign</h2>
            
            <div className="space-y-6 max-w-2xl">
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-semibold mb-4">Campaign Summary</h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-white/60">Campaign Name:</dt>
                    <dd className="text-white font-medium">{campaignData.name || 'Untitled'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Template:</dt>
                    <dd className="text-white font-medium">{selectedTemplate?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Characters:</dt>
                    <dd className="text-white font-medium">{characterCount}/160</dd>
                  </div>
                </dl>
              </div>

              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                <h3 className="text-white font-semibold mb-3">Message Preview</h3>
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-white/80 whitespace-pre-wrap break-words">{customizedMessage}</p>
                </div>
              </div>

              <div className="p-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/5">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Ready to create</h4>
                    <p className="text-white/60 text-sm">
                      Click "Finish" to create your campaign as a draft. You can edit and send it later.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CampaignWizard>
    </div>
  )
}

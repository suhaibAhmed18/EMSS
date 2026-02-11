'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'
import CampaignWizard from '@/components/campaigns/CampaignWizard'
import EmailBuilder from '@/components/campaigns/EmailBuilder'
import { emailTemplates, EmailTemplate } from '@/lib/templates/email-templates'
import { Mail, Check, Sparkles, Zap, Target, Eye, Edit, Search, Plus } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'
import { sanitizeHTML } from '@/lib/security/sanitize'

const WIZARD_STEPS = [
  { id: 'intro', title: 'Introduction', description: 'Learn about email campaigns' },
  { id: 'template', title: 'Choose Template', description: 'Select a design' },
  { id: 'customize', title: 'Customize Template', description: 'Edit your template' },
  { id: 'details', title: 'Campaign Details', description: 'Configure your campaign' },
  { id: 'review', title: 'Review & Send', description: 'Final review' }
]

export default function NewEmailCampaignPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [customizedHtml, setCustomizedHtml] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showSavedTemplates, setShowSavedTemplates] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<EmailTemplate[]>([])
  const [emailAddresses, setEmailAddresses] = useState<any[]>([])
  const [campaignData, setCampaignData] = useState({
    name: '',
    subject: '',
    preheader: '',
    senderName: '',
    senderEmail: '',
    replyTo: '',
    segmentId: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  // Load saved templates and email addresses
  useEffect(() => {
    if (user) {
      loadSavedTemplates()
      loadEmailAddresses()
    }
  }, [user])

  const loadSavedTemplates = async () => {
    try {
      const response = await fetch('/api/campaigns/templates?type=email')
      if (response.ok) {
        const data = await response.json()
        setSavedTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load saved templates:', error)
    }
  }

  const loadEmailAddresses = async () => {
    try {
      const response = await fetch('/api/settings/email-addresses')
      if (response.ok) {
        const data = await response.json()
        setEmailAddresses(data.emailAddresses || [])
      }
    } catch (error) {
      console.error('Failed to load email addresses:', error)
    }
  }

  const handleStartFromScratch = () => {
    setSelectedTemplate({
      id: 'scratch',
      name: 'Blank Template',
      description: 'Start from scratch',
      category: 'custom',
      thumbnail: '',
      subject: '',
      preheader: '',
      html: '',
      variables: []
    })
    setCustomizedHtml('')
  }

  const handleNext = async () => {
    if (currentStep === WIZARD_STEPS.length - 1) {
      // Final step - create campaign
      setIsCreating(true)
      await handleCreateCampaign()
      setIsCreating(false)
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
      // Get user's store
      const storesResponse = await fetch('/api/stores')
      if (!storesResponse.ok) {
        alert('Failed to get store information')
        return
      }
      
      const storesData = await storesResponse.json()
      const stores = storesData.stores || []
      
      if (stores.length === 0) {
        alert('No store found. Please connect a store first.')
        return
      }
      
      const store = stores[0] // Use first store
      
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'email',
          store_id: store.id,
          name: campaignData.name || 'Untitled Campaign',
          subject: campaignData.subject,
          html_content: customizedHtml,
          text_content: campaignData.preheader || '',
          from_email: campaignData.senderEmail || user?.email || 'noreply@example.com',
          from_name: campaignData.senderName || 'Your Store',
          status: 'draft'
        })
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/campaigns`)
      } else {
        const errorData = await response.json()
        alert(`Failed to create campaign: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to create campaign:', error)
      alert('Failed to create campaign. Please try again.')
    }
  }

  const canGoNext = () => {
    switch (currentStep) {
      case 0: return true // Intro
      case 1: return true // Template step - will auto-select "Start from Scratch" if none selected
      case 2: return true // Template customized (builder handles this)
      case 3: 
        // Details filled - require name, subject, sender name, and sender email
        return !!(
          campaignData.name && 
          campaignData.subject && 
          campaignData.senderName && 
          campaignData.senderEmail
        )
      case 4: return true // Review
      default: return false
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-premium">Create Email Campaign</h1>
        <p className="mt-2 text-white/60">Follow the steps to create your email campaign</p>
      </div>

      <CampaignWizard
        steps={WIZARD_STEPS}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onNext={handleNext}
        onPrevious={handlePrevious}
        canGoNext={canGoNext() && !isCreating}
        canGoPrevious={currentStep > 0 && !isCreating}
      >
        {/* Step 1: Introduction */}
        {currentStep === 0 && (
          <div className="card-premium p-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] mb-6">
                <Mail className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">
                Send branded email campaigns that look stunning on any device
              </h2>
              <p className="text-white/60 text-lg mb-8">
                Create professional email campaigns in minutes with our easy-to-use tools
              </p>

              <div className="grid md:grid-cols-3 gap-6 text-left mb-8">
                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Create any email in minutes</h3>
                  <p className="text-white/60 text-sm">
                    Use our intuitive editor to design beautiful emails quickly
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Choose from designer-made templates</h3>
                  <p className="text-white/60 text-sm">
                    Start with professionally designed templates that convert
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02]">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Add products from your store</h3>
                  <p className="text-white/60 text-sm">
                    Integrate your products seamlessly into your campaigns
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-white/60">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Mobile responsive</span>
                <span className="text-white/30">•</span>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Easy to customize</span>
                <span className="text-white/30">•</span>
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Track performance</span>
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
                Pick a professionally designed email template that'll not only help you succeed in your campaign goal but will make your email stand out on any device
              </p>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium w-full pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-premium px-4 py-2.5 text-sm"
              >
                <option value="all">All Categories</option>
                <option value="welcome">Welcome</option>
                <option value="promotional">Promotional</option>
                <option value="seasonal">Seasonal</option>
                <option value="transactional">Transactional</option>
                <option value="newsletter">Newsletter</option>
              </select>
            </div>

            <div className="flex gap-4 mb-6 border-b border-white/10">
              <button 
                onClick={() => setShowSavedTemplates(false)}
                className={`px-4 py-2 font-medium ${
                  !showSavedTemplates 
                    ? 'text-white border-b-2 border-emerald-400' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Templates ({emailTemplates.filter(t => 
                  (selectedCategory === 'all' || t.category === selectedCategory) &&
                  (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length})
              </button>
              <button 
                onClick={() => setShowSavedTemplates(true)}
                className={`px-4 py-2 font-medium ${
                  showSavedTemplates 
                    ? 'text-white border-b-2 border-emerald-400' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                My Templates ({savedTemplates.length})
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Template List */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {/* Start from Scratch Button */}
                {!showSavedTemplates && (
                  <button
                    onClick={() => {
                      handleStartFromScratch()
                    }}
                    className="w-full text-left p-4 rounded-2xl border-2 border-dashed border-emerald-400/50 bg-emerald-400/5 hover:bg-emerald-400/10 transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                        <Plus className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1">Start from Scratch</h3>
                        <p className="text-white/60 text-sm mb-2">Create your own custom email template</p>
                        <span className="inline-block px-2 py-1 rounded-lg bg-emerald-400/10 text-emerald-400 text-xs">
                          Blank Canvas
                        </span>
                      </div>
                    </div>
                  </button>
                )}

                {/* Template Cards */}
                {(showSavedTemplates ? savedTemplates : emailTemplates
                  .filter(t => 
                    (selectedCategory === 'all' || t.category === selectedCategory) &&
                    (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  ))
                  .map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      if (showSavedTemplates) {
                        // For saved templates, create a compatible template object
                        setSelectedTemplate({
                          id: template.id,
                          name: template.name,
                          description: 'Custom template',
                          category: 'custom',
                          thumbnail: '',
                          subject: campaignData.subject || 'Custom Email',
                          preheader: '',
                          html: template.content,
                          variables: template.variables || []
                        })
                        setCustomizedHtml(template.content)
                      } else {
                        setSelectedTemplate(template)
                        // Only set the HTML if switching to a different template or if no customized HTML exists
                        if (selectedTemplate?.id !== template.id || !customizedHtml) {
                          setCustomizedHtml(template.html)
                        }
                      }
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-emerald-400 bg-emerald-400/5'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                        <Mail className="w-8 h-8 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                        <p className="text-white/60 text-sm mb-2">{showSavedTemplates ? 'Custom template' : template.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-1 rounded-lg bg-white/5 text-white/60 text-xs capitalize">
                            {showSavedTemplates ? 'Custom' : template.category}
                          </span>
                          {selectedTemplate?.id === template.id && (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-medium">
                              <Check className="w-3 h-3" />
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {(showSavedTemplates ? savedTemplates : emailTemplates.filter(t => 
                  (selectedCategory === 'all' || t.category === selectedCategory) &&
                  (searchQuery === '' || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
                )).length === 0 && (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-white/20 mx-auto mb-4" />
                    {showSavedTemplates ? (
                      <>
                        <p className="text-white/60 mb-2">No saved templates yet</p>
                        <p className="text-white/40 text-sm">
                          Create a template and click "Save as Template" to save it here
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/60">No templates found matching your search</p>
                        <button
                          onClick={() => {
                            setSearchQuery('')
                            setSelectedCategory('all')
                          }}
                          className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm"
                        >
                          Clear filters
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Template Preview */}
              <div className="sticky top-0">
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  <div className="bg-white/[0.05] px-4 py-3 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-white font-semibold">Preview</h3>
                    <Eye className="w-4 h-4 text-white/60" />
                  </div>
                  <div className="p-6 max-h-[500px] overflow-y-auto bg-gray-100">
                    {selectedTemplate ? (
                      <div 
                        className="bg-white shadow-lg"
                        dangerouslySetInnerHTML={{ __html: sanitizeHTML(showSavedTemplates && selectedTemplate.id !== 'scratch' ? selectedTemplate.html : selectedTemplate.html) }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Mail className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-gray-600">Select a template to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customize Template */}
        {currentStep === 2 && selectedTemplate && (
          <div className="card-premium p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-2">Customize Your Email</h2>
              <p className="text-white/60">
                Drag and drop blocks to build your email. Click on any element to edit it.
              </p>
            </div>

            <EmailBuilder
              initialHtml={customizedHtml || selectedTemplate.html}
              onSave={(blocks, html) => {
                setCustomizedHtml(html)
              }}
              onSaveAsTemplate={async (blocks, html, name) => {
                try {
                  // Get user's store
                  const storesResponse = await fetch('/api/stores')
                  if (!storesResponse.ok) {
                    alert('Failed to get store information')
                    return
                  }
                  
                  const storesData = await storesResponse.json()
                  const stores = storesData.stores || []
                  
                  if (stores.length === 0) {
                    alert('No store found. Please connect a store first.')
                    return
                  }
                  
                  const store = stores[0]
                  
                  const response = await fetch('/api/campaigns/templates', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      store_id: store.id,
                      name,
                      type: 'email',
                      content: html,
                      variables: []
                    })
                  })

                  if (response.ok) {
                    alert('Template saved successfully!')
                    await loadSavedTemplates()
                  } else {
                    const errorData = await response.json()
                    alert(`Failed to save template: ${errorData.error || 'Unknown error'}`)
                  }
                } catch (error) {
                  console.error('Failed to save template:', error)
                  alert('Failed to save template')
                }
              }}
            />
          </div>
        )}

        {/* Step 4: Campaign Details */}
        {currentStep === 3 && (
          <div className="card-premium p-8">
            <h2 className="text-2xl font-semibold text-white mb-6">Campaign Details</h2>
            
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-white/80 mb-2 font-medium">
                  Campaign Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                  placeholder="e.g., Summer Sale 2024"
                  className="input-premium w-full"
                  required
                />
                <p className="text-white/40 text-sm mt-1">For internal tracking only</p>
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">
                  Subject Line <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData({ ...campaignData, subject: e.target.value })}
                  placeholder={selectedTemplate?.subject || 'Enter email subject'}
                  className="input-premium w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">Preheader</label>
                <input
                  type="text"
                  value={campaignData.preheader}
                  onChange={(e) => setCampaignData({ ...campaignData, preheader: e.target.value })}
                  placeholder="Short text that follows the subject line"
                  className="input-premium w-full"
                />
                <p className="text-white/40 text-sm mt-1">Appears after the subject in inbox preview</p>
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">
                  Sender's Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={campaignData.senderName}
                  onChange={(e) => setCampaignData({ ...campaignData, senderName: e.target.value })}
                  placeholder="Your Store Name"
                  className="input-premium w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-white/80 mb-2 font-medium">
                  Sender's Email Address <span className="text-red-400">*</span>
                </label>
                <select
                  value={campaignData.senderEmail}
                  onChange={(e) => setCampaignData({ ...campaignData, senderEmail: e.target.value })}
                  className="input-premium w-full"
                  required
                >
                  <option value="">Select an email address</option>
                  {emailAddresses
                    .filter((address) => address.status === 'Verified')
                    .map((address) => (
                      <option key={address.id} value={address.email}>
                        {address.email} ✓
                      </option>
                    ))}
                </select>
                {emailAddresses.filter((address) => address.status === 'Verified').length === 0 && (
                  <p className="text-amber-400 text-sm mt-2">
                    No verified email addresses found. Please add and verify an email address in Settings.
                  </p>
                )}
              </div>

              <Checkbox
                id="replyTo"
                label="Receive replies to a different email address"
              />
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
                    <dt className="text-white/60">Subject:</dt>
                    <dd className="text-white font-medium">{campaignData.subject}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Template:</dt>
                    <dd className="text-white font-medium">{selectedTemplate?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/60">Sender:</dt>
                    <dd className="text-white font-medium">{campaignData.senderName}</dd>
                  </div>
                </dl>
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

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, Zap, Mail, MessageSquare, Plus, Edit, Trash2, Power, PowerOff } from 'lucide-react'
import Checkbox from '@/components/ui/Checkbox'
import SubscriptionExpiryBanner from '@/components/SubscriptionExpiryBanner'
import { useRequireAuth } from '@/lib/auth/session'

interface Automation {
  id: string
  name: string
  description: string
  trigger_type: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  type: string
  goal: string
  channel: string
  badge?: string
  messageCount: number
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    description: 'Greet your new subscribers with a friendly email and encourage them to purchase after signup.',
    type: 'Welcome',
    goal: 'Convert Subscribers',
    channel: 'Email',
    badge: 'High Order Rate',
    messageCount: 1
  },
  {
    id: 'welcome-sms',
    name: 'Welcome',
    description: 'Greet your new subscribers with a friendly email and encourage them to purchase after signup. Follow up your email with SMS.',
    type: 'Welcome',
    goal: 'Convert Subscribers',
    channel: 'Email + SMS',
    badge: 'High Order Rate',
    messageCount: 1
  },
  {
    id: 'cart-abandonment',
    name: 'Abandoned Cart',
    description: 'Reach shoppers who add items to their cart and leave before starting checkout.',
    type: 'Cart Abandonment',
    goal: 'Recover Visitors',
    channel: 'Email',
    messageCount: 3
  },
  {
    id: 'abandoned-checkout',
    name: 'Abandoned Checkout',
    description: 'Send automated emails to shoppers who start checkout but don\'t make a purchase.',
    type: 'Cart Abandonment',
    goal: 'Recover Visitors',
    channel: 'Email',
    badge: 'High Order Rate',
    messageCount: 2
  },
  {
    id: 'browse-abandonment',
    name: 'Browse Abandonment',
    description: 'Re-engage visitors who browsed your store but didn\'t add anything to cart.',
    type: 'Browse Abandonment',
    goal: 'Recover Visitors',
    channel: 'Email',
    messageCount: 1
  },
  {
    id: 'post-purchase',
    name: 'Post-Purchase',
    description: 'Thank customers after purchase and encourage them to leave a review.',
    type: 'Post-Purchase',
    goal: 'Build Loyalty',
    channel: 'Email',
    messageCount: 2
  },
  {
    id: 'product-reviews',
    name: 'Product Reviews',
    description: 'Send customers automated emails with links to products they have bought recently.',
    type: 'Post-Purchase',
    goal: 'Build Loyalty',
    channel: 'Email',
    messageCount: 1
  },
  {
    id: 'wheel-of-fortune',
    name: 'Wheel of Fortune',
    description: 'Send a discount email to anyone who spins the Wheel of Fortune and wins.',
    type: 'Special Occasions',
    goal: 'Convert Subscribers',
    channel: 'Email',
    messageCount: 2
  }
]

export default function AutomationsPage() {
  const { user } = useRequireAuth()
  const router = useRouter()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loading, setLoading] = useState(true)
  const [showTemplates, setShowTemplates] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string[]>([])
  const [selectedGoal, setSelectedGoal] = useState<string[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string[]>([])

  useEffect(() => {
    loadAutomations()
  }, [])

  const loadAutomations = async () => {
    try {
      const response = await fetch('/api/automations')
      if (response.ok) {
        const data = await response.json()
        setAutomations(data.automations || [])
      }
    } catch (error) {
      console.error('Failed to load automations:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAutomation = async (id: string) => {
    try {
      const response = await fetch(`/api/automations/${id}/toggle`, {
        method: 'POST'
      })
      if (response.ok) {
        await loadAutomations()
        const automation = automations.find(a => a.id === id)
        const newStatus = automation ? !automation.is_active : true
        alert(`Automation ${newStatus ? 'activated' : 'paused'} successfully`)
      } else {
        const error = await response.json()
        alert(`Failed to toggle automation: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to toggle automation:', error)
      alert('Failed to toggle automation. Please try again.')
    }
  }

  const deleteAutomation = async (id: string) => {
    const automation = automations.find(a => a.id === id)
    if (!confirm(`Are you sure you want to delete "${automation?.name || 'this automation'}"?`)) return
    
    try {
      const response = await fetch(`/api/automations/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        await loadAutomations()
        alert('Automation deleted successfully')
      } else {
        const error = await response.json()
        alert(`Failed to delete automation: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to delete automation:', error)
      alert('Failed to delete automation. Please try again.')
    }
  }

  const toggleFilter = (category: 'type' | 'goal' | 'channel', value: string) => {
    const setters = {
      type: setSelectedType,
      goal: setSelectedGoal,
      channel: setSelectedChannel
    }
    const getters = {
      type: selectedType,
      goal: selectedGoal,
      channel: selectedChannel
    }
    
    const current = getters[category]
    const setter = setters[category]
    
    if (current.includes(value)) {
      setter(current.filter(v => v !== value))
    } else {
      setter([...current, value])
    }
  }

  const filteredTemplates = WORKFLOW_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = selectedType.length === 0 || selectedType.includes(template.type)
    const matchesGoal = selectedGoal.length === 0 || selectedGoal.includes(template.goal)
    const matchesChannel = selectedChannel.length === 0 || selectedChannel.includes(template.channel)
    
    return matchesSearch && matchesType && matchesGoal && matchesChannel
  })

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 rounded-xl bg-white/[0.06] mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 rounded-2xl border border-white/10 bg-white/[0.03]"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (showTemplates || automations.length === 0) {
    return (
      <div className="space-y-8">
        {/* Subscription Expiry Banner */}
        <SubscriptionExpiryBanner userId={user?.id} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-premium mb-2">Choose a pre-built automation workflow</h1>
            <p className="text-white/60 mt-2">Browse ready-made workflows for every step of your customer journey. Each workflow already contains the industry's best practices, so you can get up and running in minutes.</p>
          </div>
          <button
            onClick={() => router.push('/automations/builder')}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create from scratch
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="card-premium p-6 sticky top-8">
              <div className="space-y-6">
                {/* Type Filter */}
                <div>
                  <h3 className="text-sm font-semibold text-white/85 mb-3 uppercase tracking-wider">Type:</h3>
                  <div className="space-y-2">
                    {['Welcome', 'Cart Abandonment', 'Browse Abandonment', 'Post-Purchase', 'Special Occasions', 'Transactional'].map(type => (
                      <Checkbox
                        key={type}
                        label={type}
                        checked={selectedType.includes(type)}
                        onChange={() => toggleFilter('type', type)}
                      />
                    ))}
                  </div>
                </div>

                {/* Goal Filter */}
                <div>
                  <h3 className="text-sm font-semibold text-white/85 mb-3 uppercase tracking-wider">Goal:</h3>
                  <div className="space-y-2">
                    {['Convert Subscribers', 'Recover Visitors', 'Cross-Sell', 'Build Loyalty', 'Reactivate Customers'].map(goal => (
                      <Checkbox
                        key={goal}
                        label={goal}
                        checked={selectedGoal.includes(goal)}
                        onChange={() => toggleFilter('goal', goal)}
                      />
                    ))}
                  </div>
                </div>

                {/* Channel Filter */}
                <div>
                  <h3 className="text-sm font-semibold text-white/85 mb-3 uppercase tracking-wider">Channel:</h3>
                  <div className="space-y-2">
                    {['Email', 'Email + SMS'].map(channel => (
                      <Checkbox
                        key={channel}
                        label={channel}
                        checked={selectedChannel.includes(channel)}
                        onChange={() => toggleFilter('channel', channel)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/45 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search workflows"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium w-full pl-10 pr-4 py-3"
                />
              </div>
            </div>

            {/* Templates Grid */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Recommended</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                  <div key={template.id} className="card-premium-hover p-6">
                    {template.badge && (
                      <div className="inline-block px-2.5 py-1 bg-blue-400/10 text-blue-200 text-xs font-medium rounded-full mb-3 border border-blue-400/20">
                        {template.badge}
                      </div>
                    )}
                    <h3 className="text-lg font-semibold text-[color:var(--accent-hi)] mb-2">{template.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-white/60 mb-3">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        x{template.messageCount}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 mb-4 line-clamp-3">{template.description}</p>
                    <button
                      onClick={() => router.push(`/automations/builder?template=${template.id}`)}
                      className="w-full btn-secondary"
                    >
                      Customize workflow
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Subscription Expiry Banner */}
      <SubscriptionExpiryBanner userId={user?.id} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium mb-2">Automations</h1>
          <p className="text-white/60 mt-2">Manage your automated workflows</p>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="btn-primary"
        >
          <Zap className="w-4 h-4" />
          Create Automation
        </button>
      </div>

      {automations.length === 0 ? (
        <div className="card-premium p-12 text-center">
          <div className="w-16 h-16 bg-blue-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-blue-300" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No automations yet</h3>
          <p className="text-white/60 mb-6">
            Create your first automation to send targeted messages based on customer behavior
          </p>
          <button
            onClick={() => setShowTemplates(true)}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            Create Your First Automation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map(automation => (
            <div key={automation.id} className="card-premium-hover p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                      <span className={`badge ${automation.is_active ? 'badge-success' : 'badge-muted'}`}>
                        {automation.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {automation.description && (
                      <p className="text-white/60 text-sm mb-2">{automation.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-white/55">
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        {automation.trigger_type.replace(/_/g, ' ')}
                      </span>
                      <span>Created {new Date(automation.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleAutomation(automation.id)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                      automation.is_active
                        ? 'border-amber-400/20 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15'
                        : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15'
                    }`}
                    title={automation.is_active ? 'Pause' : 'Activate'}
                  >
                    {automation.is_active ? <PowerOff className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                  </button>
                  <Link
                    href={`/automations/builder?id=${automation.id}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => deleteAutomation(automation.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/session'
import { 
  Plus, 
  Zap, 
  Play, 
  Pause, 
  Edit, 
  Copy, 
  Trash2, 
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Mail,
  MessageSquare,
  ShoppingCart,
  UserPlus,
  Settings
} from 'lucide-react'

interface Automation {
  id: string
  name: string
  description: string
  trigger_type: string
  trigger_config: any
  actions: any[]
  conditions: any[]
  is_active: boolean
  created_at: string
  updated_at: string
  // Analytics (would be calculated)
  triggers?: number
  completions?: number
  revenue?: number
  conversionRate?: number
}

export default function AutomationsPage() {
  const { user, loading } = useRequireAuth()
  const [automations, setAutomations] = useState<Automation[]>([])
  const [loadingAutomations, setLoadingAutomations] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadAutomations()
    }
  }, [user])

  const loadAutomations = async () => {
    try {
      setLoadingAutomations(true)
      setError(null)
      
      const response = await fetch('/api/automations')
      if (!response.ok) {
        throw new Error('Failed to load automations')
      }
      
      const data = await response.json()
      setAutomations(data.automations || [])
    } catch (error) {
      console.error('Failed to load automations:', error)
      setError('Failed to load automations. Please try again.')
    } finally {
      setLoadingAutomations(false)
    }
  }

  const handleToggleAutomation = async (automationId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/automations/${automationId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle automation')
      }

      // Reload automations
      await loadAutomations()
    } catch (error) {
      console.error('Failed to toggle automation:', error)
      alert(`Failed to toggle automation. Please try again. ${error instanceof Error ? error.message : ''}`)
    }
  }

  const handleDeleteAutomation = async (automationId: string, automationName: string) => {
    if (!confirm(`Are you sure you want to delete "${automationName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/automations/${automationId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete automation')
      }

      // Reload automations
      await loadAutomations()
    } catch (error) {
      console.error('Failed to delete automation:', error)
      alert(`Failed to delete automation. Please try again. ${error instanceof Error ? error.message : ''}`)
    }
  }

  const handleDuplicateAutomation = async (automationId: string) => {
    try {
      const response = await fetch(`/api/automations/${automationId}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to duplicate automation')
      }

      // Reload automations
      await loadAutomations()
    } catch (error) {
      console.error('Failed to duplicate automation:', error)
      alert(`Failed to duplicate automation. Please try again. ${error instanceof Error ? error.message : ''}`)
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'customer_created':
        return <UserPlus className="w-5 h-5" />
      case 'cart_abandoned':
        return <ShoppingCart className="w-5 h-5" />
      case 'order_placed':
        return <DollarSign className="w-5 h-5" />
      case 'email_opened':
        return <Mail className="w-5 h-5" />
      default:
        return <Zap className="w-5 h-5" />
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'customer_created':
        return 'Customer Created'
      case 'cart_abandoned':
        return 'Cart Abandoned'
      case 'order_placed':
        return 'Order Placed'
      case 'email_opened':
        return 'Email Opened'
      default:
        return triggerType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  }

  if (loading || loadingAutomations) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 rounded-xl bg-white/[0.06]" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 rounded-2xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium">Automations</h1>
          <p className="mt-2 text-white/60">Create automated workflows to engage customers at the right time.</p>
        </div>
        <Link href="/automations/create" className="btn-primary w-fit">
          <Plus className="w-4 h-4" />
          Create Automation
        </Link>
      </div>

      {error && (
        <div className="card-premium p-4 border-red-400/20">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {automations.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <Zap className="w-14 h-14 text-white/35 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No automations found</h3>
          <p className="text-white/55 mb-6">Create your first automation to start engaging customers automatically.</p>
          <Link href="/automations/create" className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Your First Automation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {automations.map((automation) => (
            <div key={automation.id} className="card-premium-hover p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shrink-0">
                    <Zap className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white text-lg truncate">{automation.name}</h3>
                      <span className={automation.is_active ? 'badge badge-success' : 'badge badge-muted'}>
                        {automation.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <p className="text-white/60 mb-3">{automation.description}</p>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/70">
                        {getTriggerIcon(automation.trigger_type)}
                        <span className="whitespace-nowrap">Trigger: {getTriggerLabel(automation.trigger_type)}</span>
                      </span>

                      <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/70">
                        <Settings className="w-4 h-4" />
                        <span className="whitespace-nowrap">
                          {automation.actions.length} action{automation.actions.length !== 1 ? 's' : ''}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/55">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Triggers: {automation.triggers || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Completions: {automation.completions || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>Revenue: ${automation.revenue || 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Created: {new Date(automation.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleAutomation(automation.id, automation.is_active)}
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border transition-colors ${
                      automation.is_active
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200 hover:bg-emerald-400/15'
                        : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white'
                    }`}
                    title={automation.is_active ? 'Pause Automation' : 'Activate Automation'}
                    aria-label={automation.is_active ? 'Pause automation' : 'Activate automation'}
                  >
                    {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <Link
                    href={`/automations/${automation.id}/edit`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Edit Automation"
                    aria-label="Edit automation"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicateAutomation(automation.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Duplicate Automation"
                    aria-label="Duplicate automation"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAutomation(automation.id, automation.name)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15 transition-colors"
                    title="Delete Automation"
                    aria-label="Delete automation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {automations.length > 0 && (
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Automation Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Automations</span>
              </div>
              <p className="text-2xl font-semibold text-white">{automations.length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Play className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Active</span>
              </div>
              <p className="text-2xl font-semibold text-white">{automations.filter((a) => a.is_active).length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Triggers</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {automations.reduce((sum, automation) => sum + (automation.triggers || 0), 0)}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Revenue</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                ${automations.reduce((sum, automation) => sum + (automation.revenue || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

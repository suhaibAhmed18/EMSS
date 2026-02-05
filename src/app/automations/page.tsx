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
  MoreHorizontal,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Mail,
  MessageSquare,
  ShoppingCart,
  UserPlus,
  Calendar,
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
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-48 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900 rounded-lg p-6 h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Automations
            </h1>
            <p className="text-gray-400 mt-2">
              Create automated workflows to engage customers at the right time
            </p>
          </div>
          <Link
            href="/automations/create"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            Create Automation
          </Link>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Automations List */}
        {automations.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No automations found</h3>
            <p className="text-gray-500 mb-6">Create your first automation to start engaging customers automatically</p>
            <Link
              href="/automations/create"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Automation
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {automations.map((automation) => (
              <div key={automation.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white text-lg">{automation.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          automation.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {automation.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-gray-400 mb-3">{automation.description}</p>
                      
                      {/* Trigger Info */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1">
                          {getTriggerIcon(automation.trigger_type)}
                          <span className="text-sm text-gray-300">
                            Trigger: {getTriggerLabel(automation.trigger_type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1">
                          <Settings className="w-4 h-4" />
                          <span className="text-sm text-gray-300">
                            {automation.actions.length} action{automation.actions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <TrendingUp className="w-4 h-4" />
                          <span>Triggers: {automation.triggers || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>Completions: {automation.completions || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span>Revenue: ${automation.revenue || 0}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>Created: {new Date(automation.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAutomation(automation.id, automation.is_active)}
                      className={`p-2 rounded-lg transition-colors ${
                        automation.is_active
                          ? 'text-green-400 hover:bg-green-400/10'
                          : 'text-gray-400 hover:bg-gray-400/10'
                      }`}
                      title={automation.is_active ? 'Pause Automation' : 'Activate Automation'}
                    >
                      {automation.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <Link
                      href={`/automations/${automation.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Edit Automation"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDuplicateAutomation(automation.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Duplicate Automation"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAutomation(automation.id, automation.name)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete Automation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Automation Stats */}
        {automations.length > 0 && (
          <div className="mt-12 bg-gray-900/30 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Automation Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Total Automations</span>
                </div>
                <p className="text-2xl font-bold text-white">{automations.length}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Play className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">Active</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {automations.filter(a => a.is_active).length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Total Triggers</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {automations.reduce((sum, automation) => sum + (automation.triggers || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">Total Revenue</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  ${automations.reduce((sum, automation) => sum + (automation.revenue || 0), 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
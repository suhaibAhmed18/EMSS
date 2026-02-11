'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/session'
import SubscriptionExpiryBanner from '@/components/SubscriptionExpiryBanner'
import { 
  Plus, 
  Mail, 
  MessageSquare, 
  Search, 
  Eye,
  Edit,
  Copy,
  Trash2,
  TrendingUp,
  Users,
  Clock,
  Send
} from 'lucide-react'

interface Campaign {
  id: string
  name: string
  type: 'email' | 'sms'
  status: string
  subject?: string
  message?: string
  recipient_count: number
  delivered_count: number
  opened_count?: number
  clicked_count?: number
  created_at: string
  sent_at?: string
}

export default function CampaignsPage() {
  const { user, loading } = useRequireAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'email' | 'sms'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'sent' | 'scheduled'>('all')

  useEffect(() => {
    if (user) {
      loadCampaigns()
    }
  }, [user])

  const loadCampaigns = async () => {
    try {
      setLoadingCampaigns(true)
      const response = await fetch('/api/campaigns')
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data.campaigns || [])
      }
    } catch (error) {
      console.error('Failed to load campaigns:', error)
    } finally {
      setLoadingCampaigns(false)
    }
  }

  const handleDeleteCampaign = async (e: React.MouseEvent, campaignId: string, campaignName: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!confirm(`Are you sure you want to delete "${campaignName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete campaign')
      }

      await loadCampaigns()
    } catch (error) {
      console.error('Failed to delete campaign:', error)
      alert('Failed to delete campaign. Please try again.')
    }
  }

  const handleDuplicateCampaign = async (e: React.MouseEvent, campaignId: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate campaign')
      }

      await loadCampaigns()
    } catch (error) {
      console.error('Failed to duplicate campaign:', error)
      alert('Failed to duplicate campaign. Please try again.')
    }
  }

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.subject && campaign.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = filterType === 'all' || campaign.type === filterType
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'sent':
        return 'badge badge-success'
      case 'draft':
        return 'badge badge-muted'
      case 'scheduled':
        return 'badge badge-warning'
      case 'sending':
        return 'badge badge-warning'
      default:
        return 'badge badge-muted'
    }
  }

  if (loading || loadingCampaigns) {
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
      {/* Subscription Expiry Banner */}
      <SubscriptionExpiryBanner userId={user?.id} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium">Campaigns</h1>
          <p className="mt-2 text-white/60">Create and manage your email and SMS marketing campaigns.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/campaigns/email/new" className="btn-primary">
            <Mail className="w-4 h-4" />
            Email Campaign
          </Link>
          <Link href="/campaigns/sms/new" className="btn-secondary">
            <MessageSquare className="w-4 h-4" />
            SMS Campaign
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card-premium p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/45 w-4 h-4" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium w-full pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="input-premium px-3 py-2.5 text-sm"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="input-premium px-3 py-2.5 text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="card-premium p-10 text-center">
          <div className="flex justify-center gap-4 mb-6">
            <Mail className="w-14 h-14 text-white/35" />
            <MessageSquare className="w-14 h-14 text-white/35" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No campaigns found</h3>
          <p className="text-white/55 mb-6">Get started by creating your first campaign.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/campaigns/email/new" className="btn-primary">
              <Mail className="w-4 h-4" />
              Create Email Campaign
            </Link>
            <Link href="/campaigns/sms/new" className="btn-secondary">
              <MessageSquare className="w-4 h-4" />
              Create SMS Campaign
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="card-premium-hover p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shrink-0">
                    {campaign.type === 'email' ? (
                      <Mail className="w-6 h-6" />
                    ) : (
                      <MessageSquare className="w-6 h-6" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-white text-lg truncate">{campaign.name}</h3>
                      <span className={getStatusBadgeClass(campaign.status)}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                      <span className="badge badge-muted">{campaign.type.toUpperCase()}</span>
                    </div>

                    {campaign.subject && <p className="text-white/60 mb-3 truncate">{campaign.subject}</p>}

                    {campaign.message && (
                      <p className="text-white/60 mb-3">
                        {campaign.message.length > 100 ? `${campaign.message.substring(0, 100)}...` : campaign.message}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/55">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>Recipients: {campaign.recipient_count}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        <span>Delivered: {campaign.delivered_count}</span>
                      </div>
                      {campaign.type === 'email' && (
                        <>
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <span>Opened: {campaign.opened_count || 0}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>Clicked: {campaign.clicked_count || 0}</span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/campaigns/${campaign.type}/${campaign.id}/view`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="View Campaign"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/campaigns/${campaign.type}/${campaign.id}/edit`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Edit Campaign"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={(e) => handleDuplicateCampaign(e, campaign.id)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
                    title="Duplicate Campaign"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteCampaign(e, campaign.id, campaign.name)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-200 hover:bg-red-400/15 transition-colors"
                    title="Delete Campaign"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {campaigns.length > 0 && (
        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Email Campaigns</span>
              </div>
              <p className="text-2xl font-semibold text-white">{campaigns.filter((c) => c.type === 'email').length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-white/60" />
                <span className="text-white/55">SMS Campaigns</span>
              </div>
              <p className="text-2xl font-semibold text-white">{campaigns.filter((c) => c.type === 'sms').length}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Recipients</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {campaigns.reduce((sum, c) => sum + c.recipient_count, 0).toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Send className="w-5 h-5 text-white/60" />
                <span className="text-white/55">Total Delivered</span>
              </div>
              <p className="text-2xl font-semibold text-white">
                {campaigns.reduce((sum, c) => sum + c.delivered_count, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

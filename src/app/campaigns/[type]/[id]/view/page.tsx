'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Users, Eye, MousePointer, DollarSign } from 'lucide-react'
import { sanitizeHTML } from '@/lib/security/sanitize'

interface Campaign {
  id: string
  name: string
  subject?: string
  message?: string
  html_content?: string
  text_content?: string
  status: string
  recipient_count: number
  delivered_count: number
  opened_count: number
  clicked_count: number
  created_at: string
  sent_at?: string
  from_name?: string
  from_email?: string
  from_number?: string
}

export default function ViewCampaignPage() {
  const params = useParams()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const campaignType = params.type as string
  const campaignId = params.id as string

  useEffect(() => {
    loadCampaign()
  }, [campaignId, campaignType])

  const loadCampaign = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/campaigns/${campaignId}?type=${campaignType}`)
      
      if (response.ok) {
        const data = await response.json()
        setCampaign(data.campaign)
      } else {
        setError('Campaign not found')
      }
    } catch (error) {
      console.error('Error loading campaign:', error)
      setError('Failed to load campaign')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateRate = (numerator: number, denominator: number) => {
    if (denominator === 0) return 0
    return ((numerator / denominator) * 100).toFixed(1)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'sent':
      case 'active':
        return 'badge badge-success'
      case 'scheduled':
      case 'sending':
        return 'badge badge-warning'
      case 'draft':
        return 'badge badge-muted'
      default:
        return 'badge badge-muted'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[color:var(--accent-hi)]" />
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="card-premium w-full max-w-md p-10 text-center">
          <h1 className="text-2xl font-semibold text-white mb-4">Campaign Not Found</h1>
          <p className="text-white/60 mb-8">{error}</p>
          <Link href="/campaigns" className="btn-primary">
            Back to Campaigns
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/campaigns"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Back to campaigns"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shrink-0">
              {campaignType === 'email' ? <Mail className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-semibold text-white">{campaign.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="badge badge-muted">{campaignType === 'email' ? 'EMAIL CAMPAIGN' : 'SMS CAMPAIGN'}</span>
                <span className={getStatusBadgeClass(campaign.status)}>
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Campaign Content */}
            <div className="card-premium p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Campaign Content</h2>
              
              {campaignType === 'email' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-1">Subject Line</label>
                    <p className="text-white">{campaign.subject || 'No subject'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-1">From</label>
                    <p className="text-white">{campaign.from_name} &lt;{campaign.from_email}&gt;</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-2">Email Content</label>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 max-h-96 overflow-y-auto scrollbar-premium">
                      {campaign.html_content ? (
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(campaign.html_content) }} />
                      ) : (
                        <p className="text-white/60">No content available</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-1">From Number</label>
                    <p className="text-white">{campaign.from_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/55 mb-2">Message</label>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-white whitespace-pre-wrap">{campaign.message}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Performance Metrics */}
            {campaign.status === 'sent' && (
              <div className="card-premium p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <Users className="w-8 h-8 text-white/70 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{campaign.delivered_count.toLocaleString()}</div>
                    <div className="text-sm text-white/55">Delivered</div>
                    <div className="text-xs text-white/45">
                      {calculateRate(campaign.delivered_count, campaign.recipient_count)}%
                    </div>
                  </div>
                  
                  {campaignType === 'email' && (
                    <div className="text-center p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                      <Eye className="w-8 h-8 text-white/70 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{campaign.opened_count.toLocaleString()}</div>
                      <div className="text-sm text-white/55">Opened</div>
                      <div className="text-xs text-white/45">
                        {calculateRate(campaign.opened_count, campaign.delivered_count)}%
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <MousePointer className="w-8 h-8 text-white/70 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{campaign.clicked_count.toLocaleString()}</div>
                    <div className="text-sm text-white/55">Clicked</div>
                    <div className="text-xs text-white/45">
                      {calculateRate(campaign.clicked_count, campaign.delivered_count)}%
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-2xl border border-white/10 bg-white/[0.02]">
                    <DollarSign className="w-8 h-8 text-white/70 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">$0</div>
                    <div className="text-sm text-white/55">Revenue</div>
                    <div className="text-xs text-white/45">$0.00 per recipient</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Campaign Details */}
            <div className="card-premium p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Campaign Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-white/55">Created</label>
                  <p className="text-white text-sm">{formatDate(campaign.created_at)}</p>
                </div>
                {campaign.sent_at && (
                  <div>
                    <label className="block text-sm font-medium text-white/55">Sent</label>
                    <p className="text-white text-sm">{formatDate(campaign.sent_at)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-white/55">Recipients</label>
                  <p className="text-white text-sm">{campaign.recipient_count.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/55">Status</label>
                  <p className="text-white text-sm capitalize">{campaign.status}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="card-premium p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Actions</h3>
              <div className="space-y-3">
                <Link 
                  href={`/campaigns/${campaignType}/${campaign.id}/edit`}
                  className="w-full btn-secondary text-center block"
                >
                  Edit Campaign
                </Link>
                <button 
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/campaigns/${campaign.id}/duplicate`, {
                        method: 'POST',
                      })

                      if (response.ok) {
                        const data = await response.json()
                        alert(data.message || 'Campaign duplicated successfully')
                        window.location.href = '/campaigns'
                      } else {
                        throw new Error('Failed to duplicate campaign')
                      }
                    } catch (error) {
                      console.error('Error duplicating campaign:', error)
                      alert('Failed to duplicate campaign. Please try again.')
                    }
                  }}
                  className="w-full btn-ghost"
                >
                  Duplicate Campaign
                </button>
                <button 
                  onClick={async () => {
                    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
                      return
                    }
                    
                    try {
                      const response = await fetch(`/api/campaigns/${campaign.id}`, {
                        method: 'DELETE',
                      })

                      if (response.ok) {
                        window.location.href = '/campaigns'
                      } else {
                        throw new Error('Failed to delete campaign')
                      }
                    } catch (error) {
                      console.error('Error deleting campaign:', error)
                      alert('Failed to delete campaign. Please try again.')
                    }
                  }}
                  className="w-full btn-ghost text-red-400 hover:text-red-300 hover:bg-red-900/20"
                >
                  Delete Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

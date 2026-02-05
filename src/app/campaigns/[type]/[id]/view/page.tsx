'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, MessageSquare, Users, Eye, MousePointer, DollarSign, Calendar } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Campaign Not Found</h1>
            <p className="text-gray-400 mb-8">{error}</p>
            <Link href="/campaigns" className="btn-primary">
              Back to Campaigns
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/campaigns" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mr-4">
                {campaignType === 'email' ? (
                  <Mail className="w-6 h-6 text-white" />
                ) : (
                  <MessageSquare className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{campaign.name}</h1>
                <p className="text-gray-400">
                  {campaignType === 'email' ? 'Email Campaign' : 'SMS Campaign'} • 
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                    campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                </p>
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
                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject Line</label>
                    <p className="text-white">{campaign.subject || 'No subject'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">From</label>
                    <p className="text-white">{campaign.from_name} &lt;{campaign.from_email}&gt;</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Content</label>
                    <div className="bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {campaign.html_content ? (
                        <div dangerouslySetInnerHTML={{ __html: campaign.html_content }} />
                      ) : (
                        <p className="text-gray-400">No content available</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">From Number</label>
                    <p className="text-white">{campaign.from_number}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Message</label>
                    <div className="bg-gray-800 rounded-lg p-4">
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
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{campaign.delivered_count.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Delivered</div>
                    <div className="text-xs text-gray-500">
                      {calculateRate(campaign.delivered_count, campaign.recipient_count)}%
                    </div>
                  </div>
                  
                  {campaignType === 'email' && (
                    <div className="text-center p-4 bg-gray-800 rounded-lg">
                      <Eye className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{campaign.opened_count.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">Opened</div>
                      <div className="text-xs text-gray-500">
                        {calculateRate(campaign.opened_count, campaign.delivered_count)}%
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <MousePointer className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">{campaign.clicked_count.toLocaleString()}</div>
                    <div className="text-sm text-gray-400">Clicked</div>
                    <div className="text-xs text-gray-500">
                      {calculateRate(campaign.clicked_count, campaign.delivered_count)}%
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-800 rounded-lg">
                    <DollarSign className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-white">$0</div>
                    <div className="text-sm text-gray-400">Revenue</div>
                    <div className="text-xs text-gray-500">$0.00 per recipient</div>
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
                  <label className="block text-sm font-medium text-gray-400">Created</label>
                  <p className="text-white text-sm">{formatDate(campaign.created_at)}</p>
                </div>
                {campaign.sent_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400">Sent</label>
                    <p className="text-white text-sm">{formatDate(campaign.sent_at)}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-400">Recipients</label>
                  <p className="text-white text-sm">{campaign.recipient_count.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400">Status</label>
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
    </div>
  )
}
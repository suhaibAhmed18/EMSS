'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRequireAuth } from '@/lib/auth/session'
import { 
  Plus, 
  Mail, 
  MessageSquare, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Send,
  Calendar
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'sending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading || loadingCampaigns) {
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
              Campaigns
            </h1>
            <p className="text-gray-400 mt-2">
              Create and manage your email and SMS marketing campaigns
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/campaigns/email/new"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
            >
              <Mail className="w-4 h-4" />
              Email Campaign
            </Link>
            <Link
              href="/campaigns/sms/new"
              className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all duration-200"
            >
              <MessageSquare className="w-4 h-4" />
              SMS Campaign
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="text-center py-12">
            <div className="flex justify-center gap-4 mb-6">
              <Mail className="w-16 h-16 text-gray-600" />
              <MessageSquare className="w-16 h-16 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No campaigns found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first campaign</p>
            <div className="flex justify-center gap-3">
              <Link
                href="/campaigns/email/new"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <Mail className="w-5 h-5" />
                Create Email Campaign
              </Link>
              <Link
                href="/campaigns/sms/new"
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-6 py-3 rounded-lg font-medium inline-flex items-center gap-2"
              >
                <MessageSquare className="w-5 h-5" />
                Create SMS Campaign
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      campaign.type === 'email' 
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                        : 'bg-gradient-to-r from-green-600 to-teal-600'
                    }`}>
                      {campaign.type === 'email' ? (
                        <Mail className="w-6 h-6 text-white" />
                      ) : (
                        <MessageSquare className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-white text-lg">{campaign.name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </span>
                        <span className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-medium">
                          {campaign.type.toUpperCase()}
                        </span>
                      </div>
                      {campaign.subject && (
                        <p className="text-gray-400 mb-3">{campaign.subject}</p>
                      )}
                      {campaign.message && (
                        <p className="text-gray-400 mb-3">{campaign.message.substring(0, 100)}...</p>
                      )}
                      
                      {/* Campaign Metrics */}
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1 text-gray-400">
                          <Users className="w-4 h-4" />
                          <span>Recipients: {campaign.recipient_count}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Send className="w-4 h-4" />
                          <span>Delivered: {campaign.delivered_count}</span>
                        </div>
                        {campaign.type === 'email' && (
                          <>
                            <div className="flex items-center gap-1 text-gray-400">
                              <Eye className="w-4 h-4" />
                              <span>Opened: {campaign.opened_count || 0}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-400">
                              <TrendingUp className="w-4 h-4" />
                              <span>Clicked: {campaign.clicked_count || 0}</span>
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock className="w-4 h-4" />
                          <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/campaigns/${campaign.type}/${campaign.id}/view`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="View Campaign"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      href={`/campaigns/${campaign.type}/${campaign.id}/edit`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit Campaign"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={(e) => handleDuplicateCampaign(e, campaign.id)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Duplicate Campaign"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCampaign(e, campaign.id, campaign.name)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
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

        {/* Campaign Stats */}
        {campaigns.length > 0 && (
          <div className="mt-12 bg-gray-900/30 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Campaign Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-400">Email Campaigns</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {campaigns.filter(c => c.type === 'email').length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <span className="text-gray-400">SMS Campaigns</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {campaigns.filter(c => c.type === 'sms').length}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <span className="text-gray-400">Total Recipients</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {campaigns.reduce((sum, c) => sum + c.recipient_count, 0).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Send className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-400">Total Delivered</span>
                </div>
                <p className="text-2xl font-bold text-white">
                  {campaigns.reduce((sum, c) => sum + c.delivered_count, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
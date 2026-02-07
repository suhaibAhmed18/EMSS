'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Mail,
  MessageSquare,
  Users,
  Eye,
  MousePointer,
  ShoppingCart,
  Calendar,
  Download,
  Filter
} from 'lucide-react'

const timeRanges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 12 months', value: '12m' },
]

interface AnalyticsData {
  overview: {
    totalRevenue: number
    emailRevenue: number
    smsRevenue: number
    roi: number
  }
  email: {
    sent: number
    openRate: number
    clickRate: number
    conversionRate: number
  }
  sms: {
    sent: number
    deliveryRate: number
    clickRate: number
    conversionRate: number
  }
  topCampaigns: Array<{
    id: string
    name: string
    type: 'email' | 'sms'
    revenue: number
    sent: number
    openRate: number
    clickRate: number
    conversionRate: number
  }>
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [activeTab, setActiveTab] = useState('overview')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [timeRange])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`)
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }
      const data = await response.json()
      setAnalyticsData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?timeRange=${timeRange}`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium mb-2">Analytics</h1>
          <p className="text-white/60">Track your marketing performance and ROI.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-premium text-sm"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button onClick={handleExport} className="btn-ghost">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="card-premium p-4">
        <div className="flex flex-wrap gap-2">
          {['overview', 'email', 'sms', 'automation'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize border ${
                activeTab === tab
                  ? 'bg-white/[0.06] border-white/10 text-white'
                  : 'border-transparent text-white/55 hover:text-white hover:bg-white/[0.04] hover:border-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

        {/* Loading State */}
      {loading && (
        <div className="card-premium p-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/60">Loading analytics...</p>
          </div>
        </div>
      )}

        {/* Error State */}
      {error && (
        <div className="card-premium p-6 border border-red-400/20">
          <div className="text-center py-4">
            <p className="text-red-200 mb-4">Error: {error}</p>
            <button onClick={loadAnalytics} className="btn-primary">
              Retry
            </button>
          </div>
        </div>
      )}

        {/* No Data State */}
      {!loading && !error && !analyticsData && (
        <div className="card-premium p-6">
          <div className="text-center py-10">
            <BarChart3 className="w-12 h-12 text-white/35 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No Analytics Data</h3>
            <p className="text-white/60">
              Analytics data will appear here once you have campaigns and customer activity.
            </p>
          </div>
        </div>
      )}

        {/* Overview Tab */}
        {!loading && !error && analyticsData && activeTab === 'overview' && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">
                    ${analyticsData.overview.totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-white/55">Revenue from all campaigns</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">
                    ${analyticsData.overview.emailRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-white/55">Revenue from email campaigns</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">
                    ${analyticsData.overview.smsRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-white/55">Revenue from SMS campaigns</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {analyticsData.overview.roi}%
                  </p>
                  <p className="text-sm text-white/55">Return on investment</p>
                </div>
              </div>
            </div>

            {/* Revenue Chart and Channel Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 card-premium p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">Revenue Trend</h3>
                  <div className="flex items-center space-x-2">
                    <button className="btn-ghost text-sm">Email</button>
                    <button className="btn-ghost text-sm">SMS</button>
                    <button className="btn-ghost text-sm">Total</button>
                  </div>
                </div>
                <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-white/35 mx-auto mb-4" />
                    <p className="text-white/60">Revenue chart visualization</p>
                    <p className="text-sm text-white/45">Chart library integration needed</p>
                  </div>
                </div>
              </div>

              {/* Channel Breakdown */}
              <div className="card-premium p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Revenue by Channel</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">Email</span>
                      <span className="text-white">${analyticsData.overview.emailRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-accent h-2 rounded-full" 
                        style={{ 
                          width: `${analyticsData.overview.totalRevenue > 0 
                            ? (analyticsData.overview.emailRevenue / analyticsData.overview.totalRevenue) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                    <div className="text-sm text-white/55">
                      {analyticsData.overview.totalRevenue > 0 
                        ? Math.round((analyticsData.overview.emailRevenue / analyticsData.overview.totalRevenue) * 100)
                        : 0}% of total
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-medium">SMS</span>
                      <span className="text-white">${analyticsData.overview.smsRevenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-accent h-2 rounded-full" 
                        style={{ 
                          width: `${analyticsData.overview.totalRevenue > 0 
                            ? (analyticsData.overview.smsRevenue / analyticsData.overview.totalRevenue) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                    <div className="text-sm text-white/55">
                      {analyticsData.overview.totalRevenue > 0 
                        ? Math.round((analyticsData.overview.smsRevenue / analyticsData.overview.totalRevenue) * 100)
                        : 0}% of total
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Campaigns */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Top Performing Campaigns</h3>
                <button className="btn-ghost">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/55">Campaign</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/55">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/55">Revenue</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/55">Sent</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/55">Open Rate</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/55">Click Rate</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-white/55">Conversion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.topCampaigns.length > 0 ? (
                      analyticsData.topCampaigns.map((campaign) => (
                        <tr key={campaign.id} className="border-b border-white/10 hover:bg-white/[0.03]">
                          <td className="py-4 px-4 font-medium text-white">{campaign.name}</td>
                          <td className="py-4 px-4">
                            <span className="badge badge-muted">
                              {campaign.type === 'email' ? (
                                <Mail className="w-3.5 h-3.5" />
                              ) : (
                                <MessageSquare className="w-3.5 h-3.5" />
                              )}
                              {campaign.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-white font-medium">
                            ${campaign.revenue.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 text-white">{campaign.sent.toLocaleString()}</td>
                          <td className="py-4 px-4 text-white">
                            {campaign.openRate > 0 ? `${campaign.openRate}%` : '-'}
                          </td>
                          <td className="py-4 px-4 text-white">{campaign.clickRate}%</td>
                          <td className="py-4 px-4 text-white">{campaign.conversionRate}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 px-4 text-center text-white/60">
                          No campaign data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Email Tab */}
        {!loading && !error && analyticsData && activeTab === 'email' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.email.sent.toLocaleString()}</p>
                  <p className="text-sm text-white/55">Emails Sent</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.email.openRate}%</p>
                  <p className="text-sm text-white/55">Open Rate</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <MousePointer className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.email.clickRate}%</p>
                  <p className="text-sm text-white/55">Click Rate</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.email.conversionRate}%</p>
                  <p className="text-sm text-white/55">Conversion Rate</p>
                </div>
              </div>
            </div>

            <div className="card-premium p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Email Performance Over Time</h3>
              <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
                <div className="text-center">
                  <Mail className="w-12 h-12 text-white/35 mx-auto mb-4" />
                  <p className="text-white/60">Email performance chart</p>
                  <p className="text-sm text-white/45">Chart library integration needed</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* SMS Tab */}
        {!loading && !error && analyticsData && activeTab === 'sms' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.sms.sent.toLocaleString()}</p>
                  <p className="text-sm text-white/55">SMS Sent</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.sms.deliveryRate}%</p>
                  <p className="text-sm text-white/55">Delivery Rate</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <MousePointer className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.sms.clickRate}%</p>
                  <p className="text-sm text-white/55">Click Rate</p>
                </div>
              </div>

              <div className="card-premium p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-400">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    +0%
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white mb-1">{analyticsData.sms.conversionRate}%</p>
                  <p className="text-sm text-white/55">Conversion Rate</p>
                </div>
              </div>
            </div>

            <div className="card-premium p-6">
              <h3 className="text-xl font-semibold text-white mb-6">SMS Performance Over Time</h3>
              <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-white/35 mx-auto mb-4" />
                  <p className="text-white/60">SMS performance chart</p>
                  <p className="text-sm text-white/45">Chart library integration needed</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Automation Tab */}
        {activeTab === 'automation' && (
          <div className="card-premium p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Automation Performance</h3>
            <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-white/35 mx-auto mb-4" />
                <p className="text-white/60">Automation analytics coming soon</p>
                <p className="text-sm text-white/45">Track automation performance and ROI</p>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

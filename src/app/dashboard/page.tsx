'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Mail, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  RefreshCw,
  Store,
  AlertCircle,
  Loader2
} from 'lucide-react'

interface DashboardData {
  hasStore: boolean
  storeMetrics: {
    totalRevenue: string
    orderCount: string
    customerCount: string
    averageOrderValue: string
  } | null
  campaignStats: {
    emailCampaigns: number
    smsCampaigns: number
    totalSent: number
    totalRevenue: number
  }
  recentCampaigns: Array<{
    id: string
    name: string
    type: 'email' | 'sms'
    status: string
    sent: string
    opened: string
    clicked: string
    revenue: string
    date: string
  }>
  topAutomations: Array<{
    id: string
    name: string
    type: string
    status: string
    triggers: number
    revenue: string
  }>
  contactStats: {
    totalContacts: number
    emailConsent: number
    smsConsent: number
  }
}

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState('7d')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    fetchDashboardData()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data')
      }
      
      const data = await response.json()
      setDashboardData(data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
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
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[color:var(--accent-hi)] mx-auto mb-4" />
          <p className="text-white/60">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="card-premium w-full max-w-md p-10 text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-200 mb-6">{error}</p>
          <button onClick={fetchDashboardData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData?.hasStore) {
    // User is authenticated but no store connected
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-premium mb-2">Dashboard</h1>
            <p className="text-white/60">Welcome back! Connect your Shopify store to get started.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-premium text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>

            <button onClick={fetchDashboardData} className="btn-ghost" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </button>

            <button className="btn-ghost">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Connect Store */}
        <div className="card-premium relative overflow-hidden p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(700px circle at 10% 10%, rgba(4, 31, 26, 0.55), transparent 60%), radial-gradient(600px circle at 90% 0%, rgba(4, 31, 26, 0.25), transparent 55%)',
            }}
          />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="flex-1">
              <div className="badge badge-accent mb-4 w-fit">
                <Store className="h-3.5 w-3.5" />
                Shopify
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white">Connect your Shopify store</h2>
              <p className="mt-3 max-w-xl text-white/60">
                Unlock live revenue, order metrics, campaigns, and audience insights by connecting your Shopify store.
              </p>
              <div className="mt-6">
                <a href="/stores/connect" className="btn-primary">
                  <Store className="h-4 w-4" />
                  Connect Shopify Store
                </a>
              </div>
            </div>

            <div className="w-full lg:w-[22rem]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <div className="text-sm font-medium text-white">What you’ll get</div>
                <ul className="mt-3 space-y-2 text-sm text-white/60">
                  {[
                    'Live revenue, orders, and customers',
                    'Campaign delivery and engagement',
                    'Automation triggers and attribution',
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[color:var(--accent-hi)]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Total Revenue', value: '$0', hint: 'Connect store to see data', icon: DollarSign },
            { name: 'Email Campaigns', value: '0', hint: 'Create your first campaign', icon: Mail },
            { name: 'Messages Sent', value: '0', hint: 'Track delivery & clicks', icon: MessageSquare },
            { name: 'Active Contacts', value: '0', hint: 'Sync from Shopify', icon: Users },
          ].map((stat) => (
            <div key={stat.name} className="card-premium-hover p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-white/55">{stat.name}</p>
                  <p className="text-2xl font-semibold text-white mt-2">{stat.value}</p>
                </div>
                <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <stat.icon className="w-6 h-6 text-white/85" />
                </div>
              </div>
              <p className="mt-4 text-sm text-white/45">{stat.hint}</p>
            </div>
          ))}
        </div>

        {/* Revenue + Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
              <div className="flex items-center gap-2">
                <button className="btn-ghost text-sm">Email</button>
                <button className="btn-ghost text-sm">SMS</button>
                <button className="btn-ghost text-sm">All</button>
              </div>
            </div>
            <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-white/35 mx-auto mb-4" />
                <p className="text-white/60">Connect your Shopify store</p>
                <p className="text-sm text-white/45">to see revenue analytics</p>
              </div>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
            <div className="space-y-3">
              <a href="/campaigns/email/new" className="w-full btn-primary justify-start">
                <Plus className="w-4 h-4" />
                Create Email Campaign
              </a>
              <a href="/campaigns/sms/new" className="w-full btn-secondary justify-start">
                <Plus className="w-4 h-4" />
                Create SMS Campaign
              </a>
              <a href="/automations/create" className="w-full btn-ghost justify-start">
                <Plus className="w-4 h-4" />
                New Automation
              </a>
              <a href="/contacts" className="w-full btn-ghost justify-start">
                <Users className="w-4 h-4" />
                Import Contacts
              </a>
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Campaigns</h3>
            <button className="btn-ghost">View All</button>
          </div>
          <div className="text-center py-10">
            <Mail className="w-12 h-12 text-white/35 mx-auto mb-4" />
            <p className="text-white/60 mb-2">No campaigns yet</p>
            <p className="text-sm text-white/45">Create your first campaign to see it here</p>
          </div>
        </div>

        {/* Top Automations */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Top Performing Automations</h3>
            <button className="btn-ghost">Manage All</button>
          </div>
          <div className="text-center py-10">
            <TrendingUp className="w-12 h-12 text-white/35 mx-auto mb-4" />
            <p className="text-white/60 mb-2">No automations yet</p>
            <p className="text-sm text-white/45">Create your first automation to see it here</p>
          </div>
        </div>
      </div>
    )
  }

  // Generate stats from real data
  const stats = [
    {
      name: 'Total Revenue',
      value: dashboardData.storeMetrics?.totalRevenue || '$0',
      change: '+20.1%', // Would need historical data to calculate
      changeType: 'positive' as const,
      icon: DollarSign,
    },
    {
      name: 'Email Campaigns',
      value: dashboardData.campaignStats.emailCampaigns.toString(),
      change: `+${dashboardData.campaignStats.smsCampaigns}`,
      changeType: 'positive' as const,
      icon: Mail,
    },
    {
      name: 'Messages Sent',
      value: dashboardData.campaignStats.totalSent.toLocaleString(),
      change: '+180',
      changeType: 'positive' as const,
      icon: MessageSquare,
    },
    {
      name: 'Active Contacts',
      value: dashboardData.contactStats.totalContacts.toLocaleString(),
      change: `${dashboardData.contactStats.emailConsent} email`,
      changeType: 'positive' as const,
      icon: Users,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-premium mb-2">Dashboard</h1>
          <p className="text-white/60">Welcome back! Here&apos;s what&apos;s happening with your campaigns.</p>

          {dashboardData.storeMetrics && (
            <div className="mt-3">
              <span className="badge badge-success">
                <Store className="w-3.5 h-3.5" />
                Shopify connected
              </span>
            </div>
          )}

          {lastUpdated && (
            <div className="mt-2 text-xs text-white/45">Last updated: {lastUpdated.toLocaleTimeString()}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-premium text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <button onClick={fetchDashboardData} className="btn-ghost" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Refresh
          </button>

          <button className="btn-ghost">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card-premium-hover p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/55">{stat.name}</p>
                <p className="text-2xl font-semibold text-white mt-2">{stat.value}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
                <stat.icon className="w-6 h-6 text-white/85" />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <span className={stat.changeType === 'positive' ? 'badge badge-success' : 'badge badge-danger'}>
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {stat.change}
              </span>
              <span className="text-xs text-white/45">vs last period</span>
            </div>
          </div>
        ))}
      </div>

      {/* Shopify Store Metrics */}
      {dashboardData.storeMetrics && (
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Store className="w-5 h-5" />
              Shopify Store Metrics
            </h3>
            <span className="text-sm text-white/55">Live data from your store</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Store Revenue', value: dashboardData.storeMetrics.totalRevenue },
              { label: 'Total Orders', value: dashboardData.storeMetrics.orderCount },
              { label: 'Total Customers', value: dashboardData.storeMetrics.customerCount },
              { label: 'Avg Order Value', value: dashboardData.storeMetrics.averageOrderValue },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                <p className="text-sm text-white/55 mb-1">{item.label}</p>
                <p className="text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store connected but metrics unavailable */}
      {dashboardData.hasStore && !dashboardData.storeMetrics && (
        <div className="card-premium p-6 border-amber-400/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-300" />
              Shopify Data Unavailable
            </h3>
          </div>
          <p className="text-white/60 mb-4">
            Your Shopify store is connected, but we&apos;re having trouble fetching store metrics. This could be due to
            API rate limits or temporary connectivity issues.
          </p>
          <button onClick={fetchDashboardData} className="btn-secondary" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Retry Shopify Data
          </button>
        </div>
      )}

      {/* Revenue + Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Revenue Overview</h3>
            <div className="flex items-center gap-2">
              <button className="btn-ghost text-sm">Email</button>
              <button className="btn-ghost text-sm">SMS</button>
              <button className="btn-ghost text-sm">All</button>
            </div>
          </div>
          <div className="h-64 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-white/35 mx-auto mb-4" />
              <p className="text-white/60">Chart visualization would go here</p>
              <p className="text-sm text-white/45">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        <div className="card-premium p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/campaigns/email/new" className="w-full btn-primary justify-start">
              <Plus className="w-4 h-4" />
              Create Email Campaign
            </a>
            <a href="/campaigns/sms/new" className="w-full btn-secondary justify-start">
              <Plus className="w-4 h-4" />
              Create SMS Campaign
            </a>
            <a href="/automations/create" className="w-full btn-ghost justify-start">
              <Plus className="w-4 h-4" />
              New Automation
            </a>
            <a href="/contacts" className="w-full btn-ghost justify-start">
              <Users className="w-4 h-4" />
              Import Contacts
            </a>
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Recent Campaigns</h3>
          <button className="btn-ghost">View All</button>
        </div>

        {dashboardData.recentCampaigns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 font-medium text-white/55">Campaign</th>
                  <th className="text-left py-3 px-4 font-medium text-white/55">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-white/55">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-white/55">Sent</th>
                  <th className="text-left py-3 px-4 font-medium text-white/55">Opened</th>
                  <th className="text-left py-3 px-4 font-medium text-white/55">Clicked</th>
                  <th className="text-left py-3 px-4 font-medium text-white/55">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.recentCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/10 hover:bg-white/[0.03]">
                    <td className="py-4 px-4">
                      <div className="font-medium text-white">{campaign.name}</div>
                      <div className="text-xs text-white/45 mt-1">{campaign.date}</div>
                    </td>
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
                    <td className="py-4 px-4">
                      <span className={getStatusBadgeClass(campaign.status)}>{campaign.status}</span>
                    </td>
                    <td className="py-4 px-4 text-white/85">{campaign.sent}</td>
                    <td className="py-4 px-4 text-white/85">{campaign.opened}</td>
                    <td className="py-4 px-4 text-white/85">{campaign.clicked}</td>
                    <td className="py-4 px-4 text-white font-medium">{campaign.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <Mail className="w-12 h-12 text-white/35 mx-auto mb-4" />
            <p className="text-white/60 mb-2">No campaigns yet</p>
            <p className="text-sm text-white/45">Create your first campaign to see it here</p>
          </div>
        )}
      </div>

      {/* Top Automations */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Top Performing Automations</h3>
          <button className="btn-ghost">Manage All</button>
        </div>

        {dashboardData.topAutomations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dashboardData.topAutomations.map((automation) => (
              <div key={automation.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-white">{automation.name}</h4>
                  <span className={getStatusBadgeClass(automation.status)}>{automation.status}</span>
                </div>
                <p className="text-sm text-white/60 mb-5">{automation.type}</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-white/55">Triggers</p>
                    <p className="text-lg font-semibold text-white">{automation.triggers}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white/55">Revenue</p>
                    <p className="text-lg font-semibold text-white">{automation.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <TrendingUp className="w-12 h-12 text-white/35 mx-auto mb-4" />
            <p className="text-white/60 mb-2">No automations yet</p>
            <p className="text-sm text-white/45">Create your first automation to see it here</p>
          </div>
        )}
      </div>
    </div>
  )
}

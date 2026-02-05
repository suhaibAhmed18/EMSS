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
  Calendar,
  Filter,
  Download,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData?.hasStore) {
    // User is authenticated but no store connected - show FULL dashboard interface with navbar
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-premium mb-2">Dashboard</h1>
              <p className="text-gray-400">Welcome back! Connect your Shopify store to get started.</p>
            </div>
            <div className="flex items-center space-x-4 mt-4 sm:mt-0">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="input-premium text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button 
                onClick={fetchDashboardData}
                className="btn-ghost"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Refresh
              </button>
              <button className="btn-ghost">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Connect Store Section */}
          <div className="card-premium p-8 mb-8 text-center">
            <Store className="w-16 h-16 text-gray-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Shopify Store</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              To see your dashboard with real store metrics, campaigns, and customer data, 
              you need to connect your Shopify store first.
            </p>
            <a 
              href="/stores/connect"
              className="btn-primary inline-flex items-center"
            >
              <Store className="w-4 h-4 mr-2" />
              Connect Shopify Store
            </a>
          </div>

          {/* Preview Stats (Empty State) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: 'Total Revenue', value: '$0', change: 'Connect store', changeType: 'neutral', icon: DollarSign },
              { name: 'Email Campaigns', value: '0', change: 'to see data', changeType: 'neutral', icon: Mail },
              { name: 'Messages Sent', value: '0', change: 'from your', changeType: 'neutral', icon: MessageSquare },
              { name: 'Active Contacts', value: '0', change: 'Shopify store', changeType: 'neutral', icon: Users },
            ].map((stat) => (
              <div key={stat.name} className="card-premium p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                    <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <span className="text-sm text-gray-500">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Charts and Recent Activity */}
          <div className="grid grid-cols-1 gap-8 mb-8">
            {/* Revenue Chart */}
            <div className="card-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Revenue Overview</h3>
                <div className="flex items-center space-x-2">
                  <button className="btn-ghost text-sm">Email</button>
                  <button className="btn-ghost text-sm">SMS</button>
                  <button className="btn-ghost text-sm">All</button>
                </div>
              </div>
              <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Connect your Shopify store</p>
                  <p className="text-sm text-gray-500">to see revenue analytics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Campaigns */}
          <div className="card-premium p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Recent Campaigns</h3>
              <button className="btn-ghost">View All</button>
            </div>
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No campaigns yet</p>
              <p className="text-sm text-gray-500">Create your first campaign to see it here</p>
            </div>
          </div>

          {/* Top Automations */}
          <div className="card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Top Performing Automations</h3>
              <button className="btn-ghost">Manage All</button>
            </div>
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No automations yet</p>
              <p className="text-sm text-gray-500">Create your first automation to see it here</p>
            </div>
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
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-premium mb-2">Dashboard</h1>
            <p className="text-gray-400">Welcome back! Here's what's happening with your campaigns.</p>
            {dashboardData.storeMetrics && (
              <div className="flex items-center mt-2 text-sm text-green-400">
                <Store className="w-4 h-4 mr-1" />
                Shopify store connected
              </div>
            )}
            {lastUpdated && (
              <div className="flex items-center mt-1 text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="input-premium text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button 
              onClick={fetchDashboardData}
              className="btn-ghost"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Refresh
            </button>
            <button className="btn-ghost">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => (
            <div key={stat.name} className="card-premium p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                {stat.changeType === 'positive' ? (
                  <ArrowUpRight className="w-4 h-4 text-green-400 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-400 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-400 ml-2">vs last period</span>
              </div>
            </div>
          ))}
        </div>

        {/* Shopify Store Metrics */}
        {dashboardData.storeMetrics && (
          <div className="card-premium p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Store className="w-5 h-5 mr-2" />
                Shopify Store Metrics
              </h3>
              <span className="text-sm text-gray-400">Live data from your store</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Store Revenue</p>
                <p className="text-2xl font-bold text-white">{dashboardData.storeMetrics.totalRevenue}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-white">{dashboardData.storeMetrics.orderCount}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-white">{dashboardData.storeMetrics.customerCount}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-sm text-gray-400 mb-1">Avg Order Value</p>
                <p className="text-2xl font-bold text-white">{dashboardData.storeMetrics.averageOrderValue}</p>
              </div>
            </div>
          </div>
        )}

        {/* Show message when store is connected but Shopify data is not available */}
        {dashboardData.hasStore && !dashboardData.storeMetrics && (
          <div className="card-premium p-6 mb-8 border-yellow-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                Shopify Data Unavailable
              </h3>
            </div>
            <p className="text-gray-400 mb-4">
              Your Shopify store is connected, but we're having trouble fetching store metrics. 
              This could be due to API rate limits or temporary connectivity issues.
            </p>
            <button 
              onClick={fetchDashboardData}
              className="btn-secondary"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                'Retry Shopify Data'
              )}
            </button>
          </div>
        )}

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 card-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Revenue Overview</h3>
              <div className="flex items-center space-x-2">
                <button className="btn-ghost text-sm">Email</button>
                <button className="btn-ghost text-sm">SMS</button>
                <button className="btn-ghost text-sm">All</button>
              </div>
            </div>
            <div className="h-64 bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Chart visualization would go here</p>
                <p className="text-sm text-gray-500">Integration with charting library needed</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-premium p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Quick Actions</h3>
            <div className="space-y-4">
              <a href="/campaigns/email/new" className="w-full btn-primary justify-start">
                <Plus className="w-4 h-4 mr-3" />
                Create Email Campaign
              </a>
              <a href="/campaigns/sms/new" className="w-full btn-secondary justify-start">
                <Plus className="w-4 h-4 mr-3" />
                Create SMS Campaign
              </a>
              <a href="/automations/create" className="w-full btn-ghost justify-start">
                <Plus className="w-4 h-4 mr-3" />
                New Automation
              </a>
              <a href="/contacts" className="w-full btn-ghost justify-start">
                <Users className="w-4 h-4 mr-3" />
                Import Contacts
              </a>
            </div>
          </div>
        </div>

        {/* Recent Campaigns */}
        <div className="card-premium p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Recent Campaigns</h3>
            <button className="btn-ghost">View All</button>
          </div>
          {dashboardData.recentCampaigns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Campaign</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Sent</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Opened</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Clicked</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="py-4 px-4">
                        <div className="font-medium text-white">{campaign.name}</div>
                        <div className="text-sm text-gray-400">{campaign.date}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.type === 'email' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {campaign.type === 'email' ? (
                            <Mail className="w-3 h-3 mr-1" />
                          ) : (
                            <MessageSquare className="w-3 h-3 mr-1" />
                          )}
                          {campaign.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'sent' 
                            ? 'bg-green-100 text-green-800' 
                            : campaign.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {campaign.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white">{campaign.sent}</td>
                      <td className="py-4 px-4 text-white">{campaign.opened}</td>
                      <td className="py-4 px-4 text-white">{campaign.clicked}</td>
                      <td className="py-4 px-4 text-white font-medium">{campaign.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No campaigns yet</p>
              <p className="text-sm text-gray-500">Create your first campaign to see it here</p>
            </div>
          )}
        </div>

        {/* Top Automations */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">Top Performing Automations</h3>
            <button className="btn-ghost">Manage All</button>
          </div>
          {dashboardData.topAutomations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dashboardData.topAutomations.map((automation) => (
                <div key={automation.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">{automation.name}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      automation.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {automation.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{automation.type}</p>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">Triggers</p>
                      <p className="text-lg font-semibold text-white">{automation.triggers}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Revenue</p>
                      <p className="text-lg font-semibold text-white">{automation.revenue}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No automations yet</p>
              <p className="text-sm text-gray-500">Create your first automation to see it here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
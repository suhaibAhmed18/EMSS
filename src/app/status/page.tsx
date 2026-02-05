import Link from 'next/link'
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-black">
              Marketing Platform Pro
            </Link>
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-black transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">System Status</h1>
          <p className="text-xl text-gray-600">
            Current status of Marketing Platform Pro services
          </p>
        </div>

        {/* Overall Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-green-800">All Systems Operational</h2>
              <p className="text-green-700">All services are running normally</p>
            </div>
          </div>
        </div>

        {/* Service Status */}
        <div className="space-y-4 mb-12">
          <h2 className="text-2xl font-semibold text-black mb-6">Service Status</h2>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-black">Email Delivery</h3>
                  <p className="text-sm text-gray-600">Email campaigns and transactional emails</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-black">SMS Delivery</h3>
                  <p className="text-sm text-gray-600">SMS campaigns and notifications</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-black">Web Application</h3>
                  <p className="text-sm text-gray-600">Dashboard and campaign management</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-black">API Services</h3>
                  <p className="text-sm text-gray-600">REST API and webhooks</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-black">Shopify Integration</h3>
                  <p className="text-sm text-gray-600">Store connections and data sync</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                <div>
                  <h3 className="font-semibold text-black">Analytics & Reporting</h3>
                  <p className="text-sm text-gray-600">Campaign analytics and performance data</p>
                </div>
              </div>
              <span className="text-sm font-medium text-green-600">Operational</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-black mb-6">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-sm text-gray-600">Uptime (30 days)</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">245ms</div>
              <div className="text-sm text-gray-600">Avg Response Time</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">99.8%</div>
              <div className="text-sm text-gray-600">Email Delivery Rate</div>
            </div>
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-black mb-6">Recent Incidents</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No recent incidents</p>
              <p className="text-sm">All systems have been running smoothly</p>
            </div>
          </div>
        </div>

        {/* Maintenance Schedule */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-black mb-6">Scheduled Maintenance</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">No scheduled maintenance</p>
              <p className="text-sm">We'll notify you in advance of any planned maintenance</p>
            </div>
          </div>
        </div>

        {/* Subscribe to Updates */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-black mb-4">
            Stay Updated
          </h2>
          <p className="text-gray-600 mb-6">
            Subscribe to receive notifications about service status and maintenance
          </p>
          <div className="max-w-md mx-auto flex gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
            <button className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
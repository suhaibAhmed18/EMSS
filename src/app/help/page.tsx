import Link from 'next/link'
import { ArrowLeft, Search, Mail, MessageCircle, Book, Video } from 'lucide-react'

export default function HelpPage() {
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Help Center</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to your questions and get the most out of Marketing Platform Pro
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            />
          </div>
        </div>

        {/* Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Email Marketing</h3>
            <p className="text-gray-600 mb-4">
              Learn how to create, send, and optimize your email campaigns
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-black">Creating your first campaign</Link></li>
              <li><Link href="#" className="hover:text-black">Email templates and design</Link></li>
              <li><Link href="#" className="hover:text-black">Segmentation and targeting</Link></li>
              <li><Link href="#" className="hover:text-black">Deliverability best practices</Link></li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">SMS Marketing</h3>
            <p className="text-gray-600 mb-4">
              Get started with SMS campaigns and automation
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-black">SMS compliance and regulations</Link></li>
              <li><Link href="#" className="hover:text-black">Creating SMS campaigns</Link></li>
              <li><Link href="#" className="hover:text-black">SMS automation workflows</Link></li>
              <li><Link href="#" className="hover:text-black">Opt-in and opt-out management</Link></li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Book className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Getting Started</h3>
            <p className="text-gray-600 mb-4">
              New to the platform? Start here for setup guides
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-black">Account setup and onboarding</Link></li>
              <li><Link href="#" className="hover:text-black">Connecting your Shopify store</Link></li>
              <li><Link href="#" className="hover:text-black">Importing your contacts</Link></li>
              <li><Link href="#" className="hover:text-black">Platform overview and navigation</Link></li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Video className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Video Tutorials</h3>
            <p className="text-gray-600 mb-4">
              Watch step-by-step video guides and tutorials
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-black">Platform walkthrough</Link></li>
              <li><Link href="#" className="hover:text-black">Creating your first campaign</Link></li>
              <li><Link href="#" className="hover:text-black">Setting up automations</Link></li>
              <li><Link href="#" className="hover:text-black">Analytics and reporting</Link></li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">Troubleshooting</h3>
            <p className="text-gray-600 mb-4">
              Common issues and how to resolve them
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-black">Email delivery issues</Link></li>
              <li><Link href="#" className="hover:text-black">Integration problems</Link></li>
              <li><Link href="#" className="hover:text-black">Account and billing issues</Link></li>
              <li><Link href="#" className="hover:text-black">Performance optimization</Link></li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <MessageCircle className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-black mb-3">API & Integrations</h3>
            <p className="text-gray-600 mb-4">
              Developer resources and integration guides
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="#" className="hover:text-black">API documentation</Link></li>
              <li><Link href="#" className="hover:text-black">Webhook setup</Link></li>
              <li><Link href="#" className="hover:text-black">Third-party integrations</Link></li>
              <li><Link href="#" className="hover:text-black">Custom development</Link></li>
            </ul>
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-black mb-4">
            Still need help?
          </h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you succeed with your marketing campaigns
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              href="#"
              className="border border-gray-300 text-black px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Schedule a Call
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
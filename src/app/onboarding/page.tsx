'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth/session'

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
}

export default function OnboardingPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [shopDomain, setShopDomain] = useState('')
  const [connectingShop, setConnectingShop] = useState(false)
  const [error, setError] = useState('')

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Shopify Marketing Platform',
      description: 'Let&apos;s get you set up with everything you need to start marketing to your customers.',
      completed: false
    },
    {
      id: 'connect-shopify',
      title: 'Connect Your Shopify Store',
      description: 'Connect your Shopify store to sync customer data and enable automated marketing.',
      completed: false
    },
    {
      id: 'setup-complete',
      title: 'Setup Complete',
      description: 'You&apos;re all set! Let&apos;s start building your first marketing campaign.',
      completed: false
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const handleConnectShopify = async () => {
    if (!shopDomain.trim()) {
      setError('Please enter your shop domain')
      return
    }

    setConnectingShop(true)
    setError('')

    try {
      // Clean up the shop domain (remove .myshopify.com if present)
      const cleanDomain = shopDomain.replace('.myshopify.com', '').trim()
      
      // Call the OAuth initiation endpoint
      const response = await fetch('/api/auth/shopify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shop: cleanDomain }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to connect to Shopify')
      }

      const { authUrl } = await response.json()
      
      // Redirect to Shopify OAuth
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Shopify')
      setConnectingShop(false)
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      router.push('/dashboard')
    }
  }

  const handleSkip = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    index <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {index < currentStep ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-full h-1 mx-4 ${
                      index < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {currentStep === 0 && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {steps[0].title}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {steps[0].description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Automated Marketing
                  </h3>
                  <p className="text-gray-600">
                    Create workflows that automatically engage customers based on their behavior
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Email & SMS
                  </h3>
                  <p className="text-gray-600">
                    Send professional campaigns through multiple channels with custom domains
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Analytics & Insights
                  </h3>
                  <p className="text-gray-600">
                    Track performance and revenue attribution with detailed analytics
                  </p>
                </div>
              </div>
              <button
                onClick={handleNext}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Get Started
              </button>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {steps[1].title}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {steps[1].description}
              </p>

              {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div className="max-w-md">
                <label htmlFor="shopDomain" className="block text-sm font-medium text-gray-700 mb-2">
                  Shop Domain
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="shopDomain"
                    placeholder="your-shop-name"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                    .myshopify.com
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Enter your Shopify store&apos;s domain name (without .myshopify.com)
                </p>
              </div>

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={handleConnectShopify}
                  disabled={connectingShop}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {connectingShop ? 'Connecting...' : 'Connect Shopify Store'}
                </button>
                <button
                  onClick={handleSkip}
                  className="text-gray-600 px-6 py-3 rounded-lg font-medium hover:text-gray-800 focus:outline-none"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {steps[2].title}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {steps[2].description}
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
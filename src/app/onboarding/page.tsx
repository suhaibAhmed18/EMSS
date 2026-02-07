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
  const { loading } = useRequireAuth()
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
      <div className="animate-pulse max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-64 rounded-xl bg-white/[0.06]" />
        <div className="h-96 rounded-2xl border border-white/10 bg-white/[0.03]" />
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Progress bar */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-1 items-center">
              <div
                className={`flex items-center justify-center w-9 h-9 rounded-full border ${
                  index <= currentStep
                    ? 'border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shadow-[0_18px_40px_rgba(0,0,0,0.5)]'
                    : 'border-white/10 bg-white/[0.02] text-white/40'
                }`}
                aria-current={index === currentStep ? 'step' : undefined}
              >
                {index < currentStep ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`mx-4 h-1 flex-1 rounded-full ${
                    index < currentStep ? 'bg-[color:var(--accent-hi)] opacity-60' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="card-premium p-8">
        {currentStep === 0 && (
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-white mb-4">{steps[0].title}</h1>
            <p className="text-white/60 mb-8">{steps[0].description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] flex items-center justify-center mx-auto mb-4 text-white">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Automated Marketing</h3>
                <p className="text-white/60">
                  Create workflows that automatically engage customers based on their behavior
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] flex items-center justify-center mx-auto mb-4 text-white">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Email & SMS</h3>
                <p className="text-white/60">
                  Send professional campaigns through multiple channels with custom domains
                </p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] flex items-center justify-center mx-auto mb-4 text-white">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Analytics & Insights</h3>
                <p className="text-white/60">
                  Track performance and revenue attribution with detailed analytics
                </p>
              </div>
            </div>
            <button onClick={handleNext} className="btn-primary">
              Get Started
            </button>
          </div>
        )}

        {currentStep === 1 && (
          <div>
            <h1 className="text-3xl font-semibold text-white mb-4">{steps[1].title}</h1>
            <p className="text-white/60 mb-8">{steps[1].description}</p>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
                <div className="text-sm text-red-100">{error}</div>
              </div>
            )}

            <div className="max-w-md">
              <label htmlFor="shopDomain" className="block text-sm font-medium text-white/70 mb-2">
                Shop Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="shopDomain"
                  placeholder="your-shop-name"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  className="input-premium w-full pr-32"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 text-sm">
                  .myshopify.com
                </div>
              </div>
              <p className="mt-2 text-sm text-white/50">
                Enter your Shopify store&apos;s domain name (without .myshopify.com)
              </p>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleConnectShopify}
                disabled={connectingShop}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {connectingShop ? 'Connecting...' : 'Connect Shopify Store'}
              </button>
              <button onClick={handleSkip} className="btn-ghost justify-center">
                Skip for now
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="text-center">
            <div className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-semibold text-white mb-4">{steps[2].title}</h1>
            <p className="text-white/60 mb-8">{steps[2].description}</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

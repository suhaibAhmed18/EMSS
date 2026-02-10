'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, CreditCard } from 'lucide-react'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billing_period: string
  features: {
    sms_credits: number | string
    email_credits: number | string
    contacts: number | string
    automations: number | string
  }
}

export default function BillingPlansPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = async (planId: string, paymentMethod: 'stripe' | 'paypal') => {
    try {
      setProcessing(true)
      setSelectedPlan(planId)

      const response = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          paymentMethod,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()

      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setProcessing(false)
      setSelectedPlan(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-premium mb-4">Choose Your Plan</h1>
          <p className="text-xl text-white/60">
            Select the perfect plan for your business needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="card-premium p-8 hover:scale-105 transition-transform duration-300"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-white/60 mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-premium">
                    ${plan.price}
                  </span>
                  <span className="text-white/60">/month</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[color:var(--accent-hi)]" />
                  <span className="text-white/80">
                    {plan.features.sms_credits} SMS credits
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[color:var(--accent-hi)]" />
                  <span className="text-white/80">
                    {plan.features.email_credits} Email credits
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[color:var(--accent-hi)]" />
                  <span className="text-white/80">
                    {plan.features.contacts} Contacts
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[color:var(--accent-hi)]" />
                  <span className="text-white/80">
                    {plan.features.automations} Automations
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-[color:var(--accent-hi)]" />
                  <span className="text-white/80">
                    Dedicated Telnyx Phone Number
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleSelectPlan(plan.id, 'stripe')}
                  disabled={processing && selectedPlan === plan.id}
                  className="w-full btn-primary"
                >
                  {processing && selectedPlan === plan.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Pay with Card
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => handleSelectPlan(plan.id, 'paypal')}
                  disabled={processing}
                  className="w-full btn-secondary"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Pay with PayPal
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="card-premium p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            All plans include:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white/70">
            <div>
              <Zap className="w-8 h-8 mx-auto mb-2 text-[color:var(--accent-hi)]" />
              <p>Dedicated Telnyx Number</p>
            </div>
            <div>
              <Check className="w-8 h-8 mx-auto mb-2 text-[color:var(--accent-hi)]" />
              <p>24/7 Customer Support</p>
            </div>
            <div>
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-[color:var(--accent-hi)]" />
              <p>Secure Payment Processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

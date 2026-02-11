'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  Check,
  ShoppingBag,
  Sparkles,
  Zap,
  Shield,
  MessageSquare,
  Loader2,
} from 'lucide-react'
import { SUBSCRIPTION_PLANS, formatFeatureValue, type SubscriptionPlan } from '@/lib/pricing/plans'

export default function PricingPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      if (response.ok) {
        const data = await response.json()
        if (data.plans && data.plans.length > 0) {
          // Map database plans to UI format
          const mappedPlans = data.plans.map((plan: any) => ({
            id: plan.name.toLowerCase(),
            name: plan.name,
            price: parseFloat(plan.price),
            description: plan.description,
            currency: plan.currency || 'USD',
            billing_period: plan.billing_period || 'monthly',
            features: plan.features,
            popular: plan.name === 'Professional',
          }))
          setPlans(mappedPlans)
        }
      }
    } catch (error) {
      console.error('Failed to load plans:', error)
      // Use default plans if API fails
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    // Redirect to registration with selected plan
    router.push(`/auth/register?plan=${planId}`)
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-[-120px] h-[520px] w-[520px] rounded-full bg-[rgba(4,31,26,0.55)] blur-3xl animate-float-slower" />
          <div className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-[rgba(255,255,255,0.10)] blur-3xl animate-float-slow" />
        </div>
        <div className="relative z-10">
          <Loader2 className="h-12 w-12 animate-spin text-white/60" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-[-120px] h-[520px] w-[520px] rounded-full bg-[rgba(4,31,26,0.55)] blur-3xl animate-float-slower" />
        <div className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-[rgba(255,255,255,0.10)] blur-3xl animate-float-slow" />
        <div className="absolute bottom-[-260px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[rgba(4,31,26,0.35)] blur-3xl animate-glow-pulse" />
      </div>

      <header className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">
                MarketingPro
              </div>
              <div className="text-xs text-white/55">
                Premium email & SMS for Shopify
              </div>
            </div>
          </Link>

          <Link href="/auth/login" className="btn-secondary">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/75 mb-6">
            <Sparkles className="h-4 w-4 text-[color:var(--accent-hi)]" />
            Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-premium mb-4">
            Choose Your Plan
          </h1>
          <p className="text-white/65 text-lg max-w-2xl mx-auto">
            Start with the plan that fits your business. All plans include Telnyx phone number for SMS campaigns.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative ${
                plan.popular ? 'md:-mt-4 md:mb-4' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-hi)]/30 bg-[color:var(--accent-hi)]/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <div className={`relative rounded-3xl p-[1px] h-full ${
                plan.popular
                  ? 'bg-[linear-gradient(135deg,rgba(255,255,255,0.25),rgba(4,31,26,0.75),rgba(255,255,255,0.15))] animate-gradient-shift'
                  : 'bg-[linear-gradient(135deg,rgba(255,255,255,0.12),rgba(4,31,26,0.75),rgba(255,255,255,0.06))]'
              }`}>
                <div className={`rounded-3xl border h-full ${
                  plan.popular ? 'border-white/20' : 'border-white/10'
                } bg-white/[0.03] p-8 shadow-3xl backdrop-blur-xl`}>
                  <div className="mb-6">
                    <h3 className="text-2xl font-semibold text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-white/60 text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-white/50 text-sm">/month</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full mb-6 ${
                      plan.popular ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[color:var(--accent-hi)] flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">
                        {formatFeatureValue(plan.features.contacts)} contacts
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[color:var(--accent-hi)] flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">
                        {formatFeatureValue(plan.features.email_credits)} emails/month
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[color:var(--accent-hi)] flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">
                        {formatFeatureValue(plan.features.sms_credits)} SMS/month
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[color:var(--accent-hi)] flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">
                        {formatFeatureValue(plan.features.automations)} automation workflows
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[color:var(--accent-hi)] flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">
                        Telnyx phone number included
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-[color:var(--accent-hi)] flex-shrink-0 mt-0.5" />
                      <span className="text-white/70 text-sm">
                        {plan.name === 'Enterprise' ? '24/7 priority support' : 'Email support'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          {[
            {
              icon: Zap,
              title: 'Instant Setup',
              description: 'Get your Telnyx number and start sending within minutes',
            },
            {
              icon: Shield,
              title: 'Secure Payments',
              description: 'Visa, Mastercard, and PayPal accepted',
            },
            {
              icon: MessageSquare,
              title: 'SMS Ready',
              description: 'Working phone number included with every plan',
            },
          ].map((item) => (
            <div key={item.title} className="card-premium p-6 text-center">
              <div className="inline-grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80 mb-4">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-white/60 text-sm">{item.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

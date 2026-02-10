'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CreditCard,
  Loader2,
  Lock,
  ShoppingBag,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState('')
  const [userId, setUserId] = useState('')
  const [planPrice, setPlanPrice] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>('stripe')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showCancelledMessage, setShowCancelledMessage] = useState(false)

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const planParam = searchParams.get('plan')
    const userIdParam = searchParams.get('userId')
    const cancelled = searchParams.get('cancelled')

    if (!emailParam || !planParam || !userIdParam) {
      router.push('/pricing')
      return
    }

    setEmail(emailParam)
    setPlan(planParam)
    setUserId(userIdParam)
    setShowCancelledMessage(cancelled === 'true')

    const prices: Record<string, number> = {
      starter: 10,
      professional: 20,
      enterprise: 30,
    }
    setPlanPrice(prices[planParam] || 0)
  }, [searchParams, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (paymentMethod === 'stripe') {
        // Create Stripe Checkout Session
        const response = await fetch('/api/payments/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            email,
            plan,
            amount: planPrice,
          }),
        })

        const data = await response.json()

        if (response.ok && data.url) {
          // Redirect to Stripe Checkout
          window.location.href = data.url
        } else {
          setError(data.error || 'Failed to create checkout session')
          setLoading(false)
        }
      } else if (paymentMethod === 'paypal') {
        // PayPal integration would go here
        setError('PayPal integration coming soon. Please use card payment.')
        setLoading(false)
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-[-120px] h-[520px] w-[520px] rounded-full bg-[rgba(4,31,26,0.55)] blur-3xl animate-float-slower" />
          <div className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-[rgba(255,255,255,0.10)] blur-3xl animate-float-slow" />
        </div>

        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="card-premium p-8 text-center">
            <div className="inline-grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 mb-6">
              <CheckCircle className="h-8 w-8 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">
              Payment Successful!
            </h2>
            <p className="text-white/60 mb-4">
              Processing your registration...
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-white/60 mx-auto" />
          </div>
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
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Complete Your Payment
          </h1>
          <p className="text-white/60">
            Secure payment for {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
          </p>
        </div>

        {showCancelledMessage && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-100 text-sm font-medium mb-1">
                    Payment Cancelled
                  </p>
                  <p className="text-yellow-100/80 text-xs">
                    Your payment was cancelled. You can try again below to complete your subscription.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-5 xl:grid-cols-3">
          <div className="lg:col-span-3 xl:col-span-2">
            <div className="card-premium p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-4">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-4 rounded-2xl border transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-[color:var(--accent-hi)] bg-[color:var(--accent-hi)]/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 text-white/80 mb-2" />
                      <div className="text-sm font-medium text-white">Stripe</div>
                      <div className="text-xs text-white/50">Secure payment</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-4 rounded-2xl border transition-all ${
                        paymentMethod === 'paypal'
                          ? 'border-[color:var(--accent-hi)] bg-[color:var(--accent-hi)]/10'
                          : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                      }`}
                    >
                      <div className="h-6 w-6 text-white/80 mb-2 font-bold text-lg">P</div>
                      <div className="text-sm font-medium text-white">PayPal</div>
                      <div className="text-xs text-white/50">Coming soon</div>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'stripe' && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-center">
                    <p className="text-white/60 text-sm mb-4">
                      You will be redirected to Stripe's secure checkout page to complete your payment.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-white/50">
                      <Lock className="h-4 w-4" />
                      <span>Powered by Stripe - Industry-leading security</span>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-300 flex-shrink-0 mt-0.5" />
                    <p className="text-red-100 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-white/50">
                  <Lock className="h-4 w-4" />
                  <span>Your payment information is secure and encrypted</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    `Continue to Payment`
                  )}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 xl:col-span-1">
            <div className="card-premium p-6 space-y-4 lg:sticky lg:top-8">
              <h3 className="text-lg font-semibold text-white">Order Summary</h3>
              
              <div className="space-y-3 py-4 border-y border-white/10">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Plan</span>
                  <span className="text-white font-medium">
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Billing</span>
                  <span className="text-white">Monthly</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Email</span>
                  <span className="text-white text-xs break-all">{email}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-2">
                <span className="text-white/60">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">${planPrice}</div>
                  <div className="text-xs text-white/50">per month</div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 mt-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-100/80">
                    Includes Telnyx phone number for SMS campaigns
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/60" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  )
}

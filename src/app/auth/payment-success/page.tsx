'use client'

import { useEffect, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  Mail,
  ShoppingBag,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const sessionId = searchParams.get('session_id') || ''
  const [verifying, setVerifying] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Verify the payment session
    const verifyPayment = async () => {
      if (!sessionId) {
        setVerifying(false)
        return
      }

      try {
        const response = await fetch('/api/payments/verify-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Payment verification failed')
        }
      } catch (err) {
        setError('Failed to verify payment')
      } finally {
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [sessionId])

  if (verifying) {
    return (
      <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-[-120px] h-[520px] w-[520px] rounded-full bg-[rgba(4,31,26,0.55)] blur-3xl animate-float-slower" />
          <div className="absolute top-24 right-[-140px] h-[520px] w-[520px] rounded-full bg-[rgba(255,255,255,0.10)] blur-3xl animate-float-slow" />
        </div>

        <div className="relative z-10 max-w-md w-full mx-4">
          <div className="card-premium p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-white/60 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Verifying Payment...
            </h2>
            <p className="text-white/60 text-sm">
              Please wait while we confirm your payment
            </p>
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
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 pb-16 pt-20">
        {error ? (
          <div className="text-center mb-8">
            <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-red-500/20 border border-red-400/30 mb-6">
              <AlertCircle className="h-10 w-10 text-red-300" />
            </div>
            <h1 className="text-4xl font-semibold text-white mb-4">
              Payment Verification Failed
            </h1>
            <p className="text-white/65 text-lg mb-6">
              {error}
            </p>
            <Link href="/pricing" className="btn-primary inline-flex items-center gap-2">
              Return to Pricing
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-emerald-500/20 border border-emerald-400/30 mb-6">
                <CheckCircle className="h-10 w-10 text-emerald-300" />
              </div>
              <h1 className="text-4xl font-semibold text-white mb-4">
                Payment Successful!
              </h1>
              <p className="text-white/65 text-lg">
                Your account has been created and payment processed successfully.
              </p>
            </div>

        <div className="space-y-4">
          <div className="card-premium p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] flex-shrink-0">
                <Mail className="h-6 w-6 text-white/80" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Verify Your Email
                </h2>
                <p className="text-white/60 text-sm leading-relaxed">
                  We've sent a verification email to <span className="text-white font-medium">{email}</span>.
                  Please check your inbox and click the verification link to activate your account.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70">
                  Payment processed successfully
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70">
                  Account created and ready
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70">
                  Telnyx phone number will be assigned after verification
                </div>
              </div>
            </div>
          </div>

          <div className="card-premium p-6">
            <h3 className="text-sm font-semibold text-white mb-3">
              What happens next?
            </h3>
            <ol className="space-y-3 text-sm text-white/60">
              <li className="flex gap-3">
                <span className="text-[color:var(--accent-hi)] font-semibold">1.</span>
                <span>Check your email inbox for the verification link</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[color:var(--accent-hi)] font-semibold">2.</span>
                <span>Click the link to verify your email address</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[color:var(--accent-hi)] font-semibold">3.</span>
                <span>Sign in to your account</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[color:var(--accent-hi)] font-semibold">4.</span>
                <span>Your Telnyx phone number will be automatically assigned</span>
              </li>
              <li className="flex gap-3">
                <span className="text-[color:var(--accent-hi)] font-semibold">5.</span>
                <span>Start sending SMS campaigns immediately!</span>
              </li>
            </ol>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
            <p className="text-xs text-white/55">
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={async () => {
                  try {
                    await fetch('/api/auth/resend-verification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ email })
                    })
                    alert('Verification email has been resent. Please check your inbox.')
                  } catch (err) {
                    alert('Failed to resend verification email')
                  }
                }}
                className="text-[color:var(--accent-hi)] hover:text-white transition-colors underline"
              >
                resend verification email
              </button>
            </p>
          </div>

          <Link href="/auth/login" className="w-full btn-primary block text-center">
            Go to Sign In
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        </>
        )}
      </main>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  )
}

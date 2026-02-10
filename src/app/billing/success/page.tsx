'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Phone, ArrowRight } from 'lucide-react'

function BillingSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (sessionId) {
      // Give the webhook time to process
      setTimeout(() => {
        checkSubscriptionStatus()
      }, 3000)
    } else {
      setLoading(false)
    }
  }, [searchParams])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const data = await response.json()
        if (data.user?.telnyx_phone_number) {
          setPhoneNumber(data.user.telnyx_phone_number)
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="card-premium p-12 text-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Setting up your account...
              </h2>
              <p className="text-white/60">
                We're provisioning your dedicated phone number and activating your subscription.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="w-20 h-20 text-[color:var(--accent-hi)] mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-premium mb-4">
                Payment Successful!
              </h1>
              <p className="text-xl text-white/70 mb-8">
                Your subscription is now active
              </p>

              {phoneNumber && (
                <div className="card-premium p-6 mb-8 bg-white/[0.05]">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Phone className="w-6 h-6 text-[color:var(--accent-hi)]" />
                    <h3 className="text-lg font-semibold text-white">
                      Your Dedicated Phone Number
                    </h3>
                  </div>
                  <p className="text-3xl font-bold text-premium">
                    {phoneNumber}
                  </p>
                </div>
              )}

              <div className="space-y-4 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[color:var(--accent-hi)] mt-1" />
                  <div>
                    <p className="text-white font-medium">Subscription Activated</p>
                    <p className="text-white/60 text-sm">Your plan is now active and ready to use</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[color:var(--accent-hi)] mt-1" />
                  <div>
                    <p className="text-white font-medium">Phone Number Assigned</p>
                    <p className="text-white/60 text-sm">Your dedicated Telnyx number is ready for SMS campaigns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[color:var(--accent-hi)] mt-1" />
                  <div>
                    <p className="text-white font-medium">Full Access Granted</p>
                    <p className="text-white/60 text-sm">All features are now available in your dashboard</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <BillingSuccessContent />
    </Suspense>
  )
}

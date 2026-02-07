'use client'

import { useState, Suspense } from 'react'
import { useSession } from '@/lib/auth/session'
import Link from 'next/link'
import { ArrowLeft, Store, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

function getShopifyConnectErrorMessage(errorParam: string | null, detailsParam: string | null) {
  if (!errorParam) return ''

  switch (errorParam) {
    case 'auth_failed':
      return detailsParam
        ? `Authentication failed: ${detailsParam}`
        : 'Authentication failed. Please try again.'
    case 'connection_failed':
      return detailsParam
        ? `Connection failed: ${detailsParam}`
        : 'Failed to connect store. Please check your store domain and try again.'
    case 'oauth_setup_failed':
      return detailsParam ? `OAuth setup failed: ${detailsParam}` : 'OAuth setup failed. Please contact support.'
    case 'user_auth_failed':
      return 'User authentication failed. Please sign in again.'
    case 'oauth_failed':
      return detailsParam ? `OAuth failed: ${detailsParam}` : 'Failed to authorize with Shopify. Please try again.'
    case 'limit_reached':
      return 'You can only connect one store. Please disconnect your existing store first.'
    default:
      return detailsParam ? `Error: ${detailsParam}` : 'An error occurred. Please try again.'
  }
}

function ConnectStoreContent() {
  const { user, loading } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [shopDomain, setShopDomain] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  const urlErrorMessage = getShopifyConnectErrorMessage(searchParams.get('error'), searchParams.get('details'))
  const visibleError = error || urlErrorMessage

  const handleConnect = async () => {
    if (!shopDomain.trim()) {
      setError('Please enter your shop domain')
      return
    }

    if (!user) {
      setError('You must be signed in to connect a store')
      return
    }

    setIsConnecting(true)
    setError('')

    try {
      // Clean up the domain
      let cleanDomain = shopDomain.trim()
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '')
      cleanDomain = cleanDomain.replace(/\/$/, '')
      
      // Add .myshopify.com if not present
      if (!cleanDomain.includes('.myshopify.com') && !cleanDomain.includes('.')) {
        cleanDomain = `${cleanDomain}.myshopify.com`
      }

      console.log('🔗 Initiating Shopify OAuth for:', cleanDomain)
      
      // Redirect to Shopify OAuth - this will ask for permission
      window.location.href = `/api/auth/shopify?shop=${encodeURIComponent(cleanDomain)}`
    } catch (error) {
      console.error('Error connecting store:', error)
      setError('Failed to connect store. Please try again.')
      setIsConnecting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConnect()
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-56 rounded-xl bg-white/[0.06]" />
        <div className="h-80 rounded-2xl border border-white/10 bg-white/[0.03]" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card-premium p-10 text-center">
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <AlertCircle className="h-6 w-6 text-amber-200" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">Authentication Required</h1>
          <p className="text-white/60 mt-3 max-w-md mx-auto">
            You need to be logged in to connect your Shopify store.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/login" className="btn-primary">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-secondary">
              Create Account
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-6">
            Already have an account? Sign in to continue. New user? Create your free account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/stores"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Back to stores"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-premium">Connect Shopify Store</h1>
          <p className="text-white/60 mt-2">
            Connect your Shopify store to start sending email and SMS campaigns.
          </p>
        </div>
      </div>

      <div className="card-premium p-8">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shadow-[0_22px_60px_rgba(0,0,0,0.55)]">
            <Store className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Add Shopify Store</h2>
          <p className="text-white/60">
            Enter your Shopify store domain to begin the connection process.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Store Domain
            </label>
            <div className="relative">
              <input
                type="text"
                value={shopDomain}
                onChange={(e) => {
                  setShopDomain(e.target.value)
                  if (urlErrorMessage) {
                    router.replace('/stores/connect')
                  }
                }}
                onKeyDown={handleKeyDown}
                className="input-premium w-full pr-32"
                placeholder="your-store"
                disabled={isConnecting}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/55 text-sm">
                .myshopify.com
              </div>
            </div>
            <p className="text-xs text-white/45 mt-1">
              Enter just the store name (e.g., &quot;my-store&quot; for my-store.myshopify.com)
            </p>
          </div>

          {visibleError && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-300 mt-0.5" />
                <p className="text-red-100 text-sm">{visibleError}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/10 border-l-2 border-l-[color:var(--accent-hi)] bg-white/[0.02] p-4">
            <h3 className="text-sm font-medium text-[color:var(--accent-hi)] mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-white/70 space-y-1">
              <li>• You&apos;ll be redirected to Shopify to authorize the connection</li>
              <li>• Grant permissions for customer data and order information</li>
              <li>• Your store will be added to your account</li>
              <li>• Start creating campaigns immediately</li>
            </ul>
          </div>

          <button
            onClick={handleConnect}
            disabled={isConnecting || !shopDomain.trim()}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isConnecting ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connecting...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect to Shopify
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-white/60 text-sm">
          Don&apos;t have a Shopify store?{' '}
          <a
            href="https://www.shopify.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--accent-hi)] hover:text-white underline underline-offset-4"
          >
            Create one here
          </a>
        </p>
      </div>
    </div>
  )
}


export default function ConnectStorePage() {
  return (
    <Suspense fallback={
      <div className="animate-pulse max-w-2xl mx-auto space-y-6">
        <div className="h-8 w-56 rounded-xl bg-white/[0.06]" />
        <div className="h-80 rounded-2xl border border-white/10 bg-white/[0.03]" />
      </div>
    }>
      <ConnectStoreContent />
    </Suspense>
  )
}

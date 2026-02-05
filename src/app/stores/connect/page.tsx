'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from '@/lib/auth/session'
import Link from 'next/link'
import { ArrowLeft, Store, ExternalLink, AlertCircle, Loader2 } from 'lucide-react'
import { useSearchParams, useRouter } from 'next/navigation'

function ConnectStoreContent() {
  const { user, loading } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [shopDomain, setShopDomain] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check for error parameters in URL
    const errorParam = searchParams.get('error')
    const detailsParam = searchParams.get('details')
    
    if (errorParam) {
      console.log('❌ Error parameter found:', errorParam)
      console.log('❌ Error details:', detailsParam)
      
      let errorMessage = 'An error occurred. Please try again.'
      
      switch (errorParam) {
        case 'auth_failed':
          errorMessage = detailsParam ? `Authentication failed: ${detailsParam}` : 'Authentication failed. Please try again.'
          break
        case 'connection_failed':
          errorMessage = detailsParam ? `Connection failed: ${detailsParam}` : 'Failed to connect store. Please check your store domain and try again.'
          break
        case 'oauth_setup_failed':
          errorMessage = detailsParam ? `OAuth setup failed: ${detailsParam}` : 'OAuth setup failed. Please contact support.'
          break
        case 'user_auth_failed':
          errorMessage = 'User authentication failed. Please sign in again.'
          break
        case 'oauth_failed':
          errorMessage = detailsParam ? `OAuth failed: ${detailsParam}` : 'Failed to authorize with Shopify. Please try again.'
          break
        case 'limit_reached':
          errorMessage = 'You can only connect one store. Please disconnect your existing store first.'
          break
        default:
          errorMessage = detailsParam ? `Error: ${detailsParam}` : 'An error occurred. Please try again.'
      }
      
      setError(errorMessage)
    }
  }, [searchParams])

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConnect()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Authentication Required</h1>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You need to be logged in to connect your Shopify store.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/auth/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                onClick={() => console.log('🔗 Sign In button clicked (connect page)')}
              >
                Sign In
              </a>
              <a 
                href="/auth/register" 
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center justify-center"
                onClick={() => console.log('🔗 Create Account button clicked (connect page)')}
              >
                Create Account
              </a>
            </div>
            <p className="text-gray-400 text-sm mt-6">
              Already have an account? Sign in to continue. New user? Create your free account.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/stores" className="inline-flex items-center text-gray-400 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Stores
          </Link>
          <h1 className="text-3xl font-bold text-white">Connect Your Shopify Store</h1>
          <p className="text-gray-400 mt-2">
            Connect your Shopify store to start sending email and SMS campaigns
          </p>
        </div>

        <div className="card-premium p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Add Shopify Store</h2>
            <p className="text-gray-400">
              Enter your Shopify store domain to begin the connection process
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Store Domain
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="input-premium w-full pr-32"
                  placeholder="your-store"
                  disabled={isConnecting}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  .myshopify.com
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter just the store name (e.g., "my-store" for my-store.myshopify.com)
              </p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-400 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-200 space-y-1">
                <li>• You'll be redirected to Shopify to authorize the connection</li>
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Don't have a Shopify store?{' '}
            <a 
              href="https://www.shopify.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              Create one here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}


export default function ConnectStorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    }>
      <ConnectStoreContent />
    </Suspense>
  )
}

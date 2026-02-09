'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle, ArrowLeft } from 'lucide-react'

const errorMessages: Record<string, string> = {
  missing_parameters: 'Missing required parameters in the authentication request.',
  missing_state: 'Missing state parameter in the authentication request.',
  invalid_state: 'Invalid or expired authentication state.',
  oauth_failed: 'OAuth authentication failed. Please try again.',
  oauth_error: 'There was an error during the OAuth process.',
  shopify_error: 'There was an error connecting to your Shopify store.',
  default: 'An authentication error occurred. Please try again.'
}

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'default'
  const message = errorMessages[error] || errorMessages.default

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-black">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message}
          </p>
        </div>
        
        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {error === 'shopify_error' && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-sm font-medium text-black mb-2">
              Troubleshooting Tips:
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Make sure your shop domain is correct (e.g., mystore.myshopify.com)</li>
              <li>• Ensure you have admin access to the Shopify store</li>
              <li>• Check that the app is properly configured in your Shopify admin</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Mail, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState('')

  const handleResendEmail = async () => {
    if (!email) return
    
    setResending(true)
    setError('')
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setResent(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to resend verification email')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">Marketing Platform Pro</h1>
            <p className="text-gray-400 text-sm">Professional Email & SMS Marketing</p>
          </div>
        </div>

        {/* Verification Card */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-600/20 mb-6">
              <Mail className="h-8 w-8 text-blue-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Check your email
            </h2>
            
            <p className="text-gray-400 mb-6">
              We've sent a verification link to{' '}
              <span className="text-white font-medium">{email}</span>
            </p>
            
            <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                <div className="text-left">
                  <p className="text-blue-200 text-sm font-medium mb-1">Next steps:</p>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Check your inbox and spam folder</li>
                    <li>• Click the verification link in the email</li>
                    <li>• Return here to sign in to your account</li>
                  </ul>
                </div>
              </div>
            </div>

            {resent && (
              <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                  <p className="text-green-200 text-sm">Verification email sent successfully!</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleResendEmail}
                disabled={resending || !email}
                className="w-full flex justify-center py-3 px-4 border border-gray-600 text-sm font-medium rounded-lg text-white bg-transparent hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Resend verification email'
                )}
              </button>

              <Link
                href="/auth/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>

        {/* Help text */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={handleResendEmail}
              disabled={resending}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              try again
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}


export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}

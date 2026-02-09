'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to send reset email')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
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

          {/* Success Card */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-600/20 mb-6">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                Check your email
              </h2>
              
              <p className="text-gray-400 mb-6">
                If an account with <span className="text-white font-medium">{email}</span> exists, 
                we've sent you a password reset link.
              </p>
              
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Mail className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                  <div className="text-left">
                    <p className="text-blue-200 text-sm font-medium mb-1">Next steps:</p>
                    <ul className="text-blue-200 text-sm space-y-1">
                      <li>• Check your inbox and spam folder</li>
                      <li>• Click the reset link in the email</li>
                      <li>• Create a new password</li>
                      <li>• Sign in with your new password</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Link
                href="/auth/login"
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
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
          <h2 className="text-2xl font-bold text-white mb-2">
            Reset your password
          </h2>
          <p className="text-gray-400">
            Enter your email address and we'll send you a reset link
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-3 pl-10 bg-gray-800/50 border border-gray-700 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Send reset link'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
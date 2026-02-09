'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setError('Invalid or missing reset token')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/auth/login?message=Password updated successfully. Please sign in.')
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to reset password')
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
                Password updated!
              </h2>
              
              <p className="text-gray-400 mb-6">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
              
              <p className="text-sm text-gray-500">
                Redirecting you to sign in...
              </p>
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
            Create new password
          </h2>
          <p className="text-gray-400">
            Enter your new password below
          </p>
        </div>

        {/* Reset Form */}
        <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  New password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 bg-gray-800/50 border border-gray-700 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-400 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm new password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    className="appearance-none relative block w-full px-3 py-3 pl-10 pr-10 bg-gray-800/50 border border-gray-700 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-400 transition-colors" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-500 hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-400 mb-2">Password requirements:</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li className={password.length >= 8 ? 'text-green-400' : ''}>
                  • At least 8 characters long
                </li>
                <li className={password !== confirmPassword && confirmPassword ? 'text-red-400' : password === confirmPassword && password ? 'text-green-400' : ''}>
                  • Passwords must match
                </li>
              </ul>
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
                disabled={loading || !token}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Update password'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Back to login */}
        <div className="text-center">
          <Link
            href="/auth/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}


export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 animate-spin text-black" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}

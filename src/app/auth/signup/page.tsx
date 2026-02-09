'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle,
  ShoppingBag
} from 'lucide-react'

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate terms agreement
    if (!formData.agreeToTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email, 
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`.trim()
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Email verification disabled - always redirect to dashboard
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-premium">MarketingPro</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-premium mb-2">Create your account</h1>
            <p className="text-gray-400">Start your free trial today. No credit card required.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="input-premium pl-10 w-full"
                    placeholder="John"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="input-premium pl-10 w-full"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input-premium pl-10 w-full"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-premium pl-10 pr-10 w-full"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-premium pl-10 w-full"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleInputChange}
                className="rounded border-gray-600 bg-gray-700 text-white focus:ring-white mr-3"
                required
              />
              <label className="text-sm text-gray-400">
                I agree to the{' '}
                <Link href="/terms" className="text-white hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-white hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </button>
          </form>

          {/* Sign in link */}
          <div className="text-center mt-6">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-white hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 items-center justify-center p-8">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-premium mb-8">
            Everything you need to grow your business
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Shopify Integration</h3>
                <p className="text-gray-400">Connect your store in under 5 minutes with OAuth</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Email & SMS Marketing</h3>
                <p className="text-gray-400">Professional campaigns with custom domain support</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Marketing Automation</h3>
                <p className="text-gray-400">Automated workflows that increase sales 24/7</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Advanced Analytics</h3>
                <p className="text-gray-400">Track ROI and revenue attribution in real-time</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-4 mt-1">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">GDPR Compliant</h3>
                <p className="text-gray-400">Built-in compliance and consent management</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-900/50 rounded-lg border border-gray-800">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-1">14-day free trial</div>
              <div className="text-gray-400">No credit card required</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
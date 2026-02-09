'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  ShoppingBag,
  Sparkles,
  User,
  Zap,
} from 'lucide-react'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [lastname, setLastname] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, lastname, email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.needsVerification) {
          // Show success message and don't redirect
          setSuccess(true)
          setSuccessMessage(data.message || 'Please check your email to verify your account.')
        } else {
          // No verification needed - redirect to dashboard
          router.push('/dashboard')
        }
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
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

          <Link href="/auth/login" className="btn-secondary">
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16 pt-10">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/75">
                <Sparkles className="h-4 w-4 text-[color:var(--accent-hi)]" />
                Start Free
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-premium">
                Create your account
              </h1>
              <p className="text-white/65 leading-relaxed">
                Join thousands of Shopify operators using premium email & SMS tools
                designed for conversion, compliance, and calm UX.
              </p>

              <div className="grid gap-3">
                {[
                  {
                    icon: Zap,
                    title: 'Launch in minutes',
                    body: 'Connect Shopify, import subscribers, and ship your first campaign fast.',
                  },
                  {
                    icon: Shield,
                    title: 'Compliance-first',
                    body: 'Consent-aware sending with clean defaults and safeguards.',
                  },
                ].map((item) => (
                  <div key={item.title} className="card-premium p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {item.title}
                        </div>
                        <div className="mt-1 text-sm text-white/60">
                          {item.body}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                <div className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  No credit card required
                </div>
                <div className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  Cancel anytime
                </div>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
            <div className="space-y-4">
              <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(4,31,26,0.75),rgba(255,255,255,0.08))] animate-gradient-shift">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-3xl backdrop-blur-xl">
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/75">
                      <span className="h-2 w-2 rounded-full bg-[color:var(--accent-hi)] shadow-[0_0_0_4px_rgba(4,31,26,0.18)] animate-glow-pulse" />
                      Free account
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-white">
                      Create account
                    </h2>
                    <p className="mt-2 text-sm text-white/60">
                      Start your premium marketing journey.
                    </p>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-white/70 mb-2"
                        >
                          First name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-white/35" />
                          </div>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="given-name"
                            required
                            disabled={loading}
                            className="input-premium w-full pl-10! disabled:opacity-60"
                            placeholder="Enter your first name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="lastname"
                          className="block text-sm font-medium text-white/70 mb-2"
                        >
                          Last name
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-white/35" />
                          </div>
                          <input
                            id="lastname"
                            name="lastname"
                            type="text"
                            autoComplete="family-name"
                            disabled={loading}
                            className="input-premium w-full pl-10! disabled:opacity-60"
                            placeholder="Enter your last name"
                            value={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-white/70 mb-2"
                        >
                          Email address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-white/35" />
                          </div>
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            disabled={loading}
                            className="input-premium w-full pl-10! disabled:opacity-60"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-white/70 mb-2"
                        >
                          Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-white/35" />
                          </div>
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            disabled={loading}
                            className="input-premium w-full pl-10! pr-10! disabled:opacity-60"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/45 hover:text-white transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? 'Hide password' : 'Show password'
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="block text-sm font-medium text-white/70 mb-2"
                        >
                          Confirm password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-white/35" />
                          </div>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            required
                            disabled={loading}
                            className="input-premium w-full pl-10! pr-10! disabled:opacity-60"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/45 hover:text-white transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={
                              showConfirmPassword ? 'Hide password' : 'Show password'
                            }
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                      <p className="text-xs text-white/55 mb-2">Password requirements:</p>
                      <ul className="text-xs text-white/50 space-y-1">
                        <li className={password.length >= 8 ? 'text-emerald-300' : ''}>
                          • At least 8 characters long
                        </li>
                        <li className={password !== confirmPassword && confirmPassword ? 'text-red-300' : password === confirmPassword && password ? 'text-emerald-300' : ''}>
                          • Passwords must match
                        </li>
                      </ul>
                    </div>

                    {error && (
                      <div
                        className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4"
                        role="alert"
                      >
                        <p className="text-red-100 text-sm">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div
                        className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4"
                        role="status"
                      >
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 text-emerald-300 flex-shrink-0 mt-0.5" />
                          <div className="space-y-2">
                            <p className="text-emerald-100 text-sm font-medium">
                              Verification Email Sent
                            </p>
                            <p className="text-emerald-100/80 text-sm">
                              {successMessage}
                            </p>
                            <p className="text-emerald-100/60 text-xs">
                              Please check your inbox and spam folder. The verification link will expire in 24 hours.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || success}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : success ? (
                        'Account Created'
                      ) : (
                        'Create account'
                      )}
                      {!loading && !success && <ArrowRight className="h-4 w-4" />}
                      {success && <CheckCircle className="h-4 w-4" />}
                    </button>

                    <div className="text-xs text-white/55 text-center">
                      By creating an account, you agree to our{' '}
                      <Link href="/terms" className="text-[color:var(--accent-hi)] hover:text-white transition-colors">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-[color:var(--accent-hi)] hover:text-white transition-colors">
                        Privacy Policy
                      </Link>
                    </div>
                  </form>
                </div>
              </div>

              <p className="text-center text-sm text-white/55">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-[color:var(--accent-hi)] hover:text-white transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

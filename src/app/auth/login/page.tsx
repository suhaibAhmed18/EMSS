"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const message = searchParams.get("message");
  const sessionCleared = searchParams.get("session_cleared");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Ensure cookies are included
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Login successful:", data);

        // Small delay to ensure session is properly set
        setTimeout(() => {
          router.push("/dashboard");
          // Force a page reload to ensure navigation updates
          window.location.href = "/dashboard";
        }, 100);
      } else {
        const data = await response.json();
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

          <Link href="/auth/register" className="btn-secondary">
            Create account
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
                Welcome Back
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-premium">
                Sign in to your account
              </h1>
              <p className="text-white/65 leading-relaxed">
                Sign in to launch campaigns, manage segments, and orchestrate
                automation flows with premium controls and a grid-and-glass
                aesthetic built for focus.
              </p>

              <div className="grid gap-3">
                {[
                  {
                    icon: Zap,
                    title: "Automations",
                    body: "Lifecycle workflows with intent-driven triggers and actions.",
                  },
                  {
                    icon: Shield,
                    title: "Compliance-first",
                    body: "Consent-aware sending with clean defaults and safeguards.",
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
            </div>
          </div>

          <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end">
            <div className="space-y-4">
              {message && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-200 mt-0.5" />
                    <p className="text-emerald-100 text-sm">{message}</p>
                  </div>
                </div>
              )}

              {sessionCleared && (
                <div className="rounded-2xl border border-white/10 border-l-2 border-l-[color:var(--accent-hi)] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-[color:var(--accent-hi)] mt-0.5" />
                    <p className="text-white/70 text-sm">
                      Your session was cleared due to an account format update.
                      Please sign in again.
                    </p>
                  </div>
                </div>
              )}

              <div className="relative rounded-3xl p-[1px] bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(4,31,26,0.75),rgba(255,255,255,0.08))] animate-gradient-shift">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 shadow-3xl backdrop-blur-xl">
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/75">
                      <span className="h-2 w-2 rounded-full bg-[color:var(--accent-hi)] shadow-[0_0_0_4px_rgba(4,31,26,0.18)] animate-glow-pulse" />
                      Secure sign in
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold text-white">
                      Sign in
                    </h2>
                    <p className="mt-2 text-sm text-white/60">
                      Enter your credentials to continue.
                    </p>
                  </div>

                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-4">
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
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            required
                            disabled={loading}
                            className="input-premium w-full pl-10! pr-10! disabled:opacity-60"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/45 hover:text-white transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
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
                    </div>

                    {error && (
                      <div
                        className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4"
                        role="alert"
                      >
                        <p className="text-red-100 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Sign in"
                      )}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>

                    <div className="flex items-center justify-between">
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-white/60 hover:text-white transition-colors"
                      >
                        Forgot your password?
                      </Link>
                      <Link
                        href="/auth/register"
                        className="text-sm text-[color:var(--accent-hi)] hover:text-white transition-colors"
                      >
                        Create account
                      </Link>
                    </div>
                  </form>
                </div>
              </div>

              <p className="text-center text-sm text-white/55">
                New here?{" "}
                <Link
                  href="/auth/register"
                  className="text-[color:var(--accent-hi)] hover:text-white transition-colors"
                >
                  Start free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md py-20">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-56 rounded-xl bg-white/[0.06]" />
            <div className="h-72 rounded-3xl border border-white/10 bg-white/[0.03]" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

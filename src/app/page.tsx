'use client'

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BarChart3,
  CheckCircle,
  Globe,
  Mail,
  Menu,
  MessageSquare,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'

type SpotlightStyle = CSSProperties & {
  '--mx'?: string
  '--my'?: string
}

const stats = [
  { label: 'Store connections', value: '10,000+' },
  { label: 'Messages delivered', value: '50M+' },
  { label: 'Avg. ROI uplift', value: '4.0×' },
  { label: 'Platform uptime', value: '99.9%' },
]

const features = [
  {
    icon: Mail,
    title: 'Email that lands',
    description: 'Craft stunning campaigns with a drag-and-drop editor, domain support, and deliverability-first defaults.',
  },
  {
    icon: MessageSquare,
    title: 'SMS that converts',
    description: 'High-signal messaging with compliance baked in, smart segmentation, and scalable sending.',
  },
  {
    icon: Zap,
    title: 'Automation, simplified',
    description: 'Behavior-triggered workflows that feel effortless—welcome series, win-backs, abandonments, and more.',
  },
  {
    icon: BarChart3,
    title: 'Analytics you trust',
    description: 'Know what drives revenue with clear attribution, funnel insights, and exportable reporting.',
  },
  {
    icon: Shield,
    title: 'Compliance by design',
    description: 'Consent, suppression, and policy-ready tooling for GDPR and messaging standards—without slowing you down.',
  },
  {
    icon: Globe,
    title: 'Shopify-native',
    description: 'Deep Shopify integration for customer data, orders, and events—ready for segmentation and automation.',
  },
]

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'E-commerce Manager',
    company: 'Fashion Forward',
    content: 'Email revenue jumped 3× in 90 days. The automations are the first ones that actually feel “set and forget.”',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Marketing Director',
    company: 'Tech Gadgets Pro',
    content: 'Abandoned cart SMS became a top revenue channel. The segmentation and timing tools are unreal.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'Founder',
    company: 'Organic Beauty Co',
    content: 'We connected Shopify and shipped our first campaign in minutes. Everything looks premium out of the box.',
    rating: 5,
  },
]

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const spotlightStyle: SpotlightStyle = { '--mx': '50%', '--my': '35%' }

  const handleSpotlightMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }

  return (
    <div className="relative">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/25 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  MarketingPro
                  <span className="h-2 w-2 rounded-full bg-[color:var(--accent-hi)] shadow-[0_0_0_4px_rgba(4,31,26,0.18)] animate-glow-pulse" />
                </div>
                <div className="text-xs text-white/55">Premium marketing for Shopify</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6 text-sm">
              <Link href="#features" className="text-white/70 hover:text-white transition-colors">
                Features
              </Link>
              <Link href="#proof" className="text-white/70 hover:text-white transition-colors">
                Proof
              </Link>
              <Link href="#stories" className="text-white/70 hover:text-white transition-colors">
                Stories
              </Link>
              <Link href="/auth/login" className="btn-ghost px-3 py-2">
                Sign in
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Start free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </nav>

            <button
              onClick={() => setMobileMenuOpen((value) => !value)}
              className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4">
              <div className="mt-2 grid gap-2 rounded-3xl border border-white/10 bg-white/[0.03] p-3">
                <Link href="#features" className="btn-ghost justify-start" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </Link>
                <Link href="#proof" className="btn-ghost justify-start" onClick={() => setMobileMenuOpen(false)}>
                  Proof
                </Link>
                <Link href="#stories" className="btn-ghost justify-start" onClick={() => setMobileMenuOpen(false)}>
                  Stories
                </Link>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link href="/auth/login" className="btn-secondary" onClick={() => setMobileMenuOpen(false)}>
                    Sign in
                  </Link>
                  <Link href="/auth/register" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>
                    Start free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 left-[-80px] h-[520px] w-[520px] rounded-full bg-[rgba(4,31,26,0.55)] blur-3xl animate-float-slower" />
          <div className="absolute top-20 right-[-100px] h-[520px] w-[520px] rounded-full bg-[rgba(255,255,255,0.10)] blur-3xl animate-float-slow" />
          <div className="absolute bottom-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[rgba(4,31,26,0.35)] blur-3xl animate-glow-pulse" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/75">
                <Sparkles className="h-4 w-4 text-[color:var(--accent-hi)]" />
                Built for modern Shopify operators
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-premium">
                  Premium email & SMS that feels like a command center.
                </h1>
                <p className="text-lg text-white/65 leading-relaxed max-w-xl">
                  Launch campaigns, automate lifecycle flows, and measure revenue impact with a dashboard that’s designed to be
                  fast, calm, and relentlessly effective.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/register" className="btn-primary">
                  Start free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/auth/login" className="btn-secondary">
                  Sign in
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-white/65">
                <div className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  No credit card required
                </div>
                <div className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  Shopify connect in minutes
                </div>
                <div className="inline-flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-300" />
                  Compliance-first defaults
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2.25rem] bg-[radial-gradient(600px_circle_at_20%_0%,rgba(4,31,26,0.65),transparent_55%)] blur-2xl opacity-70" />
              <div
                onMouseMove={handleSpotlightMove}
                style={spotlightStyle}
                className="group relative rounded-[2.25rem] p-[1px] bg-[linear-gradient(135deg,rgba(255,255,255,0.18),rgba(4,31,26,0.75),rgba(255,255,255,0.08))] animate-gradient-shift"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[2.25rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100 [background:radial-gradient(700px_circle_at_var(--mx)_var(--my),rgba(4,31,26,0.55),transparent_60%)]"
                />
                <div className="relative rounded-[2.18rem] border border-white/10 bg-white/[0.03] p-6 shadow-3xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-white/55">Live workspace</div>
                      <div className="truncate text-sm font-semibold text-white">Revenue, campaigns, automation</div>
                    </div>
                    <span className="badge badge-accent">Dashboard</span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {[
                      { label: 'Deliverability', value: '98.4%' },
                      { label: 'Recovered revenue', value: '$42.1k' },
                      { label: 'New subscribers', value: '+1,284' },
                      { label: 'Automation ROI', value: '5.2×' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-white/10 bg-black/25 p-4 transition-colors hover:bg-black/30"
                      >
                        <div className="text-xs text-white/55">{item.label}</div>
                        <div className="mt-1 text-lg font-semibold text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="flex items-center justify-between text-xs text-white/55">
                      <span>Campaign performance</span>
                      <span className="inline-flex items-center gap-1 text-emerald-200">
                        <TrendingUp className="h-3.5 w-3.5" />
                        +18%
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,rgba(4,31,26,0.95),rgba(255,255,255,0.65),rgba(4,31,26,0.95))] animate-shimmer" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[44%] rounded-full bg-[linear-gradient(90deg,rgba(4,31,26,0.85),rgba(255,255,255,0.50),rgba(4,31,26,0.85))] animate-shimmer" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full w-[78%] rounded-full bg-[linear-gradient(90deg,rgba(4,31,26,0.75),rgba(255,255,255,0.40),rgba(4,31,26,0.75))] animate-shimmer" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/55">
                    <span className="badge badge-muted">Email</span>
                    <span className="badge badge-muted">SMS</span>
                    <span className="badge badge-muted">Automation</span>
                    <span className="badge badge-muted">Analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="proof" className="py-14 border-y border-white/10 bg-black/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="card-premium p-5">
                <div className="text-2xl sm:text-3xl font-semibold text-premium">{stat.value}</div>
                <div className="mt-2 text-sm text-white/55">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-semibold text-premium">Everything you need to grow—without the noise.</h2>
            <p className="mt-4 text-lg text-white/65">
              Purpose-built tools for high-quality lifecycle marketing, designed to keep you in flow.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="card-premium-hover p-6">
                <div className="flex items-start gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-white/60 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              { icon: Users, title: 'Segments that make sense', body: 'Build smarter audiences with consent-aware filters and real Shopify signals.' },
              { icon: Zap, title: 'Automations with intent', body: 'Triggers and actions designed for lifecycle marketing—not generic “workflow builders”.' },
              { icon: Shield, title: 'Built-in safeguards', body: 'Suppression, opt-out, and compliance defaults to keep sending reputation clean.' },
            ].map((item) => (
              <div key={item.title} className="card-premium p-6">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-white/80">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-semibold text-white">{item.title}</div>
                </div>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="py-20 border-t border-white/10 bg-black/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div className="max-w-3xl">
              <h2 className="text-3xl sm:text-4xl font-semibold text-premium">Operators love the calm.</h2>
              <p className="mt-4 text-lg text-white/65">Stories from teams who wanted premium UX without sacrificing power.</p>
            </div>
            <Link href="/auth/register" className="btn-secondary">
              Start free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="card-premium p-6">
                <div className="flex items-center gap-1 text-amber-200">
                  {Array.from({ length: testimonial.rating }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/70 leading-relaxed">“{testimonial.content}”</p>
                <div className="mt-6">
                  <div className="text-sm font-semibold text-white">{testimonial.name}</div>
                  <div className="text-xs text-white/55">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(4,31,26,0.35),rgba(255,255,255,0.04))] p-[1px]">
              <div className="relative rounded-[1.75rem] bg-white/[0.03] px-6 py-10 sm:px-10 sm:py-12 backdrop-blur-xl">
                <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70 gradient-premium" />
                <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-center">
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-premium">Ready to ship a premium lifecycle engine?</h3>
                    <p className="mt-3 text-white/65 max-w-2xl">
                      Connect Shopify, import subscribers, and launch campaigns that look like they belong in 2026.
                    </p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                      <Link href="/auth/register" className="btn-primary">
                        Start free
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href="/auth/login" className="btn-secondary">
                        Sign in
                      </Link>
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/60">
                      <div className="inline-flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-300" />
                        No credit card
                      </div>
                      <div className="inline-flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-emerald-300" />
                        Cancel anytime
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    {[
                      { label: 'Campaigns', value: 'Email + SMS' },
                      { label: 'Automation', value: 'Triggers + actions' },
                      { label: 'Analytics', value: 'Attribution-ready' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <div className="text-xs text-white/55">{item.label}</div>
                        <div className="mt-1 text-sm font-semibold text-white">{item.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">MarketingPro</div>
                  <div className="text-xs text-white/55">Premium marketing platform</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-white/55 leading-relaxed max-w-xs">
                Email + SMS marketing for Shopify teams who care about craft, conversion, and calm UX.
              </p>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Product</div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="#features" className="text-white/60 hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/auth/register" className="text-white/60 hover:text-white transition-colors">
                    Start free
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-white/60 hover:text-white transition-colors">
                    Sign in
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Support</div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/help" className="text-white/60 hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-white/60 hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-white/60 hover:text-white transition-colors">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-semibold text-white">Legal</div>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link href="/privacy" className="text-white/60 hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-white/60 hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-white/60 hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-6 text-sm text-white/45">
            <div>© {new Date().getFullYear()} MarketingPro. All rights reserved.</div>
            <div className="flex items-center gap-2">
              <span className="badge badge-muted">Crafted UI</span>
              <span className="badge badge-muted">Grid + glass</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

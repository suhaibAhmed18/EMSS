'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { ScopeVerificationBanner } from '@/components/shopify/ScopeVerificationBanner'
import {
  BarChart3,
  LogOut,
  Mail,
  Menu,
  Settings,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
  X,
  Zap,
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
] as const

function isRouteActive(pathname: string, href: string) {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const { user, loading, signOut } = useSession()

  const handleSignOut = async () => {
    await signOut()
  }

  const activeNavItem = useMemo(
    () => navigation.find((item) => isRouteActive(pathname, item.href)),
    [pathname]
  )

  return (
    <div className="app-background">
      <div className="relative z-10 flex min-h-screen">
        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 w-[19rem] p-3">
              <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-3xl backdrop-blur-xl">
                <div className="flex items-center justify-between px-4 py-4">
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-3"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <ShoppingBag className="h-5 w-5 text-white" />
                    </div>
                    <div className="leading-tight">
                      <div className="text-sm font-semibold text-white">MarketingPro</div>
                      <div className="text-xs text-white/55">Command center</div>
                    </div>
                  </Link>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
                    aria-label="Close sidebar"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-premium">
                  <div className="mb-3 px-2 text-[11px] font-medium uppercase tracking-wider text-white/45">
                    Workspace
                  </div>
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const active = isRouteActive(pathname, item.href)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          aria-current={active ? 'page' : undefined}
                          className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? 'border border-white/10 bg-white/[0.06] text-white shadow-lg shadow-black/20'
                              : 'border border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'
                          }`}
                        >
                          <div
                            className={`grid h-9 w-9 place-items-center rounded-xl border transition-all ${
                              active
                                ? 'border-white/15 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white'
                                : 'border-white/10 bg-white/[0.03] text-white/70 group-hover:bg-white/[0.05] group-hover:text-white'
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="truncate">{item.name}</span>
                          {active && (
                            <span className="ml-auto h-2 w-2 rounded-full bg-[color:var(--accent-hi)] shadow-[0_0_0_4px_rgba(255,255,255,0.04)]" />
                          )}
                        </Link>
                      )
                    })}
                  </div>
                </nav>

                <div className="border-t border-white/10 bg-white/[0.02] p-3">
                  {loading ? (
                    <div className="h-11 w-full animate-pulse rounded-2xl bg-white/[0.05]" />
                  ) : user ? (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{user.email}</div>
                        <div className="text-xs text-white/55">Signed in</div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
                        title="Sign out"
                        aria-label="Sign out"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:w-[19rem] lg:flex-col lg:p-3 lg:sticky lg:top-0 lg:h-screen lg:self-start">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-premium backdrop-blur-xl">
            <div className="px-4 py-4">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                  <ShoppingBag className="h-5 w-5 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">MarketingPro</div>
                  <div className="text-xs text-white/55">Command center</div>
                </div>
              </Link>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 pb-3 scrollbar-premium">
              <div className="mb-3 px-2 text-[11px] font-medium uppercase tracking-wider text-white/45">
                Workspace
              </div>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const active = isRouteActive(pathname, item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'border border-white/10 bg-white/[0.06] text-white shadow-lg shadow-black/20'
                          : 'border border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <div
                        className={`grid h-9 w-9 place-items-center rounded-xl border transition-all ${
                          active
                            ? 'border-white/15 bg-[linear-gradient(135deg,rgba(4,31,26,0.95),rgba(10,83,70,0.92))] text-white'
                            : 'border-white/10 bg-white/[0.03] text-white/70 group-hover:bg-white/[0.05] group-hover:text-white'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="truncate">{item.name}</span>
                      {active && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-[color:var(--accent-hi)] shadow-[0_0_0_4px_rgba(255,255,255,0.04)]" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </nav>

            <div className="border-t border-white/10 bg-white/[0.02] p-3">
              {loading ? (
                <div className="h-11 w-full animate-pulse rounded-2xl bg-white/[0.05]" />
              ) : user ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{user.email}</div>
                    <div className="text-xs text-white/55">Signed in</div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
                    title="Sign out"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-black/25 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-white/45">Workspace</div>
                  <div className="truncate text-sm font-semibold text-white">
                    {activeNavItem?.name ?? 'Dashboard'}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  {loading ? (
                    <div className="h-10 w-40 animate-pulse rounded-2xl bg-white/[0.05]" />
                  ) : user ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <div className="max-w-[18rem] truncate text-sm text-white/80">{user.email}</div>
                      <button
                        onClick={handleSignOut}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white"
                        title="Sign out"
                        aria-label="Sign out"
                      >
                        <LogOut className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <ScopeVerificationBanner />
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

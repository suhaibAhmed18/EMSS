'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth/session'
import { 
  BarChart3, 
  Mail, 
  Users, 
  Settings, 
  Zap,
  Menu,
  X,
  ShoppingBag,
  TrendingUp,
  Store,
  LogOut,
  User
} from 'lucide-react'

const dashboardNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { name: 'Stores', href: '/stores', icon: Store },
  { name: 'Campaigns', href: '/campaigns', icon: Mail },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'Contacts', href: '/contacts', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Settings', href: '/settings', icon: Settings },
]



export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useSession()

  // Debug logging
  useEffect(() => {
    console.log('🔍 Navigation Debug:', { 
      pathname, 
      user: user ? `${user.email} (${user.id})` : null, 
      loading 
    })
  }, [pathname, user, loading])

  // Redirect authenticated users from home page to dashboard
  useEffect(() => {
    if (user && pathname === '/') {
      console.log('🔄 Redirecting authenticated user to dashboard')
      router.push('/dashboard')
    }
  }, [user, pathname, router])

  // Close dropdowns when clicking outside or navigating
  useEffect(() => {
    setUserMenuOpen(false)
    setMobileMenuOpen(false)
  }, [pathname])



  // Don't show dashboard navigation on public pages when user is not authenticated
  const isPublicPage = pathname === '/' || pathname.startsWith('/auth/') || pathname.startsWith('/terms') || pathname.startsWith('/privacy') || pathname.startsWith('/cookies')
  
  // Don't render navigation while loading session
  if (loading) {
    console.log('⏳ Navigation: Loading session...')
    return (
      <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">MarketingPro</span>
              </div>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse text-gray-400">Loading...</div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Don't render navigation on auth pages
  if (pathname.startsWith('/auth/')) {
    console.log('🚫 Navigation: Auth page, not rendering')
    return null
  }
  
  // Don't render navigation on public pages when user is not authenticated
  if (isPublicPage && !user) {
    console.log('🚫 Navigation: Public page without user, not rendering')
    return null
  }

  console.log('✅ Navigation: Rendering with user:', user ? user.email : 'none')

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <nav className="bg-black border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">MarketingPro</span>
            </Link>
          </div>

          {/* Desktop navigation - only show if user is authenticated */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {dashboardNavigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-black shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Right side - user menu only when authenticated */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:block text-sm">{user.email}</span>
                  </button>

                  {/* User dropdown */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800 bg-black">
          <div className="px-4 py-2 space-y-1">
            {user ? (
              <>
                {dashboardNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-black'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  )
                })}
                
                <div className="border-t border-gray-700 mt-2 pt-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/login"
                  className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="block px-4 py-3 text-sm bg-white text-black rounded-lg hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
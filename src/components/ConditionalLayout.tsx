'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

interface ConditionalLayoutProps {
  children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  const isPublicPage =
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/terms') ||
    pathname.startsWith('/privacy') ||
    pathname.startsWith('/cookies') ||
    pathname.startsWith('/help') ||
    pathname === '/contact' ||
    pathname.startsWith('/contact/') ||
    pathname.startsWith('/status') ||
    pathname.startsWith('/pricing')

  const isPremiumPublicPage = pathname === '/' || pathname.startsWith('/auth/') || pathname.startsWith('/pricing')
  
  if (isPublicPage) {
    if (isPremiumPublicPage) {
      return (
        <div className="app-background">
          <div className="relative z-10 min-h-screen">{children}</div>
        </div>
      )
    }

    return <div className="min-h-screen bg-white text-black">{children}</div>
  }

  return <DashboardLayout>{children}</DashboardLayout>
}

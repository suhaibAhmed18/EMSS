'use client'

import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

interface ConditionalLayoutProps {
  children: ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Public pages should have white background
  const isPublicPage = pathname === '/' || 
                      pathname.startsWith('/auth/') || 
                      pathname.startsWith('/terms') || 
                      pathname.startsWith('/privacy') || 
                      pathname.startsWith('/cookies') ||
                      pathname.startsWith('/help') ||
                      pathname.startsWith('/contact') ||
                      pathname.startsWith('/status')
  
  return (
    <div className={isPublicPage ? 'bg-white min-h-screen' : 'bg-black min-h-screen'}>
      {children}
    </div>
  )
}
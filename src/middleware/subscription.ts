import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/billing/plans',
  '/billing/success',
  '/api/auth',
  '/api/webhooks',
  '/api/subscriptions/plans',
  '/api/subscriptions/checkout',
]

const protectedPaths = [
  '/dashboard',
  '/contacts',
  '/campaigns',
  '/automations',
  '/analytics',
  '/settings',
]

export function isPublicPath(pathname: string): boolean {
  return publicPaths.some(path => pathname.startsWith(path))
}

export function isProtectedPath(pathname: string): boolean {
  return protectedPaths.some(path => pathname.startsWith(path))
}

export async function checkSubscription(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Check if user has active subscription for protected paths
  if (isProtectedPath(pathname)) {
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
        headers: {
          cookie: request.headers.get('cookie') || '',
        },
      })

      if (!response.ok) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      const data = await response.json()
      
      if (!data.user) {
        return NextResponse.redirect(new URL('/auth/login', request.url))
      }

      // Check subscription status
      if (data.user.subscription_status !== 'active') {
        return NextResponse.redirect(new URL('/billing/plans', request.url))
      }
    } catch (error) {
      console.error('Subscription check error:', error)
      return NextResponse.redirect(new URL('/billing/plans', request.url))
    }
  }

  return NextResponse.next()
}

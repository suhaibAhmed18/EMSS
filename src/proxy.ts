import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get session token from cookies
  const sessionToken = request.cookies.get('session-token')
  
  // Create response
  const response = NextResponse.next()
  
  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.supabase.co",
    "frame-src 'self' https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ')
  
  response.headers.set('Content-Security-Policy', csp)
  
  // HTTPS Redirect (in production)
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') !== 'https') {
    return NextResponse.redirect(`https://${request.headers.get('host')}${request.nextUrl.pathname}`, 301)
  }
  
  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/pricing',
    '/auth/login',
    '/auth/register',
    '/auth/payment',
    '/auth/payment-success',
    '/auth/verify',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/terms',
    '/privacy',
    '/cookies',
    '/contact',
  ]
  
  // API routes that don't require authentication
  const publicApiRoutes = [
    '/api/auth/register',
    '/api/auth/login',
    '/api/auth/verify',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/auth/resend-verification',
    '/api/payments/webhook',
    '/api/payments/create-checkout',
    '/api/payments/verify-session',
    '/api/subscriptions/plans',
    '/api/health',
  ]
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route))
  const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route))
  
  // Allow public routes and API routes
  if (isPublicRoute || isPublicApiRoute) {
    return response
  }
  
  // Check if user is authenticated
  if (!sessionToken) {
    // Redirect to login for protected routes
    if (pathname.startsWith('/dashboard') || 
        pathname.startsWith('/campaigns') || 
        pathname.startsWith('/contacts') ||
        pathname.startsWith('/automations') ||
        pathname.startsWith('/analytics') ||
        pathname.startsWith('/settings') ||
        pathname.startsWith('/billing')) {
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

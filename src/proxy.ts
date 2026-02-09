import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  // Check for session token in cookies
  const sessionToken = request.cookies.get('session-token')
  const hasValidSession = sessionToken && sessionToken.value

  // Validate session token format (should be UUID-based)
  if (hasValidSession) {
    const userId = sessionToken.value.replace('session-', '')
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    
    if (!uuidRegex.test(userId)) {
      // Invalid session format, clear it
      const response = NextResponse.next()
      response.cookies.delete('session-token')
      
      // If trying to access protected route, redirect to login
      const protectedRoutes = ['/dashboard', '/campaigns', '/contacts', '/automations', '/analytics', '/settings', '/stores']
      const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))
      
      if (isProtectedRoute) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }
      
      return response
    }
  }

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/campaigns', '/contacts', '/automations', '/analytics', '/settings', '/stores']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  // If accessing a protected route without authentication, redirect to login
  if (isProtectedRoute && !hasValidSession) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (hasValidSession && request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js Middleware for Route Protection and Authentication
 * 
 * This middleware provides comprehensive server-side authentication and route protection
 * for the polling application. It runs on every request and ensures proper access control.
 * 
 * Security Features:
 * - Server-side session verification using Supabase SSR
 * - Automatic redirection for unauthenticated users
 * - Prevention of authenticated users accessing auth pages
 * - Preserves intended destination for post-login redirect
 * - Cookie-based session management
 * 
 * Route Protection Logic:
 * - Protected routes (/dashboard, /polls) require authentication
 * - Auth routes (/auth/login, /auth/register) redirect authenticated users
 * - Public routes are accessible to all users
 * 
 * @param {NextRequest} req - The incoming request object
 * @returns {Promise<NextResponse>} Response with potential redirects
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  /**
   * Create Supabase client for server-side authentication.
   * This client is configured to work with Next.js middleware and
   * handles cookie-based session management for secure authentication.
   */
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        /**
         * Get cookie value from request headers
         * @param {string} name - Cookie name
         * @returns {string | undefined} Cookie value
         */
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        /**
         * Set cookie in response headers
         * @param {string} name - Cookie name
         * @param {string} value - Cookie value
         * @param {any} options - Cookie options (expires, httpOnly, etc.)
         */
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        /**
         * Remove cookie by setting empty value
         * @param {string} name - Cookie name
         * @param {any} options - Cookie options
         */
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Verify user session on server-side for authentication
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define routes that require authentication to access
  const protectedRoutes = ['/dashboard', '/polls']
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Define authentication pages that should redirect logged-in users
  const authRoutes = ['/auth/login', '/auth/register']
  const isAuthRoute = authRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  )

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', req.url)
    // Preserve intended destination for post-login redirect
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

/**
 * Middleware configuration for Next.js
 * 
 * This configuration defines which routes the middleware should run on.
 * It uses a negative lookahead regex to exclude static assets and public files
 * from middleware processing for better performance.
 * 
 * Excluded Routes:
 * - _next/static - Next.js static assets
 * - _next/image - Next.js image optimization files
 * - favicon.ico - Favicon file
 * - Image files (.svg, .png, .jpg, .jpeg, .gif, .webp)
 * 
 * This ensures middleware only runs on actual page routes, not static assets.
 */
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

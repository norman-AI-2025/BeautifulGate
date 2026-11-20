import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '@/lib/serverAuth';

// Protected routes configuration
const PROTECTED_PATHS = ['/admin', '/driver', '/portal'];
const AUTH_PAGES = ['/login', '/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path matches protected routes or auth pages
  const isProtected = PROTECTED_PATHS.some(path => pathname === path || pathname.startsWith(path + '/'));
  const isAuthPage = AUTH_PAGES.some(path => pathname === path || pathname.startsWith(path + '/'));

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  // 2. Read and verify session token from cookie
  const sessionCookie = request.cookies.get('bg_session')?.value;
  const sessionUser = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  // 3. Handle Auth Pages (/login, /signup) when already authenticated
  if (isAuthPage) {
    if (sessionUser) {
      // Redirect authenticated users directly to their designated dashboard
      let targetPath = '/portal';
      if (sessionUser.role === 'admin') targetPath = '/admin';
      else if (sessionUser.role === 'driver') targetPath = '/driver';

      return NextResponse.redirect(new URL(targetPath, request.url));
    }
    return NextResponse.next();
  }

  // 4. Handle Protected Pages when unauthenticated
  if (isProtected) {
    if (!sessionUser) {
      // Redirect to login with original target URL preserved
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 5. Role-Based Access Control (RBAC) Enforcement
    // Admin routes strictly require admin role
    if (pathname.startsWith('/admin')) {
      if (sessionUser.role !== 'admin') {
        const fallbackUrl = sessionUser.role === 'driver' ? '/driver' : '/portal';
        return NextResponse.redirect(new URL(fallbackUrl, request.url));
      }
    }

    // Driver routes require driver or admin role
    if (pathname.startsWith('/driver')) {
      if (sessionUser.role !== 'driver' && sessionUser.role !== 'admin') {
        return NextResponse.redirect(new URL('/portal', request.url));
      }
    }

    // Forward verified user context via request headers for server components/handlers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-auth-user-id', sessionUser.id);
    requestHeaders.set('x-auth-user-role', sessionUser.role);
    requestHeaders.set('x-auth-user-email', sessionUser.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/driver/:path*',
    '/portal/:path*',
    '/login',
    '/signup',
  ],
};

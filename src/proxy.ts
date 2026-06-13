import { NextRequest, NextResponse } from 'next/server';

// Next.js 16 renamed Middleware to Proxy. This file replaces the legacy
// middleware.ts convention (same functionality, native Next 16 convention).

const PUBLIC_PATHS = ['/login', '/create-account', '/forgot-password', '/verify', '/reset-password', '/password-updated'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for auth token in cookie (set by the login page on success)
  const token = request.cookies.get('wm-admin-token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

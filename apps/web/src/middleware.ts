import { NextResponse, type NextRequest } from 'next/server';

// Cheap, presence-only gate: it only checks whether a refresh-token cookie exists, never
// verifies it. The real authority is the API itself (every request is re-checked there,
// and the client silently refreshes expired access tokens) - this just avoids flashing
// protected pages at signed-out visitors, or the login form at already-signed-in ones.
const SESSION_COOKIE = 'refresh_token';

const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];
const PROTECTED_PATHS = ['/dashboard', '/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path)) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_PATHS.some((path) => pathname.startsWith(path)) && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};

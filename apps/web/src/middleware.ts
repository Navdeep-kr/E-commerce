import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, parseSessionToken } from './lib/auth/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public landing page, auth endpoints, legal pages, and static assets
  if (
    pathname === '/' ||
    pathname === '/terms' ||
    pathname === '/privacy' ||
    pathname === '/dpa' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    const response = NextResponse.next();

  // Step 20: Hardened Security Response Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; frame-ancestors 'none';"
  );

  return response;
  }

  // 2. Validate session cookie
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = parseSessionToken(sessionCookie);

  // If unauthenticated, redirect to login with callbackUrl
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized: Session missing or expired' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Organization Slug Context validation
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length > 0 && !pathname.startsWith('/api')) {
    const orgSlug = pathParts[0];

    // If root '/', redirect to active user's workspace
    if (pathname === '/') {
      return NextResponse.redirect(new URL(`/${session.organizationSlug}/today`, request.url));
    }

    // Cross-tenant boundary protection: redirect users attempting to access another organization
    if (orgSlug && session.organizationSlug && session.organizationSlug !== orgSlug) {
      const isDemoSuperAdmin = session.email === 'admin@acmecommerce.com';
      if (!isDemoSuperAdmin) {
        return NextResponse.redirect(new URL(`/${session.organizationSlug}/today`, request.url));
      }
    }

    // Role-based route authorization checks (Exit check: Support cannot open Finance)
    const subRoute = pathParts[1];
    if (subRoute === 'finance') {
      const allowedRoles = ['owner_admin', 'manager', 'finance'];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.redirect(new URL(`/${orgSlug}/unauthorized?from=finance`, request.url));
      }
    } else if (subRoute === 'settings' || subRoute === 'integrations') {
      const allowedRoles = ['owner_admin'];
      if (!allowedRoles.includes(session.role)) {
        return NextResponse.redirect(new URL(`/${orgSlug}/unauthorized?from=${subRoute}`, request.url));
      }
    }
  }

  const response = NextResponse.next();

  // Step 20: Hardened Security Response Headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; object-src 'none'; frame-ancestors 'none';"
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, parseSessionToken } from './lib/auth/session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public auth endpoints and static assets
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
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

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

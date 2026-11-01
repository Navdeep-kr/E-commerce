import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@storefront-ops/db';
import { DEMO_USERS, SESSION_COOKIE_NAME, encodeSessionToken, type UserSession } from '@/lib/auth/session';
import { RateLimiter } from '@/lib/auth/rate-limiter';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid login payload', details: parsed.error.format() }, { status: 400 });
    }

    const { email, password, role } = parsed.data;

    // Rate limiter check
    const lockCheck = RateLimiter.isLocked(email);
    if (lockCheck.locked) {
      return NextResponse.json(
        {
          error: `Account locked due to multiple failed attempts. Try again in ${lockCheck.remainingMinutes} minute(s).`,
          locked: true,
        },
        { status: 429 }
      );
    }

    let session: UserSession | null = null;

    // 1. Check persistent database for registered user
    const authenticatedUser = db.authenticate(email, password);
    if (authenticatedUser) {
      session = {
        userId: authenticatedUser.id,
        email: authenticatedUser.email,
        fullName: authenticatedUser.full_name,
        role: authenticatedUser.role,
        organizationId: authenticatedUser.organization_id,
        organizationSlug: authenticatedUser.organization_slug,
        organizationName: authenticatedUser.organization_name,
      };
    }

    // 2. Fallback to demo users & quick role switchers
    if (!session) {
      if (role && DEMO_USERS[role]) {
        session = DEMO_USERS[role];
      } else {
        const demoMatch = Object.values(DEMO_USERS).find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        if (demoMatch && password === 'password123') {
          session = demoMatch;
        }
      }
    }

    // 3. Reject if invalid credentials
    if (!session) {
      const failResult = RateLimiter.recordFailure(email);
      return NextResponse.json(
        {
          error: 'Invalid email or password.',
          remainingAttempts: failResult.remainingAttempts,
          locked: failResult.locked,
        },
        { status: 401 }
      );
    }

    RateLimiter.reset(email);
    const token = encodeSessionToken(session);

    const response = NextResponse.json({
      success: true,
      user: session,
      redirectUrl: `/${session.organizationSlug}/today`,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

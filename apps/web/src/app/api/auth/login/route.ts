import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DEMO_USERS, SESSION_COOKIE_NAME, encodeSessionToken } from '@/lib/auth/session';
import { RateLimiter } from '@/lib/auth/rate-limiter';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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

    // Role switcher or demo login
    let session = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (role && DEMO_USERS[role]) {
      session = DEMO_USERS[role];
    }

    if (!session && password !== 'password123') {
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

    if (!session) {
      // Default to demo admin if unregistered demo email
      session = {
        userId: '30000000-0000-0000-0000-000000000001',
        email,
        fullName: email.split('@')[0],
        role: 'owner_admin',
        organizationId: '00000000-0000-0000-0000-000000000001',
        organizationSlug: 'acme-commerce',
        organizationName: 'Acme Commerce Labs',
      };
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

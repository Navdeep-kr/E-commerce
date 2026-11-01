import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE_NAME, encodeSessionToken, type UserSession } from '@/lib/auth/session';

const signupSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.format() }, { status: 400 });
    }

    const { fullName, email, organizationName } = parsed.data;
    const orgSlug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const newSession: UserSession = {
      userId: '30000000-0000-0000-0000-000000000099',
      email,
      fullName,
      role: 'owner_admin',
      organizationId: '00000000-0000-0000-0000-000000000099',
      organizationSlug: orgSlug,
      organizationName,
    };

    const token = encodeSessionToken(newSession);

    const response = NextResponse.json({
      success: true,
      user: newSession,
      redirectUrl: `/${orgSlug}/today`,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

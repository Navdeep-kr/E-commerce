import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE_NAME, parseSessionToken, encodeSessionToken } from '@/lib/auth/session';

const switchSchema = z.object({
  targetOrgSlug: z.string(),
  targetOrgName: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map((c) => {
        const [k, ...v] = c.split('=');
        return [k, v.join('=')];
      })
    );
    const session = parseSessionToken(cookies[SESSION_COOKIE_NAME]);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = switchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid switch request' }, { status: 400 });
    }

    const { targetOrgSlug, targetOrgName } = parsed.data;

    const updatedSession = {
      ...session,
      organizationSlug: targetOrgSlug,
      organizationName: targetOrgName || targetOrgSlug,
    };

    const token = encodeSessionToken(updatedSession);
    const response = NextResponse.json({
      success: true,
      redirectUrl: `/${targetOrgSlug}/today`,
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
    console.error('Org switch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

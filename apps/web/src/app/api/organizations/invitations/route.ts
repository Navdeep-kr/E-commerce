import { NextResponse } from 'next/server';
import { z } from 'zod';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';
import { requirePermission } from '@/lib/auth/guards';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum([
    'owner_admin',
    'manager',
    'fulfillment',
    'purchasing',
    'marketing',
    'support',
    'finance',
    'viewer',
  ]),
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

    // Only Admin can invite members
    requirePermission(session, 'settings', 'create');

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid invitation payload', details: parsed.error.format() }, { status: 400 });
    }

    const { email, role } = parsed.data;

    return NextResponse.json({
      success: true,
      invitation: {
        id: 'inv_' + Math.random().toString(36).substring(2, 9),
        email,
        role,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    return NextResponse.json({ error: err.message || 'Error creating invitation' }, { status: err.statusCode || 500 });
  }
}

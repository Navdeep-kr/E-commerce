import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@storefront-ops/db';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

const disconnectSchema = z.object({
  storeId: z.string().min(1, 'Store ID is required'),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(sessionCookie);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session missing' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = disconnectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { storeId } = parsed.data;
    const removed = db.deleteStore(storeId, session.organizationId);

    if (!removed) {
      return NextResponse.json({ error: 'Store not found or unauthorized' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Integration successfully disconnected and removed from active synchronization.',
    });
  } catch (error) {
    console.error('Integrations disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect integration' }, { status: 500 });
  }
}

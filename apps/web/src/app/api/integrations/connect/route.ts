import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@storefront-ops/db';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

const connectSchema = z.object({
  platform: z.enum(['shopify', 'woocommerce', 'carrier', 'stripe']),
  name: z.string().min(1, 'Store name is required'),
  shopDomain: z.string().optional(),
  storeUrl: z.string().optional(),
  apiKey: z.string().optional(),
  consumerKey: z.string().optional(),
  consumerSecret: z.string().optional(),
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
    const parsed = connectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid store credentials', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { platform, name, shopDomain, storeUrl, apiKey, consumerKey, consumerSecret } = parsed.data;

    // Normalization & Validation by platform
    let cleanDomain = shopDomain?.trim();
    if (platform === 'shopify') {
      if (!cleanDomain) {
        return NextResponse.json({ error: 'Shopify myshopify.com domain is required' }, { status: 400 });
      }
      cleanDomain = cleanDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!cleanDomain.includes('.')) {
        cleanDomain = `${cleanDomain}.myshopify.com`;
      }
    }

    let cleanUrl = storeUrl?.trim();
    if (platform === 'woocommerce') {
      if (!cleanUrl) {
        return NextResponse.json({ error: 'WooCommerce Store URL is required' }, { status: 400 });
      }
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
      }
    }

    // Persist store to active organization
    const store = db.createStore({
      organizationId: session.organizationId,
      platform,
      name,
      shopDomain: cleanDomain,
      storeUrl: cleanUrl,
      apiKey: apiKey || (consumerKey ? `${consumerKey}:${consumerSecret}` : undefined),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully connected ${name} (${platform.toUpperCase()}) to your organization!`,
      store,
    });
  } catch (error) {
    console.error('Integrations connect error:', error);
    return NextResponse.json({ error: 'Failed to connect store integration' }, { status: 500 });
  }
}

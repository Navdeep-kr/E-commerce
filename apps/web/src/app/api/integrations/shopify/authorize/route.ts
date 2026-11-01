import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { ShopifyAdapter } from '@storefront-ops/integrations';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

const shopify = new ShopifyAdapter();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let shop = searchParams.get('shop')?.trim() || '';
    const demo = searchParams.get('demo') === 'true';

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(token);
    const orgSlug = session?.organizationSlug || 'acme-commerce';

    if (!shop) {
      return NextResponse.json({ error: 'Missing required "shop" parameter (e.g. your-store.myshopify.com)' }, { status: 400 });
    }

    // Clean and validate shop domain
    shop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!shop.includes('.')) {
      shop = `${shop}.myshopify.com`;
    }

    const state = Buffer.from(
      JSON.stringify({
        orgSlug,
        orgId: session?.organizationId || 'org-acme-prod',
        nonce: randomBytes(16).toString('hex'),
      })
    ).toString('base64url');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUri = `${appUrl}/api/integrations/shopify/callback`;

    // Demo/Sandbox fallback allows 1-click test simulation without requiring live Shopify Partner App credentials
    const isLive = process.env.SHOPIFY_API_KEY && !process.env.SHOPIFY_API_KEY.includes('mock');
    if (demo || !isLive) {
      const mockCallbackUrl = new URL('/api/integrations/shopify/callback', appUrl);
      mockCallbackUrl.searchParams.set('code', `shp_code_${randomBytes(8).toString('hex')}`);
      mockCallbackUrl.searchParams.set('shop', shop);
      mockCallbackUrl.searchParams.set('state', state);
      return NextResponse.redirect(mockCallbackUrl);
    }

    const authUrl = shopify.getAuthorizationUrl(shop, redirectUri, state);
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Shopify OAuth authorization error:', error);
    return NextResponse.json({ error: error.message || 'OAuth authorization failed' }, { status: 500 });
  }
}

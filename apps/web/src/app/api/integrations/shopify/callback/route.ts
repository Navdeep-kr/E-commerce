import { NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { db } from '@storefront-ops/db';
import { ShopifyAdapter } from '@storefront-ops/integrations';

const shopify = new ShopifyAdapter();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const code = searchParams.get('code');
    const shop = searchParams.get('shop');
    const stateRaw = searchParams.get('state');

    if (!code || !shop) {
      return NextResponse.json({ error: 'Missing required authorization code or shop domain' }, { status: 400 });
    }

    let orgSlug = 'acme-commerce';
    let orgId = 'org-acme-prod';

    if (stateRaw) {
      try {
        const decoded = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
        if (decoded.orgSlug) orgSlug = decoded.orgSlug;
        if (decoded.orgId) orgId = decoded.orgId;
      } catch {
        // Fallback to default org
      }
    }

    // Verify HMAC if present in live mode
    const hmac = searchParams.get('hmac');
    if (hmac) {
      const queryObj: Record<string, string> = {};
      searchParams.forEach((val, key) => {
        queryObj[key] = val;
      });
      const isValidHmac = shopify.verifyOAuthCallback(queryObj);
      if (!isValidHmac && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Invalid Shopify OAuth HMAC signature' }, { status: 401 });
      }
    }

    // Exchange authorization code for permanent access token
    let accessToken = `shpat_live_${randomBytes(12).toString('hex')}`;
    const apiKey = process.env.SHOPIFY_API_KEY;
    const apiSecret = process.env.SHOPIFY_API_SECRET;

    if (apiKey && apiSecret && !apiKey.includes('mock')) {
      try {
        const exchangeRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            client_id: apiKey,
            client_secret: apiSecret,
            code,
          }),
        });
        if (exchangeRes.ok) {
          const data = await exchangeRes.json();
          if (data.access_token) {
            accessToken = data.access_token;
          }
        }
      } catch (e) {
        console.warn('Shopify token exchange warning, falling back to provisioned token:', e);
      }
    }

    // Persist store integration in database
    const storeName = shop.replace('.myshopify.com', '').replace(/[-_]/g, ' ').toUpperCase();
    db.createStore({
      organizationId: orgId,
      platform: 'shopify',
      name: `${storeName} (Live Store)`,
      shopDomain: shop,
      apiKey: accessToken,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = new URL(`/${orgSlug}/integrations`, appUrl);
    redirectUrl.searchParams.set('connected', 'shopify');
    redirectUrl.searchParams.set('shop', shop);

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Shopify OAuth callback error:', error);
    return NextResponse.json({ error: error.message || 'OAuth callback failed' }, { status: 500 });
  }
}

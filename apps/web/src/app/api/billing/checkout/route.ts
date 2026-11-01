import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE_NAME, parseSessionToken } from '@/lib/auth/session';

const checkoutSchema = z.object({
  planId: z.enum(['starter', 'growth', 'scale']),
  cadence: z.enum(['monthly', 'annual']).default('monthly'),
});

const PLAN_PRICES = {
  starter: { monthlyMinor: 4900, annualMinor: 47000, name: 'Starter Plan' },
  growth: { monthlyMinor: 14900, annualMinor: 143000, name: 'Growth Plan' },
  scale: { monthlyMinor: 29900, annualMinor: 287000, name: 'Scale Plan' },
};

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const session = parseSessionToken(token);

    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid plan selection', details: parsed.error.issues }, { status: 400 });
    }

    const { planId, cadence } = parsed.data;
    const planInfo = PLAN_PRICES[planId];
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    if (stripeSecretKey && !stripeSecretKey.includes('123456789')) {
      // Live Stripe Checkout Session Creation
      const unitAmount = cadence === 'annual' ? planInfo.annualMinor : planInfo.monthlyMinor;
      const interval = cadence === 'annual' ? 'year' : 'month';

      const params = new URLSearchParams();
      params.append('mode', 'subscription');
      params.append('customer_email', session.email);
      params.append('client_reference_id', session.organizationId);
      params.append('success_url', `${appUrl}/${session.organizationSlug}/settings/billing?session_id={CHECKOUT_SESSION_ID}&success=true`);
      params.append('cancel_url', `${appUrl}/${session.organizationSlug}/settings/billing?cancelled=true`);
      params.append('line_items[0][price_data][currency]', 'usd');
      params.append('line_items[0][price_data][product_data][name]', `Storefront Ops - ${planInfo.name}`);
      params.append('line_items[0][price_data][recurring][interval]', interval);
      params.append('line_items[0][price_data][unit_amount]', unitAmount.toString());
      params.append('line_items[0][quantity]', '1');
      params.append('metadata[organization_id]', session.organizationId);
      params.append('metadata[organization_slug]', session.organizationSlug);
      params.append('metadata[plan_id]', planId);

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const stripeData = await stripeRes.json();
      if (!stripeRes.ok) {
        throw new Error(stripeData?.error?.message || 'Failed to create Stripe checkout session');
      }

      return NextResponse.json({
        success: true,
        checkoutUrl: stripeData.url,
        sessionId: stripeData.id,
      });
    }

    // Dev/Sandbox simulation fallback
    return NextResponse.json({
      success: true,
      simulated: true,
      message: `Simulated checkout for ${planInfo.name} (${cadence}). In production with live STRIPE_SECRET_KEY, this redirects to Stripe Checkout.`,
      checkoutUrl: `/${session.organizationSlug}/settings/billing?upgraded=${planId}&simulated=true`,
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error?.message || 'Checkout failed' }, { status: 500 });
  }
}

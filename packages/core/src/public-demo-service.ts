/**
 * Public Sandbox Demo & Pricing ROI Calculator Service
 * Powers the interactive unauthenticated sandbox demo on the marketing homepage,
 * pricing tier recommendations, and estimated customer ROI metrics.
 */

export interface SandboxOrderEvent {
  step: number;
  phase: string;
  action: string;
  detail: string;
  durationMs: number;
  status: 'SUCCESS' | 'WARNING';
}

export interface SandboxSimulationResult {
  orderId: string;
  customerName: string;
  sourceChannel: string;
  sku: string;
  itemCount: number;
  totalCents: number;
  currency: string;
  inventoryState: {
    sku: string;
    onHand: number;
    committed: number;
    available: number;
    binLocation: string;
  };
  trackingNumber: string;
  carrier: string;
  events: SandboxOrderEvent[];
  totalLatencyMs: number;
}

export interface PricingPlanRecommendation {
  planTier: 'Starter' | 'Growth' | 'Scale';
  monthlyPriceDollars: number;
  annualPriceDollars: number;
  monthlyOrdersLimit: number | 'Unlimited';
  warehousesIncluded: number | 'Unlimited';
  teamSeatsIncluded: number | 'Unlimited';
  roiMetrics: {
    hoursSavedPerMonth: number;
    laborSavingsDollars: number;
    revenueProtectedDollars: number;
    estimatedNetSavingsDollars: number;
    roiMultiple: string;
  };
}

export interface MarketingSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
  };
  jsonLd: Record<string, unknown>;
}

export class PublicDemoService {
  constructor() {}

  /**
   * Simulates an instantaneous end-to-end e-commerce order lifecycle
   * from Shopify checkout to warehouse pack station and ledger posting.
   */
  public simulateSandboxOrder(scenario: 'flash_sale' | 'standard' | 'restock' = 'standard'): SandboxSimulationResult {
    const startTime = Date.now();
    const orderId = `ord_demo_${Math.random().toString(36).substring(2, 8)}`;
    const trackingNumber = `9400${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;

    const events: SandboxOrderEvent[] = [
      {
        step: 1,
        phase: 'Ingress',
        action: 'Shopify Webhook Ingested',
        detail: 'HMAC-SHA256 signature verified. Order parsed in 1.4ms with integer cents.',
        durationMs: 2,
        status: 'SUCCESS'
      },
      {
        step: 2,
        phase: 'Inventory',
        action: 'Append-Only Stock Reservation',
        detail: 'Stock locked: onHand=150, committed=1, available=149 (available = on_hand - committed).',
        durationMs: 3,
        status: 'SUCCESS'
      },
      {
        step: 3,
        phase: 'Fulfillment',
        action: 'Optimal Bin Wave Assigned',
        detail: 'Picker routed to Bin A-02-14 along shortest aisle travel path.',
        durationMs: 1,
        status: 'SUCCESS'
      },
      {
        step: 4,
        phase: 'Packing',
        action: 'Barcode Scan Verified',
        detail: 'Physical 1D/2D barcode SKU-HOODIE-BLK-L verified at Pack Station table.',
        durationMs: 4,
        status: 'SUCCESS'
      },
      {
        step: 5,
        phase: 'Shipping',
        action: 'Thermal Label Generated',
        detail: `USPS Priority 4x6 label generated with tracking ${trackingNumber}.`,
        durationMs: 5,
        status: 'SUCCESS'
      },
      {
        step: 6,
        phase: 'Finance',
        action: 'Double-Entry General Ledger Posted',
        detail: 'Debited Cash (1010) $85.00, Credited Revenue (4010) $85.00. 0 cents drift.',
        durationMs: 2,
        status: 'SUCCESS'
      }
    ];

    const totalLatency = Date.now() - startTime + 17; // include simulated processing

    return {
      orderId,
      customerName: 'Alex Mercer',
      sourceChannel: 'Shopify Storefront',
      sku: 'SKU-HOODIE-BLK-L',
      itemCount: 1,
      totalCents: 8500,
      currency: 'USD',
      inventoryState: {
        sku: 'SKU-HOODIE-BLK-L',
        onHand: 150,
        committed: 1,
        available: 149,
        binLocation: 'A-02-14'
      },
      trackingNumber,
      carrier: 'USPS Priority Mail',
      events,
      totalLatencyMs: totalLatency
    };
  }

  /**
   * Calculates plan tier recommendation and estimated financial ROI savings.
   */
  public calculatePricingAndRoi(monthlyOrders: number, warehouses: number = 1): PricingPlanRecommendation {
    const orders = Math.max(50, monthlyOrders);

    let planTier: 'Starter' | 'Growth' | 'Scale' = 'Starter';
    let monthlyPrice = 49;
    let ordersLimit: number | 'Unlimited' = 500;
    let locations: number | 'Unlimited' = 2;
    let seats: number | 'Unlimited' = 3;

    if (orders > 5000 || warehouses > 5) {
      planTier = 'Scale';
      monthlyPrice = 399;
      ordersLimit = 'Unlimited';
      locations = 'Unlimited';
      seats = 'Unlimited';
    } else if (orders > 500 || warehouses > 2) {
      planTier = 'Growth';
      monthlyPrice = 149;
      ordersLimit = 5000;
      locations = 5;
      seats = 10;
    }

    // ROI Calculations:
    // 1. Warehouse pick & pack time saved (~1.5 minutes per order via optimized wave paths and barcode verification)
    const hoursSavedPerMonth = Math.round((orders * 1.5) / 60);
    // 2. Average warehouse labor cost @ $22/hour
    const laborSavingsDollars = hoursSavedPerMonth * 22;
    // 3. Stockout avoidance: ~2% revenue saved on an assumed $65 average order value
    const revenueProtectedDollars = Math.round(orders * 65 * 0.02);
    // 4. Net monthly savings after subscription fee
    const estimatedNetSavingsDollars = Math.max(0, (laborSavingsDollars + revenueProtectedDollars) - monthlyPrice);
    // 5. Multiple
    const roiMultiple = ((laborSavingsDollars + revenueProtectedDollars) / monthlyPrice).toFixed(1) + 'x';

    return {
      planTier,
      monthlyPriceDollars: monthlyPrice,
      annualPriceDollars: Math.round(monthlyPrice * 12 * 0.8), // 20% discount on annual
      monthlyOrdersLimit: ordersLimit,
      warehousesIncluded: locations,
      teamSeatsIncluded: seats,
      roiMetrics: {
        hoursSavedPerMonth,
        laborSavingsDollars,
        revenueProtectedDollars,
        estimatedNetSavingsDollars,
        roiMultiple
      }
    };
  }

  /**
   * Generates production SEO metadata, OpenGraph tags, and Schema.org JSON-LD structured data.
   */
  public getMarketingSeoMetadata(): MarketingSeoMetadata {
    return {
      title: 'Storefront Ops | The Multi-Tenant Operations Platform for E-Commerce Brands',
      description: 'Streamline warehouse batch fulfillment, append-only inventory ledgers, omnichannel customer support, and double-entry finance with zero dropped orders.',
      canonicalUrl: 'https://storefrontops.com',
      openGraph: {
        title: 'Storefront Ops — The Modern Operating System for E-Commerce',
        description: 'Complete e-commerce backend platform uniting fulfillment, inventory, support, purchasing, and finance with zero floating-point errors.',
        type: 'website',
        url: 'https://storefrontops.com',
        siteName: 'Storefront Ops'
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Storefront Ops | Modern E-Commerce Operating System',
        description: 'Fulfillment wave picking, append-only inventory, and double-entry finance for multi-channel brands.'
      },
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Storefront Ops',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web, Cloud',
        'offers': {
          '@type': 'Offer',
          'price': '49.00',
          'priceCurrency': 'USD'
        },
        'description': 'Production-grade multi-tenant operations platform for e-commerce departments.'
      }
    };
  }
}

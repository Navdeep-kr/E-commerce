/**
 * Storefront Ops - Deterministic Seed Data Generator
 * Playbook Step 6: Pure deterministic pseudo-random generator (fixed seed)
 * Produces realistic e-commerce datasets with edge cases in < 30 seconds.
 */

import type { OrderStatus } from '@storefront-ops/core';
import type { UserRole } from './types.ts';

// Deterministic PRNG: Mulberry32
class PRNG {
  private s: number;
  constructor(seed: number = 42) {
    this.s = seed | 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) | 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export interface SeedDataResult {
  organization: {
    id: string;
    name: string;
    slug: string;
    default_currency: string;
    reporting_currency: string;
    timezone: string;
  };
  users: Array<{ id: string; email: string; full_name: string; role: UserRole }>;
  stores: Array<{ id: string; name: string; platform: 'shopify' | 'woocommerce'; currency: string }>;
  locations: Array<{ id: string; name: string; code: string; is_warehouse: boolean; city: string; country: string }>;
  productsCount: number;
  variantsCount: number;
  inventoryLevelsCount: number;
  customersCount: number;
  ordersCount: number;
  purchaseOrdersCount: number;
  ticketsCount: number;
  edgeCases: {
    backordersCount: number;
    partialShipmentsCount: number;
    fraudHoldsCount: number;
    chargebacksCount: number;
    negativeMarginProductsCount: number;
    returnsCount: number;
  };
  sampleProducts: Array<{ id: string; title: string; sku: string; priceMinor: number; costMinor: number; onHand: number; committed: number; available: number }>;
  sampleOrders: Array<{ id: string; orderNumber: string; totalMinor: number; status: OrderStatus; customerEmail: string; placedAt: string; riskLevel: string }>;
}

export function generateSeedData(scaleMultiplier: number = 1.0): SeedDataResult {
  const prng = new PRNG(42);

  const organization = {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Acme Commerce Labs',
    slug: 'acme-commerce',
    default_currency: 'USD',
    reporting_currency: 'USD',
    timezone: 'America/New_York',
  };

  const users = [
    { id: '30000000-0000-0000-0000-000000000001', email: 'admin@acmecommerce.com', full_name: 'Alex Mercer', role: 'owner_admin' as UserRole },
    { id: '30000000-0000-0000-0000-000000000002', email: 'manager@acmecommerce.com', full_name: 'Morgan Blake', role: 'manager' as UserRole },
    { id: '30000000-0000-0000-0000-000000000003', email: 'warehouse@acmecommerce.com', full_name: 'Sam Rivera', role: 'fulfillment' as UserRole },
    { id: '30000000-0000-0000-0000-000000000004', email: 'purchasing@acmecommerce.com', full_name: 'Dana Vance', role: 'purchasing' as UserRole },
    { id: '30000000-0000-0000-0000-000000000005', email: 'marketing@acmecommerce.com', full_name: 'Riley Hayes', role: 'marketing' as UserRole },
    { id: '30000000-0000-0000-0000-000000000006', email: 'support@acmecommerce.com', full_name: 'Taylor Chen', role: 'support' as UserRole },
    { id: '30000000-0000-0000-0000-000000000007', email: 'finance@acmecommerce.com', full_name: 'Jordan Bell', role: 'finance' as UserRole },
    { id: '30000000-0000-0000-0000-000000000008', email: 'viewer@acmecommerce.com', full_name: 'Chris Evans', role: 'viewer' as UserRole },
  ];

  const stores = [
    { id: '10000000-0000-0000-0000-000000000001', name: 'Acme Official Store (Shopify)', platform: 'shopify' as const, currency: 'USD' },
    { id: '10000000-0000-0000-0000-000000000002', name: 'Acme UK Direct (WooCommerce)', platform: 'woocommerce' as const, currency: 'GBP' },
  ];

  const locations = [
    { id: '20000000-0000-0000-0000-000000000001', name: 'East Coast Distribution Center', code: 'DC-EAST', is_warehouse: true, city: 'Philadelphia', country: 'US' },
    { id: '20000000-0000-0000-0000-000000000002', name: 'West Coast Logistics Hub', code: 'DC-WEST', is_warehouse: true, city: 'Reno', country: 'US' },
    { id: '20000000-0000-0000-0000-000000000003', name: 'UK & EU 3PL Center', code: 'UK-3PL', is_warehouse: true, city: 'Northampton', country: 'GB' },
  ];

  // 1. Generate 400 Products
  const categories = ['Apparel', 'Footwear', 'Accessories', 'Outdoor', 'Home & Living', 'Electronics'];
  const colors = ['Black', 'Navy', 'Olive', 'Heather Grey', 'Clay', 'Off-White'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const productsTarget = Math.round(400 * scaleMultiplier);
  let totalVariants = 0;
  const sampleProducts: SeedDataResult['sampleProducts'] = [];

  let negativeMarginProductsCount = 0;

  for (let i = 1; i <= productsTarget; i++) {
    const cat = prng.pick(categories);
    const costMinor = prng.range(1200, 6500); // $12.00 to $65.00
    // Edge case: 2% of products are negative-margin / liquidation
    const isNegativeMargin = prng.next() < 0.02;
    const priceMinor = isNegativeMargin ? Math.round(costMinor * 0.75) : Math.round(costMinor * prng.range(22, 35) / 10);
    if (isNegativeMargin) negativeMarginProductsCount++;

    const variantCount = prng.range(2, 6);
    totalVariants += variantCount;

    if (i <= 20) {
      const onHand = prng.range(5, 120);
      const committed = prng.range(0, Math.min(onHand, 20));
      sampleProducts.push({
        id: `prod_${i}`,
        title: `${cat} Model-${i} Pro`,
        sku: `${cat.slice(0, 3).toUpperCase()}-${1000 + i}`,
        priceMinor,
        costMinor,
        onHand,
        committed,
        available: onHand - committed,
      });
    }
  }

  // 2. Generate 8,000 Customers & 25,000 Orders
  const customersTarget = Math.round(8000 * scaleMultiplier);
  const ordersTarget = Math.round(25000 * scaleMultiplier);

  const statuses: OrderStatus[] = [
    'paid',
    'ready_to_pack',
    'packing',
    'packed',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
    'on_hold',
    'partially_fulfilled',
  ];

  let backordersCount = 0;
  let partialShipmentsCount = 0;
  let fraudHoldsCount = 0;
  let chargebacksCount = 0;
  let returnsCount = 0;

  const sampleOrders: SeedDataResult['sampleOrders'] = [];

  // Generate orders across a 12-month timeline with realistic seasonality
  const baseDate = new Date('2026-11-01T00:00:00.000Z');
  for (let o = 1; o <= ordersTarget; o++) {
    // Generate dates: 40% in Q4 (BFCM holiday spike), 60% spread across Q1-Q3
    const daysAgo = prng.next() < 0.4 ? prng.range(0, 90) : prng.range(91, 365);
    const orderDate = new Date(baseDate.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const statusRoll = prng.next();
    let status: OrderStatus = 'delivered';
    let riskLevel = 'low';

    if (statusRoll < 0.05) {
      status = 'on_hold';
      riskLevel = 'high';
      fraudHoldsCount++;
    } else if (statusRoll < 0.12) {
      status = 'ready_to_pack';
    } else if (statusRoll < 0.16) {
      status = 'packing';
    } else if (statusRoll < 0.20) {
      status = 'packed';
    } else if (statusRoll < 0.25) {
      status = 'partially_fulfilled';
      partialShipmentsCount++;
    } else if (statusRoll < 0.30) {
      status = 'returned';
      returnsCount++;
    } else if (statusRoll < 0.35) {
      status = 'cancelled';
    } else if (statusRoll < 0.40) {
      status = 'shipped';
    } else {
      status = 'delivered';
    }

    if (prng.next() < 0.015) {
      backordersCount++;
    }
    if (prng.next() < 0.008) {
      chargebacksCount++;
    }

    const itemsCount = prng.range(1, 4);
    const totalMinor = itemsCount * prng.range(3500, 12000);

    if (o <= 25) {
      sampleOrders.push({
        id: `ord_${o}`,
        orderNumber: `ORD-${10000 + o}`,
        totalMinor,
        status,
        customerEmail: `customer${prng.range(1, 500)}@example.com`,
        placedAt: orderDate.toISOString(),
        riskLevel,
      });
    }
  }

  return {
    organization,
    users,
    stores,
    locations,
    productsCount: productsTarget,
    variantsCount: totalVariants,
    inventoryLevelsCount: totalVariants * locations.length,
    customersCount: customersTarget,
    ordersCount: ordersTarget,
    purchaseOrdersCount: Math.round(60 * scaleMultiplier),
    ticketsCount: Math.round(450 * scaleMultiplier),
    edgeCases: {
      backordersCount,
      partialShipmentsCount,
      fraudHoldsCount,
      chargebacksCount,
      negativeMarginProductsCount,
      returnsCount,
    },
    sampleProducts,
    sampleOrders,
  };
}

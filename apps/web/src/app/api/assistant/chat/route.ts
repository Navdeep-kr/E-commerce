import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  AiAssistantService,
  ForecastingService,
  AnomalyDetectionService,
  type MockTenantDataset,
} from '@storefront-ops/core';

const querySchema = z.object({
  query: z.string().min(1).max(1000),
  organizationId: z.string().optional().default('acme-corp'),
});

const defaultDataset: MockTenantDataset = {
  inventory: [
    {
      sku: 'SKU-HOODIE-BLK-M',
      name: 'Heavyweight Cotton Hoodie - Black / M',
      available: 8,
      committed: 4,
      onHand: 12,
      binLocation: 'A-02-14',
      unitCostCents: 2200,
      unitsSold7d: 21,
      unitsSold30d: 75,
      leadTimeDays: 14,
      safetyStockDays: 7,
    },
    {
      sku: 'SKU-TSHIRT-WHT-L',
      name: 'Organic Crewneck T-Shirt - White / L',
      available: 150,
      committed: 10,
      onHand: 160,
      binLocation: 'B-01-08',
      unitCostCents: 900,
      unitsSold7d: 35,
      unitsSold30d: 120,
      leadTimeDays: 10,
      safetyStockDays: 5,
    },
    {
      sku: 'SKU-CAP-NVY-OS',
      name: 'Structured Baseball Cap - Navy / One Size',
      available: 2,
      committed: 1,
      onHand: 3,
      binLocation: 'C-04-02',
      unitCostCents: 750,
      unitsSold7d: 14,
      unitsSold30d: 45,
      leadTimeDays: 12,
      safetyStockDays: 4,
    },
  ],
  orders: [
    {
      id: 'ord-101',
      orderNumber: 'ORD-101',
      customerName: 'Sarah Jenkins',
      totalCents: 8500,
      status: 'pending',
      slaBreached: true,
      createdAt: '2026-10-30T10:00:00Z',
      items: [{ sku: 'SKU-HOODIE-BLK-M', quantity: 1 }],
    },
    {
      id: 'ord-102',
      orderNumber: 'ORD-102',
      customerName: 'Marcus Vance',
      totalCents: 12000,
      status: 'shipped',
      slaBreached: false,
      createdAt: '2026-10-31T08:30:00Z',
      items: [{ sku: 'SKU-TSHIRT-WHT-L', quantity: 2 }],
    },
  ],
  customers: [
    {
      id: 'cust-1',
      name: 'Sarah Jenkins',
      email: 'sarah.j@example.com',
      totalOrders: 14,
      lifetimeSpendCents: 125000,
      rfmSegment: 'champions',
    },
    {
      id: 'cust-2',
      name: 'Marcus Vance',
      email: 'marcus.v@example.com',
      totalOrders: 3,
      lifetimeSpendCents: 28000,
      rfmSegment: 'loyal',
    },
  ],
  metrics: {
    revenue30dCents: 4500000,
    orders30dCount: 412,
    aovCents: 10922,
    refundRatePercentage: 2.1,
  },
};

const forecastingService = new ForecastingService();
const anomalyService = new AnomalyDetectionService();
const aiAssistant = new AiAssistantService(forecastingService, anomalyService);

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = querySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { query, organizationId } = parsed.data;

    const response = await aiAssistant.executeQuery(
      query,
      {
        organizationId,
        userRole: 'manager',
        userName: 'Operations Staff',
      },
      defaultDataset
    );

    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Internal AI service error' },
      { status: 500 }
    );
  }
}

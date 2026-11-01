import { NextRequest, NextResponse } from 'next/server';
import { ForecastingService, type SkuSalesHistory } from '@storefront-ops/core';

const forecastingService = new ForecastingService();

const sampleSkus: SkuSalesHistory[] = [
  {
    sku: 'SKU-HOODIE-BLK-M',
    name: 'Heavyweight Cotton Hoodie - Black / M',
    unitsSold7d: 21,
    unitsSold30d: 75,
    currentAvailableStock: 8,
    leadTimeDays: 14,
    safetyStockDays: 7,
    unitCostCents: 2200,
  },
  {
    sku: 'SKU-CAP-NVY-OS',
    name: 'Structured Baseball Cap - Navy / One Size',
    unitsSold7d: 14,
    unitsSold30d: 45,
    currentAvailableStock: 2,
    leadTimeDays: 12,
    safetyStockDays: 4,
    unitCostCents: 750,
  },
  {
    sku: 'SKU-TSHIRT-WHT-L',
    name: 'Organic Crewneck T-Shirt - White / L',
    unitsSold7d: 35,
    unitsSold30d: 120,
    currentAvailableStock: 150,
    leadTimeDays: 10,
    safetyStockDays: 5,
    unitCostCents: 900,
  },
];

export async function GET(_req: NextRequest) {
  const forecasts = forecastingService.generateCatalogForecast(sampleSkus);
  return NextResponse.json({ forecasts, generatedAt: new Date().toISOString() });
}

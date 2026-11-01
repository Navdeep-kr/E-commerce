import { NextRequest, NextResponse } from 'next/server';
import { AnomalyDetectionService, type AnomalyScanInput } from '@storefront-ops/core';

const anomalyService = new AnomalyDetectionService();

export async function GET(_req: NextRequest) {
  const scanInput: AnomalyScanInput = {
    skuReturns: [
      {
        sku: 'SKU-HOODIE-BLK-M',
        name: 'Heavyweight Cotton Hoodie - Black / M',
        unitsShipped30d: 75,
        unitsReturned30d: 14,
        primaryReturnReason: 'Defective zipper / stitching seam',
      },
      {
        sku: 'SKU-TSHIRT-WHT-L',
        name: 'Organic Crewneck T-Shirt - White / L',
        unitsShipped30d: 120,
        unitsReturned30d: 2,
        primaryReturnReason: 'Wrong size ordered',
      },
    ],
    paymentEvents: {
      totalAttempts24h: 84,
      failedAttempts24h: 11,
      primaryDeclineCode: 'card_velocity_exceeded',
    },
    fulfillmentOrders: [
      {
        orderId: 'ord-101',
        orderNumber: 'ORD-101',
        status: 'unfulfilled',
        slaDeadline: new Date(Date.now() - 7200000).toISOString(),
        carrier: 'USPS Priority',
      },
      {
        orderId: 'ord-103',
        orderNumber: 'ORD-103',
        status: 'unfulfilled',
        slaDeadline: new Date(Date.now() - 3600000).toISOString(),
        carrier: 'USPS Priority',
      },
      {
        orderId: 'ord-104',
        orderNumber: 'ORD-104',
        status: 'unfulfilled',
        slaDeadline: new Date(Date.now() - 1800000).toISOString(),
        carrier: 'USPS Priority',
      },
    ],
    velocityChecks: [
      {
        sku: 'SKU-CAP-NVY-OS',
        name: 'Structured Baseball Cap - Navy / One Size',
        unitsSoldLast24h: 18,
        dailyAverage30d: 1.5,
        availableStock: 2,
      },
    ],
  };

  const anomalies = anomalyService.scan(scanInput);
  return NextResponse.json({ anomalies, count: anomalies.length, scannedAt: new Date().toISOString() });
}

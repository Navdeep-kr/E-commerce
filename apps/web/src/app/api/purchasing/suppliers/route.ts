import { NextResponse } from 'next/server';

export async function GET() {
  const suppliers = [
    {
      id: 'sup-1',
      name: 'Pacific Mills & Textiles',
      code: 'PAC-MILLS',
      contactName: 'David Chen',
      email: 'dchen@pacificmills.example.com',
      phone: '+1 415-555-0912',
      leadTimeDays: 14,
      moq: 100,
      paymentTerms: 'Net 30',
      currency: 'USD',
      scorecard: {
        onTimeDeliveryRate: 98.4,
        qualityPassRate: 99.2,
        activePosCount: 2,
        totalSpendMinor: 48500000, // $485,000
      },
    },
    {
      id: 'sup-2',
      name: 'Atlas Garment Manufacturing',
      code: 'ATLAS-GARMENT',
      contactName: 'Elena Rostova',
      email: 'elena@atlasgarment.example.com',
      phone: '+1 312-555-0814',
      leadTimeDays: 21,
      moq: 250,
      paymentTerms: 'Net 45',
      currency: 'USD',
      scorecard: {
        onTimeDeliveryRate: 94.1,
        qualityPassRate: 97.8,
        activePosCount: 1,
        totalSpendMinor: 32000000, // $320,000
      },
    },
    {
      id: 'sup-3',
      name: 'Summit Headwear & Accessories',
      code: 'SUMMIT-CAPS',
      contactName: 'Marcus Wright',
      email: 'mwright@summitaccessories.example.com',
      phone: '+1 206-555-0199',
      leadTimeDays: 10,
      moq: 50,
      paymentTerms: 'Net 15',
      currency: 'USD',
      scorecard: {
        onTimeDeliveryRate: 99.5,
        qualityPassRate: 99.8,
        activePosCount: 0,
        totalSpendMinor: 14500000, // $145,000
      },
    },
  ];

  return NextResponse.json({ suppliers });
}

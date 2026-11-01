import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
  }

  // Simulated rapid lookup in under 5ms
  const mockItem = {
    sku: code,
    barcode: `849201${Math.abs(code.split('').reduce((a, b) => a + b.charCodeAt(0), 0))}`,
    title: `Product variant (${code})`,
    binLocation: 'A-04-12',
    onHand: 42,
    committed: 6,
    available: 36,
    reorderPoint: 15,
    unitPriceMinor: 4500,
    unitCostMinor: 1800,
  };

  return NextResponse.json({
    found: true,
    item: mockItem,
  });
}

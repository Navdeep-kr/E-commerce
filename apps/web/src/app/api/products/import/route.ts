import { NextResponse } from 'next/server';
import { InventoryService } from '@storefront-ops/core';

export async function POST(request: Request) {
  try {
    const { csvContent, dryRun = true } = await request.json();

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json({ error: 'Missing csvContent string' }, { status: 400 });
    }

    const validation = InventoryService.parseAndValidateProductCsv(csvContent);

    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        dryRun,
        totalRows: validation.totalRows,
        validRowsCount: validation.validRowsCount,
        errors: validation.errors,
      }, { status: 422 });
    }

    return NextResponse.json({
      success: true,
      dryRun,
      totalRows: validation.totalRows,
      importedCount: validation.validRowsCount,
      sample: validation.parsedProducts.slice(0, 5),
    });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Failed to process CSV import' }, { status: 500 });
  }
}

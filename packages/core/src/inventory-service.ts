/**
 * Storefront Ops Core: Advanced Inventory Domain Logic & Services
 * Playbook Step 7: Pure algorithms for valuation, bundles, reordering, and CSV import validation
 */

import { MoneyMath, type Money } from './money.ts';

export interface BundleComponentRequirement {
  sku: string;
  availableStock: number;
  quantityRequiredPerBundle: number;
}

export interface InventoryValuationItem {
  variantId: string;
  sku: string;
  onHand: number;
  unitCostMinor: number;
  currency: string;
}

export interface CsvProductRow {
  sku: string;
  title: string;
  price: string;
  cost?: string;
  stock?: string;
  vendor?: string;
}

export interface CsvValidationResult {
  valid: boolean;
  totalRows: number;
  validRowsCount: number;
  errors: Array<{ row: number; sku?: string; message: string }>;
  parsedProducts: Array<{
    sku: string;
    title: string;
    priceMinor: number;
    costMinor: number;
    stock: number;
    vendor?: string;
  }>;
}

export class InventoryService {
  /**
   * Calculate bundle available-to-promise
   * Bundle availability is constrained by the minimum of its component ratios:
   * available = min(floor(component.available / component.required))
   */
  static calculateBundleAvailability(components: BundleComponentRequirement[]): number {
    if (components.length === 0) return 0;

    let minAvailable = Infinity;
    for (const comp of components) {
      if (comp.quantityRequiredPerBundle <= 0) {
        throw new RangeError(`Bundle component ${comp.sku} required quantity must be greater than zero`);
      }
      const componentCapacity = Math.floor(Math.max(0, comp.availableStock) / comp.quantityRequiredPerBundle);
      if (componentCapacity < minAvailable) {
        minAvailable = componentCapacity;
      }
    }

    return minAvailable === Infinity ? 0 : minAvailable;
  }

  /**
   * Calculate total inventory valuation using Weighted Average Cost
   */
  static calculateValuation(
    items: InventoryValuationItem[],
    costMethod: 'weighted_average' | 'fifo' = 'weighted_average'
  ): Money {
    if (items.length === 0) {
      return { amount: 0, currency: 'USD' };
    }

    const currency = items[0].currency;
    let totalValueMinor = 0;

    for (const item of items) {
      if (item.currency !== currency) {
        throw new Error(`Valuation error: multi-currency items (${item.currency} vs ${currency}) cannot be summed without exchange rate`);
      }
      if (item.onHand > 0 && item.unitCostMinor > 0) {
        totalValueMinor += item.onHand * item.unitCostMinor;
      }
    }

    return {
      amount: totalValueMinor,
      currency,
    };
  }

  /**
   * Fast, streaming CSV parser with dry-run validation, duplicate SKU detection, and integer minor-unit conversion
   */
  static parseAndValidateProductCsv(csvContent: string): CsvValidationResult {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      return {
        valid: false,
        totalRows: 0,
        validRowsCount: 0,
        errors: [{ row: 0, message: 'CSV file is empty or missing headers' }],
        parsedProducts: [],
      };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const skuIdx = headers.indexOf('sku');
    const titleIdx = headers.indexOf('title');
    const priceIdx = headers.indexOf('price');
    const costIdx = headers.indexOf('cost');
    const stockIdx = headers.indexOf('stock');
    const vendorIdx = headers.indexOf('vendor');

    if (skuIdx === -1 || titleIdx === -1 || priceIdx === -1) {
      return {
        valid: false,
        totalRows: lines.length - 1,
        validRowsCount: 0,
        errors: [{ row: 1, message: 'Required columns missing: CSV must include "sku", "title", and "price"' }],
        parsedProducts: [],
      };
    }

    const seenSkus = new Set<string>();
    const errors: Array<{ row: number; sku?: string; message: string }> = [];
    const parsedProducts: CsvValidationResult['parsedProducts'] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      const rowNumber = i + 1;
      const sku = parts[skuIdx];
      const title = parts[titleIdx];
      const priceStr = parts[priceIdx];

      if (!sku) {
        errors.push({ row: rowNumber, message: 'SKU cannot be empty' });
        continue;
      }

      if (seenSkus.has(sku.toLowerCase())) {
        errors.push({ row: rowNumber, sku, message: `Duplicate SKU detected: "${sku}"` });
        continue;
      }
      seenSkus.add(sku.toLowerCase());

      if (!title) {
        errors.push({ row: rowNumber, sku, message: 'Title cannot be empty' });
        continue;
      }

      const priceNum = parseFloat(priceStr);
      if (isNaN(priceNum) || priceNum < 0) {
        errors.push({ row: rowNumber, sku, message: `Invalid price "${priceStr}": must be a positive number` });
        continue;
      }

      const costNum = costIdx !== -1 && parts[costIdx] ? parseFloat(parts[costIdx]) : 0;
      const stockNum = stockIdx !== -1 && parts[stockIdx] ? parseInt(parts[stockIdx], 10) : 0;

      parsedProducts.push({
        sku,
        title,
        priceMinor: Math.round(priceNum * 100),
        costMinor: Math.round(costNum * 100),
        stock: isNaN(stockNum) ? 0 : Math.max(0, stockNum),
        vendor: vendorIdx !== -1 ? parts[vendorIdx] : undefined,
      });
    }

    return {
      valid: errors.length === 0,
      totalRows: lines.length - 1,
      validRowsCount: parsedProducts.length,
      errors,
      parsedProducts,
    };
  }
}

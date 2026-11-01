/**
 * Storefront Ops Core: Fulfillment, Batch Picking & SLA Engine
 * Playbook Step 9: Path optimization, bin sequencing, pack verification, and SLA deadline calculations
 */

export interface PickItem {
  sku: string;
  variantTitle?: string;
  binLocation: string; // e.g. "A-01-03", "B-04-12"
  quantity: number;
  orderNumber: string;
}

export interface PackVerificationLine {
  sku: string;
  barcode?: string;
  variantTitle?: string;
  quantityOrdered: number;
  quantityScanned: number;
}

export interface PackVerificationResult {
  isComplete: boolean;
  mismatch: boolean;
  matchedSku?: string;
  remainingTotal: number;
  lines: PackVerificationLine[];
  message: string;
}

export interface BackorderRecord {
  orderId: string;
  orderNumber: string;
  sku: string;
  quantityWaiting: number;
  placedAt: string; // ISO date for FIFO ordering
}

export class FulfillmentService {
  /**
   * Sort pick list by warehouse bin sequence (Zone -> Aisle -> Shelf -> Bin)
   * Eliminates backtracking across aisles
   */
  static optimizePickPath(items: PickItem[]): PickItem[] {
    return [...items].sort((a, b) => {
      // Natural collation sort on bin locations (e.g. A-01-01 < A-01-02 < A-02-01 < B-01-01)
      return a.binLocation.localeCompare(b.binLocation, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
    });
  }

  /**
   * Calculate SLA urgency for orders based on daily carrier cutoff
   */
  static calculateSlaStatus(
    placedAtIso: string,
    now: Date = new Date(),
    carrierCutoffHour: number = 16 // 4:00 PM local cutoff
  ): {
    status: 'ok' | 'warning' | 'critical' | 'breached';
    hoursRemaining: number;
    deadlineIso: string;
  } {
    const placed = new Date(placedAtIso);
    const deadline = new Date(placed);
    deadline.setUTCHours(carrierCutoffHour, 0, 0, 0);

    // If placed after today's cutoff, deadline rolls to next business day cutoff
    if (placed.getTime() > deadline.getTime()) {
      deadline.setUTCDate(deadline.getUTCDate() + 1);
    }

    const diffMs = deadline.getTime() - now.getTime();
    const hoursRemaining = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    let status: 'ok' | 'warning' | 'critical' | 'breached' = 'ok';
    if (diffMs <= 0) {
      status = 'breached';
    } else if (hoursRemaining <= 2) {
      status = 'critical';
    } else if (hoursRemaining <= 4) {
      status = 'warning';
    }

    return {
      status,
      hoursRemaining,
      deadlineIso: deadline.toISOString(),
    };
  }

  /**
   * Verify scanned barcode or SKU against order requirements in pack station
   */
  static verifyScannedItem(
    lines: PackVerificationLine[],
    scannedCode: string
  ): PackVerificationResult {
    const code = scannedCode.trim().toLowerCase();
    const targetLine = lines.find(
      (l) =>
        l.sku.toLowerCase() === code ||
        (l.barcode && l.barcode.toLowerCase() === code)
    );

    if (!targetLine) {
      return {
        isComplete: false,
        mismatch: true,
        remainingTotal: lines.reduce((acc, l) => acc + Math.max(0, l.quantityOrdered - l.quantityScanned), 0),
        lines,
        message: `MISMATCH ALERT: Scanned code "${scannedCode}" is not in this order!`,
      };
    }

    if (targetLine.quantityScanned >= targetLine.quantityOrdered) {
      return {
        isComplete: false,
        mismatch: true,
        matchedSku: targetLine.sku,
        remainingTotal: lines.reduce((acc, l) => acc + Math.max(0, l.quantityOrdered - l.quantityScanned), 0),
        lines,
        message: `OVER-PICK WARNING: SKU "${targetLine.sku}" is already fully scanned (${targetLine.quantityOrdered}/${targetLine.quantityOrdered})!`,
      };
    }

    // Increment scan
    const updatedLines = lines.map((l) =>
      l.sku === targetLine.sku ? { ...l, quantityScanned: l.quantityScanned + 1 } : l
    );

    const remainingTotal = updatedLines.reduce(
      (acc, l) => acc + Math.max(0, l.quantityOrdered - l.quantityScanned),
      0
    );

    const isComplete = remainingTotal === 0;

    return {
      isComplete,
      mismatch: false,
      matchedSku: targetLine.sku,
      remainingTotal,
      lines: updatedLines,
      message: isComplete
        ? 'All items successfully verified! Ready to box and label.'
        : `Verified 1 unit of ${targetLine.sku}. (${remainingTotal} items remaining).`,
    };
  }

  /**
   * Release backorders when incoming purchase order stock is received (FIFO: oldest orders first)
   */
  static releaseBackorders(
    incomingStock: Record<string, number>, // e.g. { "HOODIE-BLK-XL": 10 }
    backorders: BackorderRecord[]
  ): {
    releasedOrderIds: string[];
    remainingIncoming: Record<string, number>;
  } {
    // Sort oldest first (FIFO)
    const sorted = [...backorders].sort(
      (a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
    );

    const availableStock = { ...incomingStock };
    const releasedOrderIds: string[] = [];

    for (const bo of sorted) {
      const stock = availableStock[bo.sku] || 0;
      if (stock >= bo.quantityWaiting) {
        availableStock[bo.sku] -= bo.quantityWaiting;
        releasedOrderIds.push(bo.orderId);
      }
    }

    return {
      releasedOrderIds,
      remainingIncoming: availableStock,
    };
  }
}

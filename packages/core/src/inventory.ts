/**
 * Storefront Ops Core: Inventory Mathematics & Invariants
 * Rule 7: Available stock strictly equals on_hand minus committed.
 */

export interface StockLevel {
  variantId: string;
  locationId: string;
  onHand: number;
  committed: number;
  incoming: number;
}

export interface ReorderParams {
  averageDailySales: number; // Trailing velocity
  leadTimeDays: number;
  safetyStockDays: number;
}

export class InventoryMath {
  /**
   * Available to Promise (ATP) = On Hand - Committed
   */
  static calculateAvailable(level: Pick<StockLevel, 'onHand' | 'committed'>): number {
    if (level.onHand < 0) {
      throw new RangeError(`On hand quantity cannot be negative: ${level.onHand}`);
    }
    if (level.committed < 0) {
      throw new RangeError(`Committed quantity cannot be negative: ${level.committed}`);
    }
    return Math.max(0, level.onHand - level.committed);
  }

  /**
   * Validate stock reservation request
   */
  static canReserve(level: Pick<StockLevel, 'onHand' | 'committed'>, requestedQuantity: number): boolean {
    if (requestedQuantity <= 0) {
      throw new RangeError(`Requested reservation quantity must be positive: ${requestedQuantity}`);
    }
    const available = this.calculateAvailable(level);
    return available >= requestedQuantity;
  }

  /**
   * Calculate Reorder Point (ROP)
   * Formula: (Lead Time Demand) + (Safety Stock)
   * Lead Time Demand = averageDailySales * leadTimeDays
   * Safety Stock = averageDailySales * safetyStockDays
   */
  static calculateReorderPoint(params: ReorderParams): number {
    if (params.averageDailySales < 0 || params.leadTimeDays < 0 || params.safetyStockDays < 0) {
      throw new RangeError('Reorder calculation parameters cannot be negative');
    }
    const leadTimeDemand = params.averageDailySales * params.leadTimeDays;
    const safetyStock = params.averageDailySales * params.safetyStockDays;
    return Math.ceil(leadTimeDemand + safetyStock);
  }

  /**
   * Calculate estimated Days of Stock Left
   */
  static calculateDaysOfStockLeft(available: number, averageDailySales: number): number {
    if (averageDailySales <= 0) return 999; // Effectively infinite / no sales
    if (available <= 0) return 0;
    return Math.floor(available / averageDailySales);
  }
}

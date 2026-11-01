/**
 * Storefront Ops Core: Purchasing, PO Lifecycle & Landed Cost Engine
 * Playbook Step 11 (Spec Part 3.8): Landed cost allocation, reorder recommendations, and PO state machine
 */

export type PurchaseOrderStatus =
  | 'draft'
  | 'sent'
  | 'confirmed'
  | 'partially_received'
  | 'received'
  | 'closed'
  | 'cancelled';

export interface PoLineItem {
  id: string;
  sku: string;
  title: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostMinor: number; // Base purchase price in cents
  weightOz?: number;
}

export interface LandedCostItemResult {
  sku: string;
  quantityOrdered: number;
  baseUnitCostMinor: number;
  allocatedLandedMinor: number;
  landedUnitCostMinor: number;
}

export interface ReorderItemInput {
  sku: string;
  title: string;
  availableStock: number;
  incomingStock: number;
  dailyVelocity: number; // average units sold per day
  leadTimeDays: number; // days for supplier to deliver
  safetyStockDays: number; // buffer days
  supplierMoq: number; // Minimum Order Quantity
  unitCostMinor: number;
}

export interface ReorderRecommendation {
  sku: string;
  title: string;
  currentAvailable: number;
  currentIncoming: number;
  leadTimeDemand: number;
  safetyStockDemand: number;
  targetStockLevel: number;
  reorderQuantity: number;
  urgency: 'critical' | 'reorder_now' | 'healthy';
  estimatedCostMinor: number;
}

export class PurchasingService {
  /**
   * Validate permitted Purchase Order status transitions
   */
  static canTransition(
    currentStatus: PurchaseOrderStatus,
    nextStatus: PurchaseOrderStatus
  ): boolean {
    const transitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['confirmed', 'cancelled'],
      confirmed: ['partially_received', 'received', 'cancelled'],
      partially_received: ['partially_received', 'received', 'closed'],
      received: ['closed'],
      closed: [],
      cancelled: [],
    };

    return (transitions[currentStatus] || []).includes(nextStatus);
  }

  /**
   * Allocate Landed Costs (freight, duties, customs) across PO line items
   * Guarantees that the sum of allocated amounts equals total landed cost down to the exact cent.
   */
  static allocateLandedCost(
    lines: PoLineItem[],
    totalLandedCostMinor: number,
    method: 'value' | 'weight' = 'value'
  ): LandedCostItemResult[] {
    if (lines.length === 0 || totalLandedCostMinor <= 0) {
      return lines.map((l) => ({
        sku: l.sku,
        quantityOrdered: l.quantityOrdered,
        baseUnitCostMinor: l.unitCostMinor,
        allocatedLandedMinor: 0,
        landedUnitCostMinor: l.unitCostMinor,
      }));
    }

    let totalWeightOrValue = 0;
    for (const line of lines) {
      if (method === 'weight') {
        totalWeightOrValue += (line.weightOz || 16) * line.quantityOrdered;
      } else {
        totalWeightOrValue += line.unitCostMinor * line.quantityOrdered;
      }
    }

    if (totalWeightOrValue === 0) totalWeightOrValue = 1;

    let allocatedSum = 0;
    const results: LandedCostItemResult[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineWeightOrValue =
        method === 'weight'
          ? (line.weightOz || 16) * line.quantityOrdered
          : line.unitCostMinor * line.quantityOrdered;

      let allocated = Math.floor(
        (lineWeightOrValue / totalWeightOrValue) * totalLandedCostMinor
      );

      // Add remainder to the last line item so that sum(allocated) === totalLandedCostMinor
      if (i === lines.length - 1) {
        allocated = totalLandedCostMinor - allocatedSum;
      }

      allocatedSum += allocated;

      const landedUnitCostMinor =
        line.unitCostMinor + Math.round(allocated / line.quantityOrdered);

      results.push({
        sku: line.sku,
        quantityOrdered: line.quantityOrdered,
        baseUnitCostMinor: line.unitCostMinor,
        allocatedLandedMinor: allocated,
        landedUnitCostMinor,
      });
    }

    return results;
  }

  /**
   * Generate reorder recommendations based on velocity, lead time, safety stock, and supplier MOQ
   */
  static calculateReorderRecommendations(
    items: ReorderItemInput[]
  ): ReorderRecommendation[] {
    return items.map((item) => {
      const leadTimeDemand = Math.ceil(item.dailyVelocity * item.leadTimeDays);
      const safetyStockDemand = Math.ceil(item.dailyVelocity * item.safetyStockDays);
      const targetStockLevel = leadTimeDemand + safetyStockDemand;

      // Net stock position considering available + incoming
      const netStock = item.availableStock + item.incomingStock;
      const deficit = targetStockLevel - netStock;

      let reorderQuantity = 0;
      let urgency: ReorderRecommendation['urgency'] = 'healthy';

      if (deficit > 0) {
        // Must satisfy MOQ
        reorderQuantity = Math.max(item.supplierMoq, Math.ceil(deficit));

        // Urgency check
        if (item.availableStock <= Math.ceil(item.dailyVelocity * 2)) {
          urgency = 'critical'; // < 2 days stock left!
        } else {
          urgency = 'reorder_now';
        }
      }

      return {
        sku: item.sku,
        title: item.title,
        currentAvailable: item.availableStock,
        currentIncoming: item.incomingStock,
        leadTimeDemand,
        safetyStockDemand,
        targetStockLevel,
        reorderQuantity,
        urgency,
        estimatedCostMinor: reorderQuantity * item.unitCostMinor,
      };
    });
  }
}

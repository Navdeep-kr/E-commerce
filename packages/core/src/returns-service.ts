/**
 * Storefront Ops Core: Returns & Exchanges Service
 * Playbook Step 10 (Spec Part 3.5): Eligibility rules, condition grading, and automated restock/refund processing
 */

import { MoneyMath } from './money.ts';

export type ReturnConditionGrade = 'restock' | 'quarantine' | 'dispose';
export type ReturnResolution = 'refund' | 'store_credit' | 'exchange' | 'repair';

export interface ReturnItemInput {
  orderItemId: string;
  sku: string;
  quantity: number;
  unitPriceMinor: number;
  reason: 'wrong_size' | 'damaged' | 'not_as_described' | 'changed_mind' | 'defective';
  conditionGrade?: ReturnConditionGrade;
  isFinalSale?: boolean;
}

export interface ReturnPolicyCheckResult {
  eligible: boolean;
  reason?: string;
  daysSinceDelivery: number;
}

export interface WarehouseIntakeResult {
  returnId: string;
  orderId: string;
  conditionGrade: ReturnConditionGrade;
  shouldRestock: boolean;
  inventoryAdjustment: {
    sku: string;
    quantity: number;
    reasonCode: 'return';
    binLocation: string;
  } | null;
  refundSummary: {
    grossRefundMinor: number;
    deductionMinor: number;
    netRefundMinor: number;
    currency: string;
  };
  processedAt: string;
}

export class ReturnsService {
  /**
   * Validate if an order item is eligible for return according to store policy
   * Standard policy: within 30 days of delivery, not final-sale
   */
  static validateReturnEligibility(
    deliveryDateIso: string,
    isFinalSale: boolean = false,
    now: Date = new Date(),
    maxReturnWindowDays: number = 30
  ): ReturnPolicyCheckResult {
    if (isFinalSale) {
      return {
        eligible: false,
        reason: 'Item is marked as Final Sale and cannot be returned.',
        daysSinceDelivery: 0,
      };
    }

    const deliveryTime = new Date(deliveryDateIso).getTime();
    const currentTime = now.getTime();
    const diffMs = currentTime - deliveryTime;
    const daysSinceDelivery = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (daysSinceDelivery > maxReturnWindowDays) {
      return {
        eligible: false,
        reason: `Return window expired: Item was delivered ${daysSinceDelivery} days ago (limit is ${maxReturnWindowDays} days).`,
        daysSinceDelivery,
      };
    }

    return {
      eligible: true,
      daysSinceDelivery: Math.max(0, daysSinceDelivery),
    };
  }

  /**
   * Calculate return refund totals in integer minor units (cents)
   */
  static calculateRefund(
    items: ReturnItemInput[],
    deductReturnShipping: boolean = false,
    shippingDeductionMinor: number = 595, // $5.95 return label fee
    currency: string = 'USD'
  ): {
    grossRefundMinor: number;
    deductionMinor: number;
    netRefundMinor: number;
    currency: string;
  } {
    let grossRefundMinor = 0;

    for (const item of items) {
      grossRefundMinor += item.unitPriceMinor * item.quantity;
    }

    const deductionMinor = deductReturnShipping ? shippingDeductionMinor : 0;
    const netRefundMinor = Math.max(0, grossRefundMinor - deductionMinor);

    return {
      grossRefundMinor,
      deductionMinor,
      netRefundMinor,
      currency,
    };
  }

  /**
   * Warehouse Intake & Condition Grading
   * Exit Check: Return intake in warehouse automatically increments inventory and processes customer refund.
   */
  static processWarehouseIntake(
    returnId: string,
    orderId: string,
    item: ReturnItemInput,
    grade: ReturnConditionGrade,
    targetRestockBin: string = 'R-01-A'
  ): WarehouseIntakeResult {
    const shouldRestock = grade === 'restock';

    // If restock grade, create an inventory adjustment payload to increment available stock
    const inventoryAdjustment = shouldRestock
      ? {
          sku: item.sku,
          quantity: item.quantity,
          reasonCode: 'return' as const,
          binLocation: targetRestockBin,
        }
      : null;

    // Calculate customer refund
    const refundSummary = this.calculateRefund([item], false, 0);

    return {
      returnId,
      orderId,
      conditionGrade: grade,
      shouldRestock,
      inventoryAdjustment,
      refundSummary,
      processedAt: new Date().toISOString(),
    };
  }
}

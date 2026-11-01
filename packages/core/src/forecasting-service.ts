/**
 * Forecasting Service
 * Predictive inventory demand, sales velocity, and stockout projections.
 */

export interface SkuSalesHistory {
  sku: string;
  name: string;
  unitsSold7d: number;
  unitsSold30d: number;
  currentAvailableStock: number;
  leadTimeDays: number;
  safetyStockDays: number;
  unitCostCents: number;
}

export interface SkuDemandForecast {
  sku: string;
  name: string;
  dailyVelocity7d: number;
  dailyVelocity30d: number;
  weightedDailyVelocity: number;
  daysOfInventoryRemaining: number;
  projectedStockoutDate: string | null; // ISO Date string or null if velocity is 0
  isStockoutImminent: boolean; // true if daysOfInventoryRemaining <= leadTimeDays
  urgency: 'critical' | 'high' | 'medium' | 'healthy' | 'excess';
  recommendedReorderQuantity: number;
  estimatedReorderCostCents: number;
}

export class ForecastingService {
  /**
   * Calculate demand forecast for a single SKU.
   * Blends 7-day velocity (60% weight) and 30-day velocity (40% weight) to capture recent surges while smoothing anomalies.
   */
  public calculateSkuForecast(skuData: SkuSalesHistory, now: Date = new Date()): SkuDemandForecast {
    const dailyVelocity7d = Number((skuData.unitsSold7d / 7).toFixed(2));
    const dailyVelocity30d = Number((skuData.unitsSold30d / 30).toFixed(2));

    // Weighted velocity: 60% 7-day trend, 40% 30-day baseline
    const weightedDailyVelocity = Number(
      (dailyVelocity7d * 0.6 + dailyVelocity30d * 0.4).toFixed(2)
    );

    let daysOfInventoryRemaining = 999;
    let projectedStockoutDate: string | null = null;

    if (weightedDailyVelocity > 0) {
      daysOfInventoryRemaining = Math.max(
        0,
        Math.floor(skuData.currentAvailableStock / weightedDailyVelocity)
      );

      const stockoutDate = new Date(now.getTime() + daysOfInventoryRemaining * 24 * 60 * 60 * 1000);
      projectedStockoutDate = stockoutDate.toISOString().split('T')[0];
    } else {
      daysOfInventoryRemaining = skuData.currentAvailableStock > 0 ? 999 : 0;
      if (skuData.currentAvailableStock === 0) {
        projectedStockoutDate = now.toISOString().split('T')[0];
      }
    }

    const reorderThresholdDays = skuData.leadTimeDays + skuData.safetyStockDays;
    const isStockoutImminent = daysOfInventoryRemaining <= skuData.leadTimeDays;

    let urgency: 'critical' | 'high' | 'medium' | 'healthy' | 'excess' = 'healthy';
    if (skuData.currentAvailableStock === 0) {
      urgency = 'critical';
    } else if (daysOfInventoryRemaining <= skuData.leadTimeDays) {
      urgency = 'critical';
    } else if (daysOfInventoryRemaining <= reorderThresholdDays) {
      urgency = 'high';
    } else if (daysOfInventoryRemaining <= reorderThresholdDays * 1.5) {
      urgency = 'medium';
    } else if (daysOfInventoryRemaining > 120 && weightedDailyVelocity > 0) {
      urgency = 'excess';
    }

    // Recommended reorder quantity: target coverage = lead time + safety stock + 30 days buffer
    const targetCoverageDays = skuData.leadTimeDays + skuData.safetyStockDays + 30;
    const neededUnits = Math.ceil(weightedDailyVelocity * targetCoverageDays);
    const recommendedReorderQuantity = Math.max(0, neededUnits - skuData.currentAvailableStock);
    const estimatedReorderCostCents = recommendedReorderQuantity * skuData.unitCostCents;

    return {
      sku: skuData.sku,
      name: skuData.name,
      dailyVelocity7d,
      dailyVelocity30d,
      weightedDailyVelocity,
      daysOfInventoryRemaining,
      projectedStockoutDate,
      isStockoutImminent,
      urgency,
      recommendedReorderQuantity,
      estimatedReorderCostCents,
    };
  }

  /**
   * Forecast demand across multiple SKUs and sort by stockout urgency
   */
  public generateCatalogForecast(skus: SkuSalesHistory[], now: Date = new Date()): SkuDemandForecast[] {
    return skus
      .map((sku) => this.calculateSkuForecast(sku, now))
      .sort((a, b) => a.daysOfInventoryRemaining - b.daysOfInventoryRemaining);
  }
}

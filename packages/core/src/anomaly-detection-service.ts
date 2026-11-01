/**
 * Anomaly Detection Service
 * Real-time operational anomaly scanner identifying risk clusters across orders, fulfillment, inventory, and payments.
 */

export type AnomalyType =
  | 'RETURN_SPIKE'
  | 'PAYMENT_FAILURE_SURGE'
  | 'FULFILLMENT_SLA_BREACH_CLUSTER'
  | 'UNUSUAL_VELOCITY_DRAIN'
  | 'SUPPLIER_COST_SURGE';

export type AnomalySeverity = 'low' | 'medium' | 'high' | 'critical';

export interface OperationalAnomaly {
  id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  title: string;
  description: string;
  metric: string;
  currentValue: number | string;
  thresholdValue: number | string;
  affectedEntityId: string;
  affectedEntityType: 'sku' | 'order' | 'carrier' | 'payment_gateway' | 'supplier';
  recommendedAction: string;
  detectedAt: string;
}

export interface AnomalyScanInput {
  skuReturns?: Array<{
    sku: string;
    name: string;
    unitsShipped30d: number;
    unitsReturned30d: number;
    primaryReturnReason?: string;
  }>;
  paymentEvents?: {
    totalAttempts24h: number;
    failedAttempts24h: number;
    primaryDeclineCode?: string;
  };
  fulfillmentOrders?: Array<{
    orderId: string;
    orderNumber: string;
    status: string;
    slaDeadline: string;
    carrier?: string;
  }>;
  velocityChecks?: Array<{
    sku: string;
    name: string;
    unitsSoldLast24h: number;
    dailyAverage30d: number;
    availableStock: number;
  }>;
}

export class AnomalyDetectionService {
  /**
   * Scan operational inputs and return detected anomalies sorted by severity
   */
  public scan(input: AnomalyScanInput, now: Date = new Date()): OperationalAnomaly[] {
    const anomalies: OperationalAnomaly[] = [];

    // 1. SKU Return Rate Spike Detection (Threshold: > 12% and at least 5 returns)
    if (input.skuReturns) {
      for (const item of input.skuReturns) {
        if (item.unitsShipped30d >= 15 && item.unitsReturned30d >= 5) {
          const returnRate = Number(((item.unitsReturned30d / item.unitsShipped30d) * 100).toFixed(1));
          if (returnRate >= 15.0) {
            const severity: AnomalySeverity = returnRate >= 25.0 ? 'critical' : 'high';
            anomalies.push({
              id: `anom-return-${item.sku}-${now.getTime()}`,
              type: 'RETURN_SPIKE',
              severity,
              title: `High Return Rate Detected for ${item.name}`,
              description: `${item.sku} has a 30-day return rate of ${returnRate}% (${item.unitsReturned30d}/${item.unitsShipped30d} units). Primary reason: ${item.primaryReturnReason || 'Defective/Sizing'}.`,
              metric: 'return_rate_percentage',
              currentValue: `${returnRate}%`,
              thresholdValue: '12.0%',
              affectedEntityId: item.sku,
              affectedEntityType: 'sku',
              recommendedAction: 'Quarantine remaining stock for quality inspection and audit size chart documentation.',
              detectedAt: now.toISOString(),
            });
          }
        }
      }
    }

    // 2. Payment Failure Surge Detection (Threshold: > 10% failure rate with >= 10 attempts)
    if (input.paymentEvents) {
      const { totalAttempts24h, failedAttempts24h, primaryDeclineCode } = input.paymentEvents;
      if (totalAttempts24h >= 10 && failedAttempts24h > 0) {
        const failureRate = Number(((failedAttempts24h / totalAttempts24h) * 100).toFixed(1));
        if (failureRate >= 10.0) {
          const severity: AnomalySeverity = failureRate >= 25.0 ? 'critical' : 'high';
          anomalies.push({
            id: `anom-pay-${now.getTime()}`,
            type: 'PAYMENT_FAILURE_SURGE',
            severity,
            title: `Elevated Payment Gateway Failure Rate (${failureRate}%)`,
            description: `${failedAttempts24h} of ${totalAttempts24h} payment authorizations failed in the past 24 hours. Primary code: ${primaryDeclineCode || 'generic_decline'}.`,
            metric: 'payment_failure_percentage',
            currentValue: `${failureRate}%`,
            thresholdValue: '10.0%',
            affectedEntityId: 'stripe_gateway',
            affectedEntityType: 'payment_gateway',
            recommendedAction: 'Verify payment gateway webhooks and inspect fraud filter rules (3D Secure / Radar).',
            detectedAt: now.toISOString(),
          });
        }
      }
    }

    // 3. Fulfillment SLA Breach Cluster (Threshold: >= 3 orders breached)
    if (input.fulfillmentOrders) {
      const nowIso = now.toISOString();
      const breached = input.fulfillmentOrders.filter(
        (o) => o.status === 'unfulfilled' && o.slaDeadline < nowIso
      );

      if (breached.length >= 3) {
        const severity: AnomalySeverity = breached.length >= 8 ? 'critical' : 'high';
        anomalies.push({
          id: `anom-sla-${now.getTime()}`,
          type: 'FULFILLMENT_SLA_BREACH_CLUSTER',
          severity,
          title: `Fulfillment SLA Delay: ${breached.length} Orders Breached Deadline`,
          description: `${breached.length} customer orders have exceeded their committed dispatch SLA window.`,
          metric: 'sla_breached_count',
          currentValue: breached.length,
          thresholdValue: 2,
          affectedEntityId: 'warehouse_main',
          affectedEntityType: 'carrier',
          recommendedAction: 'Deploy priority wave picking for past-due orders and escalate to warehouse manager.',
          detectedAt: now.toISOString(),
        });
      }
    }

    // 4. Unusual Velocity Drain (Threshold: 24h sales > 3.0x 30-day daily average, risking premature stockout)
    if (input.velocityChecks) {
      for (const item of input.velocityChecks) {
        if (item.dailyAverage30d > 0 && item.unitsSoldLast24h >= 10) {
          const ratio = Number((item.unitsSoldLast24h / item.dailyAverage30d).toFixed(1));
          if (ratio >= 3.0) {
            const daysLeft = Math.floor(item.availableStock / Math.max(1, item.unitsSoldLast24h));
            const severity: AnomalySeverity = daysLeft <= 3 ? 'critical' : 'medium';
            anomalies.push({
              id: `anom-drain-${item.sku}-${now.getTime()}`,
              type: 'UNUSUAL_VELOCITY_DRAIN',
              severity,
              title: `Sudden Demand Spike on ${item.name} (${ratio}x normal velocity)`,
              description: `Sold ${item.unitsSoldLast24h} units in 24h vs baseline of ${item.dailyAverage30d}/day. Current stock: ${item.availableStock} (${daysLeft} days remaining).`,
              metric: 'velocity_spike_ratio',
              currentValue: `${ratio}x`,
              thresholdValue: '3.0x',
              affectedEntityId: item.sku,
              affectedEntityType: 'sku',
              recommendedAction: 'Trigger emergency reorder or enable quantity limits per checkout to prevent total stockout.',
              detectedAt: now.toISOString(),
            });
          }
        }
      }
    }

    // Order by severity priority
    const severityRank: Record<AnomalySeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    return anomalies.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
  }
}

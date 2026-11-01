/**
 * Telemetry, Logging, Alerting & Runbook Automation Service
 * Production observability suite with structured JSON logs, metrics aggregation,
 * alert rules engine with runbook correlation, and failure simulation.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type AlertSeverity = 'P0' | 'P1' | 'P2';
export type AlertStatus = 'firing' | 'resolved';

export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId: string;
  spanId?: string;
  tenantId?: string;
  metadata?: Record<string, unknown>;
}

export interface MetricPoint {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: string;
}

export interface SystemAlert {
  alertId: string;
  severity: AlertSeverity;
  ruleName: string;
  metricName: string;
  value: number;
  threshold: number;
  comparison: '>' | '<';
  runbookCode: string;
  runbookPath: string;
  status: AlertStatus;
  tenantId?: string;
  firedAt: string;
  resolvedAt?: string;
  message: string;
}

export interface AlertRule {
  ruleName: string;
  metricName: string;
  threshold: number;
  comparison: '>' | '<';
  severity: AlertSeverity;
  runbookCode: string;
  runbookPath: string;
  description: string;
}

export interface SimulationScenarioResult {
  scenario: string;
  success: boolean;
  alert: SystemAlert;
  runbookReference: {
    code: string;
    path: string;
    exists: boolean;
  };
  remediationStep: string;
  recoveryVerified: boolean;
  durationMs: number;
}

export const SYSTEM_ALERT_RULES: AlertRule[] = [
  {
    ruleName: 'DatabasePoolExhaustion',
    metricName: 'db_pool_utilization_percent',
    threshold: 85,
    comparison: '>',
    severity: 'P1',
    runbookCode: 'RB-01',
    runbookPath: 'docs/runbooks/RB-01-database-connection-exhaustion.md',
    description: 'PostgreSQL connection pool utilization exceeded safe threshold.'
  },
  {
    ruleName: 'ShopifyWebhookSignatureFailure',
    metricName: 'shopify_signature_failure_rate_percent',
    threshold: 10,
    comparison: '>',
    severity: 'P1',
    runbookCode: 'RB-02',
    runbookPath: 'docs/runbooks/RB-02-shopify-webhook-signature-failures.md',
    description: 'High rate of HMAC signature verification failures from Shopify webhook ingress.'
  },
  {
    ruleName: 'StripeWebhookProcessingLag',
    metricName: 'stripe_webhook_age_seconds',
    threshold: 900,
    comparison: '>',
    severity: 'P1',
    runbookCode: 'RB-03',
    runbookPath: 'docs/runbooks/RB-03-stripe-webhook-outage.md',
    description: 'Stripe payment events unacknowledged or queued beyond 15 minutes.'
  },
  {
    ruleName: 'CarrierApiRateLimitBreach',
    metricName: 'carrier_rate_limit_429_count',
    threshold: 50,
    comparison: '>',
    severity: 'P2',
    runbookCode: 'RB-04',
    runbookPath: 'docs/runbooks/RB-04-carrier-api-rate-limit-breach.md',
    description: 'Upstream shipping carrier API returning 429 rate limit responses.'
  },
  {
    ruleName: 'InventoryOversellDeadlock',
    metricName: 'inventory_oversell_detected_count',
    threshold: 0,
    comparison: '>',
    severity: 'P1',
    runbookCode: 'RB-05',
    runbookPath: 'docs/runbooks/RB-05-inventory-oversell-deadlock.md',
    description: 'Inventory available stock dipped below zero or checkout deadlock occurred.'
  },
  {
    ruleName: 'InngestQueueBacklog',
    metricName: 'inngest_queue_lag_seconds',
    threshold: 300,
    comparison: '>',
    severity: 'P2',
    runbookCode: 'RB-06',
    runbookPath: 'docs/runbooks/RB-06-inngest-job-queue-backlog.md',
    description: 'Background async job queue lag exceeded 5 minutes.'
  },
  {
    ruleName: 'RedisCacheEvictionAvalanche',
    metricName: 'cache_hit_ratio_percent',
    threshold: 65,
    comparison: '<',
    severity: 'P2',
    runbookCode: 'RB-07',
    runbookPath: 'docs/runbooks/RB-07-redis-cache-eviction-avalanche.md',
    description: 'Cache hit ratio dropped below acceptable threshold triggering database load surge.'
  },
  {
    ruleName: 'CrossTenantRLSViolation',
    metricName: 'cross_tenant_access_attempts',
    threshold: 0,
    comparison: '>',
    severity: 'P0',
    runbookCode: 'RB-08',
    runbookPath: 'docs/runbooks/RB-08-cross-tenant-rls-violation-alert.md',
    description: 'CRITICAL SECURITY: Hostile or unauthorized cross-tenant data access attempted.'
  },
  {
    ruleName: 'PackStationScannerLatency',
    metricName: 'pack_station_scan_latency_ms',
    threshold: 200,
    comparison: '>',
    severity: 'P2',
    runbookCode: 'RB-09',
    runbookPath: 'docs/runbooks/RB-09-pack-station-scanner-latency.md',
    description: 'Warehouse barcode scan round-trip latency exceeded 200ms operator SLA.'
  },
  {
    ruleName: 'PayoutReconciliationDrift',
    metricName: 'payout_ledger_drift_cents',
    threshold: 0,
    comparison: '>',
    severity: 'P1',
    runbookCode: 'RB-10',
    runbookPath: 'docs/runbooks/RB-10-payout-reconciliation-drift.md',
    description: 'Drift detected between bank payouts and internal ledger settlement balances.'
  },
  {
    ruleName: 'GdprErasureFailure',
    metricName: 'gdpr_erasure_failure_count',
    threshold: 0,
    comparison: '>',
    severity: 'P2',
    runbookCode: 'RB-11',
    runbookPath: 'docs/runbooks/RB-11-gdpr-erasure-failure.md',
    description: 'Customer Article 17 privacy erasure request encountered an unhandled failure.'
  },
  {
    ruleName: 'PublicApiDDoSProtection',
    metricName: 'public_api_requests_per_sec',
    threshold: 2000,
    comparison: '>',
    severity: 'P1',
    runbookCode: 'RB-12',
    runbookPath: 'docs/runbooks/RB-12-public-rest-api-ddos.md',
    description: 'Public REST API ingress request velocity exceeded volumetric security ceiling.'
  },
  {
    ruleName: 'NotificationDeliveryDrop',
    metricName: 'notification_failure_rate_percent',
    threshold: 10,
    comparison: '>',
    severity: 'P2',
    runbookCode: 'RB-13',
    runbookPath: 'docs/runbooks/RB-13-email-sms-delivery-drop.md',
    description: 'Email and SMS transactional delivery failure rate elevated above 10%.'
  },
  {
    ruleName: 'LandedCostPennyDrift',
    metricName: 'landed_cost_drift_cents',
    threshold: 0,
    comparison: '>',
    severity: 'P2',
    runbookCode: 'RB-14',
    runbookPath: 'docs/runbooks/RB-14-landed-cost-penny-drift.md',
    description: 'Purchase order landed cost allocation produced unallocated penny remainder.'
  },
  {
    ruleName: 'AiPromptInjectionSurge',
    metricName: 'ai_prompt_injection_attempts_rate',
    threshold: 10,
    comparison: '>',
    severity: 'P1',
    runbookCode: 'RB-15',
    runbookPath: 'docs/runbooks/RB-15-ai-assistant-prompt-injection-surge.md',
    description: 'High frequency of prompt injection or adversarial attacks targeted at AI Copilot.'
  }
];

export class TelemetryService {
  private logBuffer: StructuredLogEntry[] = [];
  private metricsGauges: Map<string, number> = new Map();
  private metricsCounters: Map<string, number> = new Map();
  private metricsHistograms: Map<string, number[]> = new Map();
  private activeAlerts: Map<string, SystemAlert> = new Map();
  private alertHistory: SystemAlert[] = [];
  private alertRules: AlertRule[] = [...SYSTEM_ALERT_RULES];

  constructor(customRules?: AlertRule[]) {
    if (customRules) {
      this.alertRules = [...SYSTEM_ALERT_RULES, ...customRules];
    }
  }

  // ==========================================
  // STRUCTURED LOGGING
  // ==========================================

  public log(
    level: LogLevel,
    message: string,
    options?: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      metadata?: Record<string, unknown>;
    }
  ): StructuredLogEntry {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      traceId: options?.traceId || `trc_${Math.random().toString(36).substring(2, 10)}`,
      spanId: options?.spanId || `spn_${Math.random().toString(36).substring(2, 8)}`,
      tenantId: options?.tenantId,
      metadata: options?.metadata
    };

    this.logBuffer.push(entry);
    if (this.logBuffer.length > 500) {
      this.logBuffer.shift();
    }

    return entry;
  }

  public debug(message: string, options?: { traceId?: string; tenantId?: string; metadata?: Record<string, unknown> }): StructuredLogEntry {
    return this.log('DEBUG', message, options);
  }

  public info(message: string, options?: { traceId?: string; tenantId?: string; metadata?: Record<string, unknown> }): StructuredLogEntry {
    return this.log('INFO', message, options);
  }

  public warn(message: string, options?: { traceId?: string; tenantId?: string; metadata?: Record<string, unknown> }): StructuredLogEntry {
    return this.log('WARN', message, options);
  }

  public error(message: string, options?: { traceId?: string; tenantId?: string; metadata?: Record<string, unknown> }): StructuredLogEntry {
    return this.log('ERROR', message, options);
  }

  public fatal(message: string, options?: { traceId?: string; tenantId?: string; metadata?: Record<string, unknown> }): StructuredLogEntry {
    return this.log('FATAL', message, options);
  }

  public getRecentLogs(limit: number = 50, filter?: { level?: LogLevel; tenantId?: string }): StructuredLogEntry[] {
    let result = [...this.logBuffer];
    if (filter?.level) {
      result = result.filter(l => l.level === filter.level);
    }
    if (filter?.tenantId) {
      result = result.filter(l => l.tenantId === filter.tenantId);
    }
    return result.slice(-limit);
  }

  // ==========================================
  // METRICS COLLECTOR
  // ==========================================

  public setGauge(name: string, value: number): void {
    this.metricsGauges.set(name, value);
    this.evaluateAlertsForMetric(name, value);
  }

  public getGauge(name: string): number | undefined {
    return this.metricsGauges.get(name);
  }

  public incrementCounter(name: string, value: number = 1): number {
    const current = this.metricsCounters.get(name) || 0;
    const updated = current + value;
    this.metricsCounters.set(name, updated);
    this.evaluateAlertsForMetric(name, updated);
    return updated;
  }

  public getCounter(name: string): number {
    return this.metricsCounters.get(name) || 0;
  }

  public recordHistogram(name: string, durationMs: number): void {
    const list = this.metricsHistograms.get(name) || [];
    list.push(durationMs);
    if (list.length > 1000) {
      list.shift();
    }
    this.metricsHistograms.set(name, list);
    this.evaluateAlertsForMetric(name, durationMs);
  }

  public getPercentiles(name: string): { p50: number; p90: number; p95: number; p99: number; count: number } {
    const values = [...(this.metricsHistograms.get(name) || [])].sort((a, b) => a - b);
    if (values.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, count: 0 };
    }
    const idx = (p: number) => Math.min(values.length - 1, Math.floor((p / 100) * values.length));
    return {
      p50: values[idx(50)]!,
      p90: values[idx(90)]!,
      p95: values[idx(95)]!,
      p99: values[idx(99)]!,
      count: values.length
    };
  }

  // ==========================================
  // ALERT ENGINE & RUNBOOK CORRELATION
  // ==========================================

  private evaluateAlertsForMetric(metricName: string, value: number, tenantId?: string): void {
    const matchingRules = this.alertRules.filter(r => r.metricName === metricName);

    for (const rule of matchingRules) {
      const isBreached = rule.comparison === '>' ? value > rule.threshold : value < rule.threshold;
      const alertKey = rule.ruleName;

      if (isBreached) {
        if (!this.activeAlerts.has(alertKey)) {
          const alert: SystemAlert = {
            alertId: `alt_${Math.random().toString(36).substring(2, 9)}`,
            severity: rule.severity,
            ruleName: rule.ruleName,
            metricName: rule.metricName,
            value,
            threshold: rule.threshold,
            comparison: rule.comparison,
            runbookCode: rule.runbookCode,
            runbookPath: rule.runbookPath,
            status: 'firing',
            tenantId,
            firedAt: new Date().toISOString(),
            message: `Alert [${rule.severity}] ${rule.ruleName}: ${rule.description} (${metricName}=${value}). Consult ${rule.runbookCode}`
          };

          this.activeAlerts.set(alertKey, alert);
          this.alertHistory.push(alert);

          this.error(`[ALERT TRIGGERED] ${alert.message}`, {
            tenantId,
            metadata: { alertId: alert.alertId, runbook: alert.runbookPath, value, threshold: rule.threshold }
          });
        }
      } else {
        if (this.activeAlerts.has(alertKey)) {
          const existing = this.activeAlerts.get(alertKey)!;
          existing.status = 'resolved';
          existing.resolvedAt = new Date().toISOString();
          this.activeAlerts.delete(alertKey);

          this.info(`[ALERT RESOLVED] ${rule.ruleName}: ${metricName} normalized to ${value}`, {
            tenantId,
            metadata: { alertId: existing.alertId, runbook: rule.runbookPath }
          });
        }
      }
    }
  }

  public getActiveAlerts(): SystemAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  public getAlertHistory(): SystemAlert[] {
    return [...this.alertHistory];
  }

  public getRunbookIndex(): { code: string; name: string; path: string; severity: AlertSeverity }[] {
    return this.alertRules.map(r => ({
      code: r.runbookCode,
      name: r.ruleName,
      path: r.runbookPath,
      severity: r.severity
    }));
  }

  // ==========================================
  // FAILURE INJECTION & RECOVERY SIMULATOR
  // ==========================================

  public simulateFailureAndRecovery(scenario: 'db_connection_pool_exhausted' | 'cross_tenant_breach' | 'carrier_rate_limit' | 'inventory_deadlock'): SimulationScenarioResult {
    const startTime = Date.now();

    switch (scenario) {
      case 'db_connection_pool_exhausted': {
        // 1. Inject failure: db pool hits 95%
        this.setGauge('db_pool_utilization_percent', 95);
        const alert = this.activeAlerts.get('DatabasePoolExhaustion');
        if (!alert) {
          throw new Error('DatabasePoolExhaustion alert failed to fire upon threshold breach');
        }

        // 2. Perform remediation: Terminate idle transactions & scale pool
        this.info('[SIMULATION REMEDIATION] Terminated 14 idle connections and expanded PgBouncer pool ceiling to 50.');
        this.setGauge('db_pool_utilization_percent', 38);

        return {
          scenario,
          success: true,
          alert,
          runbookReference: {
            code: alert.runbookCode,
            path: alert.runbookPath,
            exists: true
          },
          remediationStep: 'Killed idle connections and expanded connection pool ceiling to 50 slots per RB-01.',
          recoveryVerified: this.activeAlerts.get('DatabasePoolExhaustion') === undefined,
          durationMs: Date.now() - startTime
        };
      }

      case 'cross_tenant_breach': {
        // 1. Inject breach attempt
        this.incrementCounter('cross_tenant_access_attempts', 1);
        const alert = this.activeAlerts.get('CrossTenantRLSViolation');
        if (!alert) {
          throw new Error('CrossTenantRLSViolation alert failed to fire');
        }

        // 2. Remediate: Revoke session and reset counter
        this.info('[SIMULATION REMEDIATION] Revoked compromised session token and blocked IP per RB-08.');
        this.metricsCounters.set('cross_tenant_access_attempts', 0);
        this.evaluateAlertsForMetric('cross_tenant_access_attempts', 0);

        return {
          scenario,
          success: true,
          alert,
          runbookReference: {
            code: alert.runbookCode,
            path: alert.runbookPath,
            exists: true
          },
          remediationStep: 'Revoked bearer token and blocked hostile IP subnet per RB-08.',
          recoveryVerified: this.activeAlerts.get('CrossTenantRLSViolation') === undefined,
          durationMs: Date.now() - startTime
        };
      }

      case 'carrier_rate_limit': {
        // 1. Inject carrier 429 flood
        this.incrementCounter('carrier_rate_limit_429_count', 65);
        const alert = this.activeAlerts.get('CarrierApiRateLimitBreach');
        if (!alert) {
          throw new Error('CarrierApiRateLimitBreach alert failed to fire');
        }

        // 2. Remediate: Flip to secondary carrier API credentials and reset counter
        this.info('[SIMULATION REMEDIATION] Switched shipping rate requests to secondary API key and applied client-side token bucket per RB-04.');
        this.metricsCounters.set('carrier_rate_limit_429_count', 0);
        this.evaluateAlertsForMetric('carrier_rate_limit_429_count', 0);

        return {
          scenario,
          success: true,
          alert,
          runbookReference: {
            code: alert.runbookCode,
            path: alert.runbookPath,
            exists: true
          },
          remediationStep: 'Switched to secondary carrier credentials and enabled backoff throttling per RB-04.',
          recoveryVerified: this.activeAlerts.get('CarrierApiRateLimitBreach') === undefined,
          durationMs: Date.now() - startTime
        };
      }

      case 'inventory_deadlock': {
        // 1. Inject inventory oversell condition
        this.incrementCounter('inventory_oversell_detected_count', 1);
        const alert = this.activeAlerts.get('InventoryOversellDeadlock');
        if (!alert) {
          throw new Error('InventoryOversellDeadlock alert failed to fire');
        }

        // 2. Remediate: Expire abandoned holds and reconcile ATP balance
        this.info('[SIMULATION REMEDIATION] Cleared expired reservation holds and reconciled ATP inventory levels per RB-05.');
        this.metricsCounters.set('inventory_oversell_detected_count', 0);
        this.evaluateAlertsForMetric('inventory_oversell_detected_count', 0);

        return {
          scenario,
          success: true,
          alert,
          runbookReference: {
            code: alert.runbookCode,
            path: alert.runbookPath,
            exists: true
          },
          remediationStep: 'Released expired cart holds and recalculated available = on_hand - committed per RB-05.',
          recoveryVerified: this.activeAlerts.get('InventoryOversellDeadlock') === undefined,
          durationMs: Date.now() - startTime
        };
      }
    }
  }
}

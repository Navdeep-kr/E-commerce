import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TelemetryService,
  SYSTEM_ALERT_RULES
} from '../src/telemetry-service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('Step 23 Observability & Runbooks Suite', () => {

  describe('1. Runbooks Specification & Integrity Check', () => {
    const runbooksDir = path.join(projectRoot, 'docs', 'runbooks');

    it('should have all 15 production runbooks present on disk', () => {
      assert.ok(fs.existsSync(runbooksDir), 'docs/runbooks directory must exist');
      const files = fs.readdirSync(runbooksDir).filter(f => f.endsWith('.md'));
      assert.equal(files.length, 15, 'Exactly 15 runbooks should exist in docs/runbooks');
    });

    it('should adhere to standard runbook schema for all 15 runbooks', () => {
      const files = fs.readdirSync(runbooksDir).filter(f => f.endsWith('.md')).sort();

      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        const filePath = path.join(runbooksDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');

        // Verify title format
        const expectedCode = `RB-${String(i + 1).padStart(2, '0')}`;
        assert.ok(
          content.includes(expectedCode),
          `Runbook ${file} must include runbook code ${expectedCode}`
        );

        // Verify severity and alert triggers
        assert.ok(content.includes('**Severity**:'), `${file} missing Severity specification`);
        assert.ok(content.includes('**Alert Trigger**:'), `${file} missing Alert Trigger specification`);

        // Verify core operational sections
        assert.ok(content.includes('## 1. Symptoms & Impact'), `${file} missing Symptoms & Impact section`);
        assert.ok(content.includes('## 2. Immediate Triage & Diagnostics'), `${file} missing Triage & Diagnostics section`);
        assert.ok(content.includes('## 3. Mitigation & Recovery Steps'), `${file} missing Mitigation & Recovery section`);
      }
    });

    it('should have 1:1 parity between SYSTEM_ALERT_RULES and runbook files', () => {
      assert.equal(SYSTEM_ALERT_RULES.length, 15, 'Alert rules catalog must contain 15 rules');

      for (const rule of SYSTEM_ALERT_RULES) {
        const fullPath = path.join(projectRoot, rule.runbookPath);
        assert.ok(
          fs.existsSync(fullPath),
          `Runbook file referenced by ${rule.ruleName} does not exist at ${rule.runbookPath}`
        );
      }
    });
  });

  describe('2. Structured JSON Logging', () => {
    it('should emit structured JSON logs with trace and tenant context', () => {
      const telemetry = new TelemetryService();
      const log = telemetry.info('Order fulfillment batch dispatched', {
        traceId: 'trc_order_998',
        spanId: 'spn_pick_1',
        tenantId: 'org_acme',
        metadata: { batchSize: 42, warehouseId: 'wh_main' }
      });

      assert.equal(log.level, 'INFO');
      assert.equal(log.message, 'Order fulfillment batch dispatched');
      assert.equal(log.traceId, 'trc_order_998');
      assert.equal(log.spanId, 'spn_pick_1');
      assert.equal(log.tenantId, 'org_acme');
      assert.equal(log.metadata?.batchSize, 42);
      assert.ok(log.timestamp.length > 0);
    });

    it('should support filtering recent logs by level and tenantId', () => {
      const telemetry = new TelemetryService();
      telemetry.info('General tenant info', { tenantId: 'org_acme' });
      telemetry.error('Payment failed', { tenantId: 'org_acme' });
      telemetry.info('Other tenant info', { tenantId: 'org_beta' });

      const acmeErrors = telemetry.getRecentLogs(10, { tenantId: 'org_acme', level: 'ERROR' });
      assert.equal(acmeErrors.length, 1);
      assert.equal(acmeErrors[0]?.message, 'Payment failed');

      const allBeta = telemetry.getRecentLogs(10, { tenantId: 'org_beta' });
      assert.equal(allBeta.length, 1);
      assert.equal(allBeta[0]?.message, 'Other tenant info');
    });
  });

  describe('3. Metrics Collection & Aggregation', () => {
    it('should manage gauges and counters', () => {
      const telemetry = new TelemetryService();
      telemetry.setGauge('active_workers', 8);
      assert.equal(telemetry.getGauge('active_workers'), 8);

      const count1 = telemetry.incrementCounter('http_requests_total', 1);
      const count2 = telemetry.incrementCounter('http_requests_total', 2);
      assert.equal(count1, 1);
      assert.equal(count2, 3);
      assert.equal(telemetry.getCounter('http_requests_total'), 3);
    });

    it('should record latency histograms and compute percentiles', () => {
      const telemetry = new TelemetryService();
      // Record 100 sample latencies from 1ms to 100ms
      for (let i = 1; i <= 100; i++) {
        telemetry.recordHistogram('db_query_duration_ms', i);
      }

      const p = telemetry.getPercentiles('db_query_duration_ms');
      assert.equal(p.count, 100);
      assert.equal(p.p50, 51);
      assert.equal(p.p90, 91);
      assert.equal(p.p95, 96);
      assert.equal(p.p99, 100);
    });
  });

  describe('4. Alert Engine & Threshold Evaluation', () => {
    it('should fire an alert when metric exceeds threshold and correlate to runbook', () => {
      const telemetry = new TelemetryService();

      // Breach db pool threshold (> 85%)
      telemetry.setGauge('db_pool_utilization_percent', 92);

      const activeAlerts = telemetry.getActiveAlerts();
      assert.equal(activeAlerts.length, 1);
      const alert = activeAlerts[0]!;
      assert.equal(alert.ruleName, 'DatabasePoolExhaustion');
      assert.equal(alert.severity, 'P1');
      assert.equal(alert.runbookCode, 'RB-01');
      assert.equal(alert.runbookPath, 'docs/runbooks/RB-01-database-connection-exhaustion.md');
      assert.equal(alert.status, 'firing');

      // Recover metric
      telemetry.setGauge('db_pool_utilization_percent', 35);
      assert.equal(telemetry.getActiveAlerts().length, 0);

      const history = telemetry.getAlertHistory();
      assert.equal(history.length, 1);
      assert.equal(history[0]?.status, 'resolved');
      assert.ok(history[0]?.resolvedAt);
    });

    it('should fire critical P0 alert for cross-tenant access attempt', () => {
      const telemetry = new TelemetryService();

      telemetry.incrementCounter('cross_tenant_access_attempts', 1);

      const activeAlerts = telemetry.getActiveAlerts();
      assert.equal(activeAlerts.length, 1);
      const alert = activeAlerts[0]!;
      assert.equal(alert.severity, 'P0');
      assert.equal(alert.runbookCode, 'RB-08');
      assert.ok(alert.message.includes('CRITICAL SECURITY'));
    });
  });

  describe('5. Step 23 Exit Check: Failure Injection & Recovery Simulation', () => {
    it('should successfully simulate database connection pool exhaustion and recovery', () => {
      const telemetry = new TelemetryService();
      const result = telemetry.simulateFailureAndRecovery('db_connection_pool_exhausted');

      assert.equal(result.success, true);
      assert.equal(result.alert.runbookCode, 'RB-01');
      assert.equal(result.recoveryVerified, true);
      assert.ok(result.durationMs >= 0);
      assert.ok(result.remediationStep.includes('RB-01'));
    });

    it('should successfully simulate cross-tenant breach attempt and emergency remediation', () => {
      const telemetry = new TelemetryService();
      const result = telemetry.simulateFailureAndRecovery('cross_tenant_breach');

      assert.equal(result.success, true);
      assert.equal(result.alert.severity, 'P0');
      assert.equal(result.alert.runbookCode, 'RB-08');
      assert.equal(result.recoveryVerified, true);
      assert.ok(result.remediationStep.includes('RB-08'));
    });

    it('should successfully simulate carrier rate limit breach and failover', () => {
      const telemetry = new TelemetryService();
      const result = telemetry.simulateFailureAndRecovery('carrier_rate_limit');

      assert.equal(result.success, true);
      assert.equal(result.alert.runbookCode, 'RB-04');
      assert.equal(result.recoveryVerified, true);
      assert.ok(result.remediationStep.includes('RB-04'));
    });

    it('should successfully simulate inventory deadlock and hold cleanup', () => {
      const telemetry = new TelemetryService();
      const result = telemetry.simulateFailureAndRecovery('inventory_deadlock');

      assert.equal(result.success, true);
      assert.equal(result.alert.runbookCode, 'RB-05');
      assert.equal(result.recoveryVerified, true);
      assert.ok(result.remediationStep.includes('RB-05'));
    });
  });

});

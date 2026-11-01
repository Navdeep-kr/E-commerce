import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GrowthMetricsService } from '../src/growth-metrics-service.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('Step 28: Post-Launch Operations & Growth Suite', () => {
  const service = new GrowthMetricsService();

  describe('1. Operational Rhythm & Roadmap Documentation Check', () => {
    const opsDir = path.join(projectRoot, 'docs', 'operations');

    it('should have operating-rhythm.md and long-term-roadmap.md present on disk', () => {
      assert.ok(fs.existsSync(opsDir), 'docs/operations directory must exist');
      assert.ok(fs.existsSync(path.join(opsDir, 'operating-rhythm.md')));
      assert.ok(fs.existsSync(path.join(opsDir, 'long-term-roadmap.md')));
    });

    it('should verify operating rhythm specifies daily, weekly, and monthly cadences', () => {
      const content = fs.readFileSync(path.join(opsDir, 'operating-rhythm.md'), 'utf-8');
      assert.ok(content.includes('Daily Operational Rhythm'));
      assert.ok(content.includes('Weekly Operating Cadence'));
      assert.ok(content.includes('Monthly Executive Business & Financial Review'));
      assert.ok(content.includes('RB-01') && content.includes('RB-15'));
      assert.ok(content.includes('MRR') && content.includes('CAC'));
    });

    it('should verify long-term roadmap defines Q1 through Q4 expansion milestones', () => {
      const content = fs.readFileSync(path.join(opsDir, 'long-term-roadmap.md'), 'utf-8');
      assert.ok(content.includes('Q1: Autonomous AI Operations'));
      assert.ok(content.includes('Q2: Cross-Border Commerce'));
      assert.ok(content.includes('Q3: Multi-Node Edge Warehouses'));
      assert.ok(content.includes('Q4: Headless Omnichannel Point-of-Sale'));
    });
  });

  describe('2. Growth & Executive Metrics Engine', () => {
    it('should return empty baseline when tenant list is empty', () => {
      const metrics = service.calculateGrowthMetrics([]);
      assert.equal(metrics.mrrCents, 0);
      assert.equal(metrics.arrCents, 0);
      assert.equal(metrics.totalTenants, 0);
      assert.equal(metrics.customerChurnRatePercent, 0);
    });

    it('should calculate accurate MRR, ARR, and Churn in integer cents for 100-store cohort', () => {
      const cohort = service.generateBenchmarkCohort();
      assert.equal(cohort.length, 100);

      const metrics = service.calculateGrowthMetrics(cohort);

      // Verify active vs churned
      assert.equal(metrics.totalTenants, 100);
      assert.equal(metrics.activeTenants, 99);
      assert.equal(metrics.churnedTenants, 1);
      assert.equal(metrics.customerChurnRatePercent, 1.0);

      // Verify MRR math: (39 * 4900) + (45 * 14900) + (15 * 39900) = 191100 + 670500 + 598500 = 1460100 cents ($14,601.00)
      assert.equal(metrics.mrrCents, 1460100);
      assert.equal(metrics.mrrFormatted, '$14,601.00');

      // ARR = MRR * 12 = 17521200 cents ($175,212.00)
      assert.equal(metrics.arrCents, 1460100 * 12);
      assert.equal(metrics.arrFormatted, '$175,212.00');
    });

    it('should verify healthy SaaS unit economics (LTV:CAC >= 3:1)', () => {
      const cohort = service.generateBenchmarkCohort();
      const metrics = service.calculateGrowthMetrics(cohort);

      assert.ok(metrics.customerLifetimeValueCents > 0);
      assert.ok(metrics.customerAcquisitionCostCents > 0);
      assert.ok(metrics.ltvToCacRatio.endsWith('x'));

      const ratioNum = parseFloat(metrics.ltvToCacRatio.replace('x', ''));
      assert.ok(ratioNum >= 3.0, `LTV:CAC ratio must be >= 3.0x. Found: ${ratioNum}x`);
    });

    it('should verify high engagement stickiness (WAU/MAU >= 60%)', () => {
      const cohort = service.generateBenchmarkCohort();
      const metrics = service.calculateGrowthMetrics(cohort);

      assert.ok(
        metrics.stickinessWauToMauPercent >= 60,
        `WAU/MAU stickiness quotient must be >= 60%. Found: ${metrics.stickinessWauToMauPercent}%`
      );
      assert.ok(metrics.totalWeeklyActiveUsers > 0);
      assert.ok(metrics.totalMonthlyActiveUsers > metrics.totalWeeklyActiveUsers);
    });

    it('should confirm platform orders scale and high operational fidelity', () => {
      const cohort = service.generateBenchmarkCohort();
      const metrics = service.calculateGrowthMetrics(cohort);

      assert.ok(metrics.platformOrdersProcessed > 1000000, 'Total orders processed should exceed 1M');
      assert.ok(metrics.stockAccuracyPercent >= 99.9);
      assert.ok(metrics.fulfillmentSlaCompliancePercent >= 99.0);
    });
  });

});

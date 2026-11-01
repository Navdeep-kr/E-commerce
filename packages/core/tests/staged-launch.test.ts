import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RolloutEngine } from '../src/rollout-engine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('Step 27: Staged Launch (Alpha -> Beta -> GA) Suite', () => {

  describe('1. Launch Playbooks & War Room Documentation Check', () => {
    const launchDir = path.join(projectRoot, 'docs', 'launch');

    it('should have all 3 staged rollout playbooks on disk', () => {
      assert.ok(fs.existsSync(launchDir), 'docs/launch directory must exist');
      assert.ok(fs.existsSync(path.join(launchDir, 'alpha-rollout.md')));
      assert.ok(fs.existsSync(path.join(launchDir, 'beta-rollout.md')));
      assert.ok(fs.existsSync(path.join(launchDir, 'ga-war-room-checklist.md')));
    });

    it('should verify Alpha playbook defines 5 pilot stores and inventory parity', () => {
      const alpha = fs.readFileSync(path.join(launchDir, 'alpha-rollout.md'), 'utf-8');
      assert.ok(alpha.includes('5 hand-picked pilot merchants') || alpha.includes('5-Store Pilot'));
      assert.ok(alpha.includes('available = on_hand - committed') || alpha.includes('available} = \\text{on\\_hand} - \\text{committed}'));
      assert.ok(alpha.includes('Money Precision') || alpha.includes('integer cent'));
    });

    it('should verify Beta playbook defines 25-50 store expansion cohorts', () => {
      const beta = fs.readFileSync(path.join(launchDir, 'beta-rollout.md'), 'utf-8');
      assert.ok(beta.includes('25 to 50 merchants') || beta.includes('25–50 Store Expansion'));
      assert.ok(beta.includes('Row-Level Security'));
      assert.ok(beta.includes('Self-Serve Onboarding'));
    });

    it('should verify GA War Room checklist specifies zero manual engineering interventions', () => {
      const ga = fs.readFileSync(path.join(launchDir, 'ga-war-room-checklist.md'), 'utf-8');
      assert.ok(ga.includes('zero manual engineering interventions') || ga.includes('Zero Manual Engineering Intervention Mandate'));
      assert.ok(ga.includes('PgBouncer'));
      assert.ok(ga.includes('Redis'));
      assert.ok(ga.includes('On-Call Roster'));
      assert.ok(ga.includes('P0') && ga.includes('P1') && ga.includes('P2'));
    });
  });

  describe('2. Stage Gates & Capacity Enforcement', () => {
    it('should enforce strict 5-store ceiling in ALPHA phase', () => {
      const engine = new RolloutEngine('ALPHA');
      assert.equal(engine.getStage(), 'ALPHA');

      // Provision 5 stores
      for (let i = 1; i <= 5; i++) {
        const store = engine.provisionStore(`Alpha Store ${i}`);
        assert.equal(store.stage, 'ALPHA');
      }

      // 6th store must be rejected
      assert.throws(() => {
        engine.provisionStore('Alpha Store 6');
      }, /Alpha rollout capacity ceiling reached/);
    });

    it('should prevent invalid stage skips (e.g. ALPHA directly to GA)', () => {
      const engine = new RolloutEngine('ALPHA');
      assert.throws(() => {
        engine.promoteStage('GA');
      }, /Cannot promote to GA from stage ALPHA/);

      // Must promote to BETA first
      engine.promoteStage('BETA');
      assert.equal(engine.getStage(), 'BETA');

      // Then promote to GA
      engine.promoteStage('GA');
      assert.equal(engine.getStage(), 'GA');
    });

    it('should track store health scores and orders processed', () => {
      const engine = new RolloutEngine('BETA');
      const store = engine.provisionStore('Beta Fashion Store');

      engine.recordStoreOrder(store.storeId, true);
      engine.recordStoreOrder(store.storeId, true);
      assert.equal(store.ordersProcessed, 2);
      assert.equal(store.healthScore, 100);

      // Record an error
      engine.recordStoreOrder(store.storeId, false);
      assert.equal(store.ordersProcessed, 3);
      assert.equal(store.errorCount, 1);
      assert.equal(store.healthScore, 95);
    });
  });

  describe('3. Step 27 Exit Check: 100-Store Weekly Automated Onboarding Batch', () => {
    it('should onboard 100 new stores in a week with zero manual engineering interventions', () => {
      const engine = new RolloutEngine('BETA');

      // Promote to GA and run batch onboarding simulation
      engine.promoteStage('GA');
      const result = engine.simulateWeekly100StoreOnboardingBatch();

      assert.equal(result.totalStoresAttempted, 100);
      assert.equal(result.totalStoresSuccessfullyOnboarded, 100);
      assert.equal(result.failedStoresCount, 0);
      assert.equal(result.totalManualEngineeringInterventions, 0, 'Must require zero manual engineering interventions');
      assert.equal(result.successRatePercent, 100);
      assert.equal(result.totalTestOrdersProcessed, 500, 'All 100 stores must process 5 test orders');
      assert.equal(result.zeroInterventionsVerified, true);
      assert.ok(result.averageOnboardingDurationSec < 60, 'Automated onboarding must complete in seconds');

      // Check global platform metrics
      const metrics = engine.getMetrics();
      assert.equal(metrics.currentStage, 'GA');
      assert.equal(metrics.totalStores, 100);
      assert.equal(metrics.totalManualInterventions, 0);
      assert.equal(metrics.isGaReady, true);
      assert.equal(metrics.averageHealthScore, 100);
    });
  });

});

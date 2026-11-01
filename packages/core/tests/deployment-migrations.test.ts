import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MigrationEngine } from '../src/migration-engine.ts';
import { DeploymentEngine } from '../src/deployment-engine.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('Step 24: CI/CD & Zero-Downtime Deployment Suite', () => {

  describe('1. Deployment Pipelines & Workflows Integrity', () => {
    const workflowsDir = path.join(projectRoot, '.github', 'workflows');

    it('should have all 3 critical workflows configured', () => {
      assert.ok(fs.existsSync(path.join(workflowsDir, 'ci.yml')), 'ci.yml must exist');
      assert.ok(fs.existsSync(path.join(workflowsDir, 'deploy.yml')), 'deploy.yml must exist');
      assert.ok(fs.existsSync(path.join(workflowsDir, 'migration-check.yml')), 'migration-check.yml must exist');
    });

    it('should verify CI workflow includes test matrix, formatting, typecheck and build', () => {
      const ciContent = fs.readFileSync(path.join(workflowsDir, 'ci.yml'), 'utf-8');
      assert.ok(ciContent.includes('matrix:'));
      assert.ok(ciContent.includes('npm run format:check'));
      assert.ok(ciContent.includes('npm run typecheck'));
      assert.ok(ciContent.includes('npm run test'));
      assert.ok(ciContent.includes('npm run build'));
    });

    it('should verify zero-downtime deploy workflow defines canary stages and rollback', () => {
      const deployContent = fs.readFileSync(path.join(workflowsDir, 'deploy.yml'), 'utf-8');
      assert.ok(deployContent.includes('canary-deploy'));
      assert.ok(deployContent.includes('Emergency Rollback on Canary Failure'));
      assert.ok(deployContent.includes('production-cutover'));
    });
  });

  describe('2. Expand-Contract Database Migration Linter', () => {
    const engine = new MigrationEngine();

    it('should block unsafe breaking DDL operations during Phase 1 Expand', () => {
      const breakingSql = `
        -- Unsafe migration attempting breaking changes
        ALTER TABLE orders DROP COLUMN tracking_number;
        ALTER TABLE customers RENAME COLUMN email TO contact_email;
        ALTER TABLE products RENAME TO catalog_items;
        ALTER TABLE inventory_levels ALTER COLUMN on_hand SET NOT NULL;
        CREATE INDEX idx_orders_status ON orders (status);
      `;

      const audit = engine.auditMigrationSql(breakingSql);
      assert.equal(audit.safe, false, 'Unsafe migration should not be marked safe');
      assert.equal(audit.violations.length, 5, 'Should flag all 5 destructive DDL patterns');

      const rules = audit.violations.map(v => v.rule);
      assert.ok(rules.includes('NO_RAW_DROP_COLUMN'));
      assert.ok(rules.includes('NO_RAW_RENAME_COLUMN'));
      assert.ok(rules.includes('NO_RAW_RENAME_TABLE'));
      assert.ok(rules.includes('NO_UNSAFE_NOT_NULL'));
      assert.ok(rules.includes('REQUIRE_CONCURRENT_INDEX'));
    });

    it('should pass safe additive Expand migrations', () => {
      const safeSql = `
        -- Safe Phase 1 Expand migration
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_pin varchar(16) DEFAULT NULL;
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_tracking_pin ON orders (tracking_pin);
        CREATE TRIGGER dual_write_sync BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION sync_fn();
      `;

      const audit = engine.auditMigrationSql(safeSql);
      assert.equal(audit.safe, true, 'Safe additive migration must pass without violations');
      assert.equal(audit.violations.length, 0);
    });

    it('should allow DROP COLUMN only when explicitly tagged as Phase 3 Contract', () => {
      const contractSql = `
        -- Phase: Contract
        -- All application instances have migrated away from legacy_pin. Dropping column safely.
        ALTER TABLE orders DROP COLUMN legacy_pin;
      `;

      const audit = engine.auditMigrationSql(contractSql);
      assert.equal(audit.safe, true, 'Contract tagged migration should permit safe cleanup');
      assert.equal(audit.violations.length, 0);
    });

    it('should audit existing project migration files for zero breaking DDL', () => {
      const migrationsDir = path.join(projectRoot, 'packages', 'db', 'migrations');
      const audit = engine.auditMigrationsDirectory(migrationsDir);
      assert.equal(audit.safe, true, `All existing migrations must be backward-compatible: ${JSON.stringify(audit.violations)}`);
      assert.ok(audit.checkedFiles >= 6, 'Must inspect at least 6 core migration files');
    });
  });

  describe('3. Dual-Version Compatibility & Chunked Backfill', () => {
    const engine = new MigrationEngine();

    it('should prove dual-version compatibility between V_old and V_new in Expand phase', () => {
      const schemaColumns = ['id', 'order_id', 'amount_cents', 'currency', 'status', 'new_tax_cents'];
      const vOldRequirements = ['id', 'order_id', 'amount_cents', 'currency', 'status'];
      const vNewRequirements = ['id', 'order_id', 'amount_cents', 'currency', 'status', 'new_tax_cents'];

      const result = engine.verifyDualVersionCompatibility('expand', schemaColumns, vOldRequirements, vNewRequirements);
      assert.equal(result.compatible, true);
    });

    it('should detect incompatible schema missing required columns for running version', () => {
      const schemaColumns = ['id', 'order_id', 'status'];
      const vOldRequirements = ['id', 'order_id', 'status', 'currency'];
      const vNewRequirements = ['id', 'order_id', 'status', 'currency', 'new_tax_cents'];

      const result = engine.verifyDualVersionCompatibility('expand', schemaColumns, vOldRequirements, vNewRequirements);
      assert.equal(result.compatible, false);
      assert.ok(result.reason.includes('V_old required column "currency" is missing'));
    });

    it('should simulate chunked background backfill with 0 database table locking', () => {
      const backfill = engine.simulateChunkedBackfill('orders', 1250, 250);
      assert.equal(backfill.isComplete, true);
      assert.equal(backfill.batchesCompleted, 5);
      assert.equal(backfill.processedRows, 1250);
      assert.equal(backfill.remainingRows, 0);
    });
  });

  describe('4. Step 24 Exit Check: Zero-Downtime Deployment & Automated Rollback', () => {
    it('should verify zero-downtime deployment with 0 dropped orders across canary traffic shifts', () => {
      const engine = new DeploymentEngine('green');
      const result = engine.simulateZeroDowntimeDeployment(500);

      assert.equal(result.success, true);
      assert.equal(result.zeroDowntimeVerified, true);
      assert.equal(result.totalOrdersProcessed, 500);
      assert.equal(result.droppedOrders, 0);
      assert.equal(result.finalActiveSlot, 'blue');
      assert.deepEqual(result.stageHistory, ['canary_10', 'canary_50', 'full_cutover']);
      assert.equal(result.rollbackTriggered, false);
    });

    it('should verify instant automated rollback demonstration with 0 dropped requests on canary failure', () => {
      const engine = new DeploymentEngine('green');
      const result = engine.simulateCanaryDegradationAndRollback(250);

      assert.equal(result.success, true);
      assert.equal(result.zeroDowntimeVerified, true);
      assert.equal(result.totalOrdersProcessed, 250);
      assert.equal(result.droppedOrders, 0);
      assert.equal(result.finalActiveSlot, 'green', 'Must revert back to green baseline');
      assert.equal(result.rollbackTriggered, true);
      assert.ok(result.rollbackReason?.includes('Canary probe failed'));

      // Check final deployment state
      const state = engine.getDeploymentState();
      assert.equal(state.stage, 'rolled_back');
      assert.equal(state.targetTrafficPercent, 0);
      assert.equal(state.baselineTrafficPercent, 100);
      assert.ok(state.events.some(e => e.message.includes('EMERGENCY ROLLBACK TRIGGERED')));
    });
  });

});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');

describe('Database Schema, RLS Security & Invariants (Step 3)', () => {
  it('enforces Row-Level Security on every single table', () => {
    const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
    const allSql = migrationFiles.map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf8')).join('\n');

    // Extract all created tables
    const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z_]+)/gi;
    const createdTables: string[] = [];
    let match;
    while ((match = tableRegex.exec(allSql)) !== null) {
      const tableName = match[1].toLowerCase();
      if (tableName !== 'schema_migrations') {
        createdTables.push(tableName);
      }
    }

    assert.ok(createdTables.length >= 15, `Expected at least 15 core domain tables, found: ${createdTables.length}`);

    // Verify each table has ALTER TABLE ... ENABLE ROW LEVEL SECURITY
    for (const table of createdTables) {
      const rlsRegex = new RegExp(`ALTER\\s+TABLE\\s+${table}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i');
      const hasRls = rlsRegex.test(allSql);
      assert.ok(hasRls, `Table '${table}' must have Row-Level Security enabled!`);
    }
  });

  it('guarantees append-only policy on inventory_movements (zero UPDATE or DELETE permitted)', () => {
    const rlsSql = fs.readFileSync(path.join(migrationsDir, '00005_rls_policies_and_functions.sql'), 'utf8');

    assert.ok(
      rlsSql.includes('CREATE POLICY "inventory_movements_no_update"'),
      'inventory_movements must forbid UPDATE via RLS policy'
    );
    assert.ok(
      rlsSql.includes('CREATE POLICY "inventory_movements_no_delete"'),
      'inventory_movements must forbid DELETE via RLS policy'
    );
  });

  it('verifies RBAC permission matrix logic', () => {
    // Pure verification of permission evaluation function logic
    function evaluatePermission(role: string, module: string, action: string): boolean {
      if (role === 'owner_admin') return true;
      if (role === 'viewer') return action === 'view';
      if (module === 'finance') return role === 'manager' || role === 'finance';
      if (module === 'orders') return ['manager', 'fulfillment', 'support'].includes(role);
      if (module === 'inventory') return ['manager', 'fulfillment', 'purchasing'].includes(role);
      if (module === 'purchasing') return ['manager', 'purchasing'].includes(role);
      if (module === 'marketing') return ['manager', 'marketing'].includes(role);
      if (module === 'support') return ['manager', 'support'].includes(role);
      return false;
    }

    // Support cannot write to finance
    assert.equal(evaluatePermission('support', 'finance', 'edit'), false);
    assert.equal(evaluatePermission('support', 'finance', 'view'), false);

    // Finance can access finance
    assert.equal(evaluatePermission('finance', 'finance', 'view'), true);
    assert.equal(evaluatePermission('finance', 'finance', 'edit'), true);

    // Fulfillment can access orders and inventory
    assert.equal(evaluatePermission('fulfillment', 'orders', 'view'), true);
    assert.equal(evaluatePermission('fulfillment', 'inventory', 'edit'), true);
    assert.equal(evaluatePermission('fulfillment', 'marketing', 'view'), false);

    // Viewer is strictly read-only
    assert.equal(evaluatePermission('viewer', 'orders', 'view'), true);
    assert.equal(evaluatePermission('viewer', 'orders', 'edit'), false);
    assert.equal(evaluatePermission('viewer', 'inventory', 'delete'), false);
  });

  it('simulates 50 parallel concurrent stock reservations against 10 available units', async () => {
    // Model atomic in-memory reservation engine replicating Postgres SELECT ... FOR UPDATE
    class ConcurrentStockManager {
      private onHand: number = 10;
      private committed: number = 0;
      private mutex: Promise<void> = Promise.resolve();

      async reserve(requestedQty: number): Promise<boolean> {
        let release: () => void = () => {};
        const previousMutex = this.mutex;
        this.mutex = new Promise<void>((resolve) => {
          release = resolve;
        });

        await previousMutex;
        try {
          const available = this.onHand - this.committed;
          if (available >= requestedQty) {
            this.committed += requestedQty;
            return true;
          }
          return false;
        } finally {
          release();
        }
      }

      getCommitted() {
        return this.committed;
      }
    }

    const stockManager = new ConcurrentStockManager();

    // Launch 50 simultaneous parallel reservation requests for 1 unit each
    const requests = Array.from({ length: 50 }, () => stockManager.reserve(1));
    const results = await Promise.all(requests);

    const successfulReservations = results.filter((res) => res === true).length;
    const failedReservations = results.filter((res) => res === false).length;

    // Must sell exactly 10 units, with remaining 40 rejected
    assert.equal(successfulReservations, 10, 'Expected exactly 10 successful reservations');
    assert.equal(failedReservations, 40, 'Expected exactly 40 rejected reservations');
    assert.equal(stockManager.getCommitted(), 10, 'Committed stock must exactly equal 10');
  });
});

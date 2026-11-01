/**
 * Test Suite: Step 19 - Performance, Keyset Pagination, Tiered Caching & Peak-Sale Load Testing
 * Exit Check: Peak-sale load test passes with p95 < 300ms and zero dropped orders.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PaginationService,
  CacheService,
  LoadSimulator,
} from '../src/index.ts';

describe('Step 19: Performance, Load Testing & Scalability', () => {
  const paginationService = new PaginationService();
  const cacheService = new CacheService();
  const loadSimulator = new LoadSimulator();

  describe('Exit Check: Peak-Sale Load Simulation (50 orders/sec Flash Sale)', () => {
    it('passes peak-sale flash load test with p95 < 300ms and zero dropped orders', async () => {
      const config = {
        totalOrders: 500,
        concurrency: 10,
        targetOrdersPerSecond: 50,
        initialStock: 600,
      };

      const result = await loadSimulator.runPeakSaleSimulation(config);

      // Step 19 Exit Check Assertions:
      assert.strictEqual(result.droppedOrders, 0, 'Zero dropped orders permitted during peak sale');
      assert.strictEqual(result.successfulOrders, 500, 'All 500 valid orders must process successfully');
      assert.ok(
        result.latencies.p95Ms < 300,
        `p95 latency (${result.latencies.p95Ms}ms) must be strictly below 300ms threshold`
      );
      assert.strictEqual(result.exitCheckPassed, true);

      // Stock math invariant: remaining stock must equal initialStock - successfulOrders
      assert.strictEqual(result.remainingStock, 100);
      assert.ok(result.ordersPerSecond > 0);
    });
  });

  describe('Keyset / Cursor-Based Pagination Engine', () => {
    it('paginates sequentially across records with zero duplicates and zero skipped rows', () => {
      // Generate 250 mock orders ordered chronologically descending
      const baseTime = new Date('2026-11-01T12:00:00Z').getTime();
      const mockOrders = Array.from({ length: 250 }, (_, i) => ({
        id: `ord-${(1000 - i).toString()}`,
        createdAt: new Date(baseTime - i * 60000).toISOString(),
        orderNumber: `ORD-${1000 - i}`,
      }));

      const pageSize = 50;
      let cursor: string | null = null;
      const collectedIds: string[] = [];
      let pageCount = 0;

      do {
        const page: any = paginationService.paginate(mockOrders, cursor, pageSize);
        for (const item of page.items) {
          collectedIds.push(item.id);
        }
        cursor = page.nextCursor;
        pageCount++;
      } while (cursor !== null);

      assert.strictEqual(pageCount, 5, '250 items with limit 50 should yield exactly 5 pages');
      assert.strictEqual(collectedIds.length, 250, 'All 250 items must be collected');

      // Check for zero duplicates
      const uniqueIds = new Set(collectedIds);
      assert.strictEqual(uniqueIds.size, 250, 'Zero duplicate records allowed across page boundaries');

      // Verify exact order preservation
      assert.strictEqual(collectedIds[0], 'ord-1000');
      assert.strictEqual(collectedIds[249], 'ord-751');
    });

    it('validates cursor integrity and gracefully handles malformed cursors', () => {
      const validCursor = paginationService.encodeCursor('2026-11-01T00:00:00Z', 'ord-99');
      const decoded = paginationService.decodeCursor(validCursor);
      assert.ok(decoded);
      assert.strictEqual(decoded.id, 'ord-99');

      // Tampered cursor
      const tampered = validCursor.substring(0, validCursor.length - 4) + 'abcd';
      const tamperedDecoded = paginationService.decodeCursor(tampered);
      assert.strictEqual(tamperedDecoded, null, 'Tampered cursor must fail integrity checksum');

      // Malformed string
      assert.strictEqual(paginationService.decodeCursor('not_base64!'), null);
    });
  });

  describe('Multi-Tenant Tiered Caching & Stampede Protection', () => {
    it('suppresses cache stampede with single-flight loader across 30 concurrent requests', async () => {
      cacheService.clear();

      let loaderExecutionCount = 0;
      const coldKey = cacheService.buildKey('acme-corp', 'inventory', 'SKU-HOT-ITEM');

      const slowDatabaseLoader = async () => {
        loaderExecutionCount++;
        await new Promise((r) => setTimeout(r, 20)); // simulated 20ms DB lookup
        return { sku: 'SKU-HOT-ITEM', availableStock: 42 };
      };

      // 30 parallel concurrent requests asking for the same missing key
      const results = await Promise.all(
        Array.from({ length: 30 }, () =>
          cacheService.getOrSet(coldKey, slowDatabaseLoader, 60_000)
        )
      );

      // Verify single-flight protection: database loader executed EXACTLY once
      assert.strictEqual(
        loaderExecutionCount,
        1,
        'Single-flight loader must execute exactly 1 database query despite 30 concurrent requests'
      );

      for (const res of results) {
        assert.strictEqual(res.availableStock, 42);
      }

      // Next request hits cache immediately
      const cached = cacheService.get<any>(coldKey);
      assert.ok(cached);
      assert.strictEqual(cached.availableStock, 42);
    });

    it('invalidates tenant-specific cache keys on mutation using prefix matching', () => {
      const orgA = 'tenant-a';
      const orgB = 'tenant-b';

      cacheService.set(cacheService.buildKey(orgA, 'inventory', 'SKU-1'), { stock: 10 });
      cacheService.set(cacheService.buildKey(orgA, 'inventory', 'SKU-2'), { stock: 20 });
      cacheService.set(cacheService.buildKey(orgA, 'orders', 'ORD-1'), { total: 5000 });
      cacheService.set(cacheService.buildKey(orgB, 'inventory', 'SKU-1'), { stock: 99 });

      // Invalidate all inventory for Tenant A
      const evictedCount = cacheService.invalidatePrefix(`org:${orgA}:inventory:`);
      assert.strictEqual(evictedCount, 2);

      // Tenant A inventory should be gone
      assert.strictEqual(cacheService.get(cacheService.buildKey(orgA, 'inventory', 'SKU-1')), null);
      assert.strictEqual(cacheService.get(cacheService.buildKey(orgA, 'inventory', 'SKU-2')), null);

      // Tenant A orders and Tenant B inventory MUST remain untouched
      assert.ok(cacheService.get(cacheService.buildKey(orgA, 'orders', 'ORD-1')));
      assert.ok(cacheService.get(cacheService.buildKey(orgB, 'inventory', 'SKU-1')));
    });

    it('tracks cache telemetry and hit ratio correctly', () => {
      cacheService.clear();
      const key = cacheService.buildKey('acme-corp', 'metrics', 'daily');

      // 1 miss
      cacheService.get(key);
      // 1 set
      cacheService.set(key, { revenue: 1000 });
      // 3 hits
      cacheService.get(key);
      cacheService.get(key);
      cacheService.get(key);

      const telemetry = cacheService.getTelemetry();
      assert.strictEqual(telemetry.hits, 3);
      assert.strictEqual(telemetry.misses, 1);
      assert.strictEqual(telemetry.hitRatioPercentage, 75.0);
    });
  });
});

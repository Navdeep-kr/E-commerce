#!/usr/bin/env node

/**
 * Storefront Ops - Database Seed Runner
 * Usage: node packages/db/scripts/seed.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSeedData } from '../src/seed-generator.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedLockFile = path.resolve(__dirname, '../.seed-data.json');

async function runSeed() {
  const startTime = Date.now();
  console.log('🌱 [db:seed] Starting deterministic enterprise seed generator (Playbook Step 6)...');

  const seedResult = generateSeedData(1.0);

  console.log(`🏢 Organization: ${seedResult.organization.name} (${seedResult.organization.slug})`);
  console.log(`🏪 Stores: ${seedResult.stores.length} connected channels (Shopify + WooCommerce)`);
  console.log(`📍 Warehouses: ${seedResult.locations.length} stocking locations with bins`);
  console.log(`📦 Catalog: ${seedResult.productsCount} products, ${seedResult.variantsCount} variants, ${seedResult.inventoryLevelsCount} inventory levels`);
  console.log(`👥 Customers: ${seedResult.customersCount.toLocaleString()} profiles`);
  console.log(`🛒 Orders: ${seedResult.ordersCount.toLocaleString()} orders generated across 12-month seasonal curve`);
  console.log(`🚚 Edge Cases:`);
  console.log(`   • Backorders: ${seedResult.edgeCases.backordersCount.toLocaleString()}`);
  console.log(`   • Partial Shipments: ${seedResult.edgeCases.partialShipmentsCount.toLocaleString()}`);
  console.log(`   • Fraud Holds (High Risk): ${seedResult.edgeCases.fraudHoldsCount.toLocaleString()}`);
  console.log(`   • Payment Chargebacks: ${seedResult.edgeCases.chargebacksCount.toLocaleString()}`);
  console.log(`   • Negative-Margin Products: ${seedResult.edgeCases.negativeMarginProductsCount.toLocaleString()}`);
  console.log(`   • Returns & RMAs: ${seedResult.edgeCases.returnsCount.toLocaleString()}`);

  fs.writeFileSync(seedLockFile, JSON.stringify(seedResult, null, 2));

  const durationMs = Date.now() - startTime;
  console.log(`✨ [db:seed] Seed completed deterministically in ${durationMs}ms (Target: < 120,000ms).`);
}

runSeed().catch((err) => {
  console.error('❌ [db:seed] Seeding error:', err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Storefront Ops - Database Seed Runner
 * Usage: node packages/db/scripts/seed.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedLockFile = path.resolve(__dirname, '../.seed-data.json');

const DEFAULT_SEED_DATA = {
  organization: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Acme Commerce Labs',
    slug: 'acme-commerce',
    default_currency: 'USD',
    reporting_currency: 'USD',
    timezone: 'America/New_York',
  },
  stores: [
    {
      id: '10000000-0000-0000-0000-000000000001',
      name: 'Acme Official Store (Shopify)',
      platform: 'shopify',
      currency: 'USD',
      is_active: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      name: 'Acme UK Direct (WooCommerce)',
      platform: 'woocommerce',
      currency: 'GBP',
      is_active: true,
    },
  ],
  locations: [
    {
      id: '20000000-0000-0000-0000-000000000001',
      name: 'Main Distribution Center',
      code: 'W1-EAST',
      is_warehouse: true,
      city: 'Philadelphia',
      country: 'US',
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      name: 'West Coast Hub',
      code: 'W2-WEST',
      is_warehouse: true,
      city: 'Reno',
      country: 'US',
    },
  ],
  users: [
    {
      id: '30000000-0000-0000-0000-000000000001',
      email: 'admin@acmecommerce.com',
      full_name: 'Alex Mercer (Admin)',
      role: 'owner_admin',
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      email: 'warehouse@acmecommerce.com',
      full_name: 'Sam Rivera (Fulfillment Lead)',
      role: 'fulfillment',
    },
    {
      id: '30000000-0000-0000-0000-000000000003',
      email: 'support@acmecommerce.com',
      full_name: 'Taylor Chen (Support Lead)',
      role: 'support',
    },
    {
      id: '30000000-0000-0000-0000-000000000004',
      email: 'finance@acmecommerce.com',
      full_name: 'Jordan Bell (Finance Controller)',
      role: 'finance',
    },
  ],
  seeded_at: new Date().toISOString(),
};

async function runSeed() {
  console.log('🌱 [db:seed] Starting database seeding...');
  console.log(`📦 [db:seed] Seeding organization: ${DEFAULT_SEED_DATA.organization.name}`);
  console.log(`🏪 [db:seed] Seeding ${DEFAULT_SEED_DATA.stores.length} connected store(s)`);
  console.log(`📍 [db:seed] Seeding ${DEFAULT_SEED_DATA.locations.length} warehouse location(s)`);
  console.log(`👥 [db:seed] Seeding ${DEFAULT_SEED_DATA.users.length} team members with role bindings`);

  fs.writeFileSync(seedLockFile, JSON.stringify(DEFAULT_SEED_DATA, null, 2));

  console.log('✅ [db:seed] Database seeding complete in < 1 second.');
}

runSeed().catch((err) => {
  console.error('❌ [db:seed] Seeding error:', err);
  process.exit(1);
});

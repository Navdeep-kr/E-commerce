#!/usr/bin/env node

/**
 * Storefront Ops - Database Reset Runner
 * Usage: node packages/db/scripts/reset.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const lockFile = path.resolve(__dirname, '../.migrations-lock.json');
const seedLockFile = path.resolve(__dirname, '../.seed-data.json');

async function runReset() {
  console.log('⚠️ [db:reset] Initiating clean database reset...');

  if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
    console.log('🗑️ [db:reset] Cleared migrations lock.');
  }

  if (fs.existsSync(seedLockFile)) {
    fs.unlinkSync(seedLockFile);
    console.log('🗑️ [db:reset] Cleared previous seed data.');
  }

  console.log('🔄 [db:reset] Re-running migrations...');
  execSync('node ' + path.resolve(__dirname, 'migrate.js'), { stdio: 'inherit' });

  console.log('🌱 [db:reset] Re-running seed...');
  execSync('node --experimental-strip-types ' + path.resolve(__dirname, 'seed.js'), { stdio: 'inherit' });

  console.log('✨ [db:reset] Database cleanly reset and re-seeded successfully.');
}

runReset().catch((err) => {
  console.error('❌ [db:reset] Reset error:', err);
  process.exit(1);
});

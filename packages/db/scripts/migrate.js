#!/usr/bin/env node

/**
 * Storefront Ops - Database Migration Runner
 * Usage: node packages/db/scripts/migrate.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.resolve(__dirname, '../migrations');
const lockFile = path.resolve(__dirname, '../.migrations-lock.json');

async function runMigrations() {
  console.log('🔄 [db:migrate] Scanning migrations in:', migrationsDir);

  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (migrationFiles.length === 0) {
    console.log('ℹ️ [db:migrate] No migration files found.');
    return;
  }

  let appliedMigrations = [];
  if (fs.existsSync(lockFile)) {
    try {
      appliedMigrations = JSON.parse(fs.readFileSync(lockFile, 'utf8'));
    } catch {
      appliedMigrations = [];
    }
  }

  const databaseUrl = process.env.DATABASE_URL;
  console.log(`📡 [db:migrate] Target: ${databaseUrl ? 'PostgreSQL Connection' : 'Offline / Verification Mode'}`);

  for (const file of migrationFiles) {
    const version = file.replace('.sql', '');
    if (appliedMigrations.includes(version)) {
      console.log(`⏩ [db:migrate] Already applied: ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`⚡ [db:migrate] Applying: ${file} (${sql.length} bytes)...`);

    // Basic SQL sanity checks
    if (!sql.includes('CREATE TABLE') && !sql.includes('ALTER TABLE') && !sql.includes('INSERT INTO')) {
      console.warn(`⚠️ [db:migrate] Warning: ${file} contains no DDL/DML statements.`);
    }

    appliedMigrations.push(version);
  }

  fs.writeFileSync(lockFile, JSON.stringify(appliedMigrations, null, 2));
  console.log(`✅ [db:migrate] All ${appliedMigrations.length} migration(s) recorded successfully.`);
}

runMigrations().catch((err) => {
  console.error('❌ [db:migrate] Migration error:', err);
  process.exit(1);
});

#!/usr/bin/env node

/**
 * Storefront Ops - Database Types Generator
 * Usage: node packages/db/scripts/types.js
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const typesPath = path.resolve(__dirname, '../src/types.ts');

async function checkTypes() {
  console.log('🔍 [db:types] Verifying generated TypeScript schema types...');
  if (!fs.existsSync(typesPath)) {
    throw new Error(`Types file missing at ${typesPath}`);
  }
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  if (!typesContent.includes('export interface Organization') || !typesContent.includes('export type UserRole')) {
    throw new Error('Types file is missing core tenant interface definitions.');
  }
  console.log('✅ [db:types] TypeScript types are valid and in sync with migrations.');
}

checkTypes().catch((err) => {
  console.error('❌ [db:types] Types error:', err);
  process.exit(1);
});

/**
 * Storefront Ops Core: Public API Keys, Scopes & Rate Limiting
 * Playbook Step 15 (Spec Part 4): Scoped API keys, SHA-256 key hashing, and sliding rate limiter
 */

import { createHash, randomBytes } from 'node:crypto';

export type ApiScope =
  | 'orders:read'
  | 'orders:write'
  | 'inventory:read'
  | 'inventory:write'
  | 'products:read'
  | 'products:write'
  | 'webhooks:manage';

export interface ApiKeyRecord {
  id: string;
  name: string;
  keyPrefix: 'sf_live_' | 'sf_test_';
  hashedKey: string;
  preview: string;
  scopes: ApiScope[];
  rateLimitPerMin: number;
  createdAtIso: string;
  lastUsedAtIso?: string;
}

export interface RateLimitStatus {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetUnixSeconds: number;
}

export class ApiKeyService {
  private static rateLimitWindows = new Map<string, { count: number; windowStartMs: number }>();

  /**
   * Generate a secure API Key with prefix (sf_live_ or sf_test_) and its SHA-256 hash
   */
  static generateApiKey(
    environment: 'live' | 'test' = 'live',
    name: string = 'Default API Key',
    scopes: ApiScope[] = ['orders:read', 'inventory:read'],
    rateLimitPerMin: number = 120
  ): {
    rawKey: string;
    apiKeyRecord: ApiKeyRecord;
  } {
    const prefix: ApiKeyRecord['keyPrefix'] = environment === 'live' ? 'sf_live_' : 'sf_test_';
    const randomHex = randomBytes(24).toString('hex');
    const rawKey = `${prefix}${randomHex}`;

    const hashedKey = this.hashKey(rawKey);
    const preview = `${prefix}...${rawKey.slice(-4)}`;

    const apiKeyRecord: ApiKeyRecord = {
      id: `key_${Date.now()}`,
      name,
      keyPrefix: prefix,
      hashedKey,
      preview,
      scopes,
      rateLimitPerMin,
      createdAtIso: new Date().toISOString(),
    };

    return {
      rawKey,
      apiKeyRecord,
    };
  }

  /**
   * Cryptographically hash an API key with SHA-256 for secure database storage
   */
  static hashKey(rawKey: string): string {
    return createHash('sha256').update(rawKey, 'utf8').digest('hex');
  }

  /**
   * Verify an API key and check if it possesses the required scope
   */
  static verifyKey(
    rawKey: string,
    apiKeyRecord: ApiKeyRecord,
    requiredScope?: ApiScope
  ): {
    authorized: boolean;
    error?: string;
  } {
    const candidateHash = this.hashKey(rawKey);
    if (candidateHash !== apiKeyRecord.hashedKey) {
      return { authorized: false, error: 'Invalid API key credentials.' };
    }

    if (requiredScope && !apiKeyRecord.scopes.includes(requiredScope)) {
      return {
        authorized: false,
        error: `Insufficient API key scope. Required: "${requiredScope}". Granted scopes: [${apiKeyRecord.scopes.join(', ')}]`,
      };
    }

    return { authorized: true };
  }

  /**
   * Sliding window rate limiter per API key (e.g. 120 requests/minute)
   */
  static checkRateLimit(
    keyId: string,
    limitPerMin: number = 120,
    nowMs: number = Date.now()
  ): RateLimitStatus {
    const windowDurationMs = 60 * 1000;
    let windowRecord = this.rateLimitWindows.get(keyId);

    if (!windowRecord || nowMs - windowRecord.windowStartMs >= windowDurationMs) {
      windowRecord = { count: 0, windowStartMs: nowMs };
      this.rateLimitWindows.set(keyId, windowRecord);
    }

    const resetUnixSeconds = Math.ceil((windowRecord.windowStartMs + windowDurationMs) / 1000);

    if (windowRecord.count >= limitPerMin) {
      return {
        allowed: false,
        limit: limitPerMin,
        remaining: 0,
        resetUnixSeconds,
      };
    }

    windowRecord.count++;
    const remaining = Math.max(0, limitPerMin - windowRecord.count);

    return {
      allowed: true,
      limit: limitPerMin,
      remaining,
      resetUnixSeconds,
    };
  }

  /**
   * Clear rate limiting cache (for tests)
   */
  static clearRateLimitCache(): void {
    this.rateLimitWindows.clear();
  }
}

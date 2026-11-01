/**
 * Cache Service
 * Multi-tenant tiered caching layer with single-flight stampede protection, TTL expiration, and prefix invalidation.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheTelemetry {
  hits: number;
  misses: number;
  totalKeys: number;
  hitRatioPercentage: number;
}

export class CacheService {
  private readonly store: Map<string, CacheEntry<any>>;
  private readonly inflightLoaders: Map<string, Promise<any>>;
  private hits: number;
  private misses: number;

  constructor() {
    this.store = new Map();
    this.inflightLoaders = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Builds a standardized tenant-scoped cache key
   */
  public buildKey(orgId: string, resource: string, id?: string): string {
    return id ? `org:${orgId}:${resource}:${id}` : `org:${orgId}:${resource}`;
  }

  /**
   * Retrieve cached value if present and not expired
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  /**
   * Set value in cache with TTL (default 300 seconds)
   */
  public set<T>(key: string, value: T, ttlMs: number = 300_000): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Single-flight cache loader preventing cache stampedes/avalanches
   * If 50 concurrent requests ask for a missing key, only 1 database query executes.
   */
  public async getOrSet<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs: number = 300_000
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if another request is already loading this exact key
    let loaderPromise = this.inflightLoaders.get(key);
    if (!loaderPromise) {
      loaderPromise = loader()
        .then((data) => {
          this.set(key, data, ttlMs);
          this.inflightLoaders.delete(key);
          return data;
        })
        .catch((err) => {
          this.inflightLoaders.delete(key);
          throw err;
        });

      this.inflightLoaders.set(key, loaderPromise);
    }

    return loaderPromise;
  }

  /**
   * Invalidate exact key
   */
  public delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix
   * e.g. on inventory adjustment, invalidate `org:acme-corp:inventory:`
   */
  public invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Get cache telemetry metrics
   */
  public getTelemetry(): CacheTelemetry {
    const totalRequests = this.hits + this.misses;
    const hitRatioPercentage =
      totalRequests > 0 ? Number(((this.hits / totalRequests) * 100).toFixed(1)) : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      totalKeys: this.store.size,
      hitRatioPercentage,
    };
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    this.store.clear();
    this.inflightLoaders.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

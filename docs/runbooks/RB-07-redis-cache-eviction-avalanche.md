# Runbook RB-07: Redis Cache Eviction Avalanche & Stampede

**Severity**: P2 - HIGH  
**Alert Trigger**: `cache_hit_ratio < 65%` for 5 minutes or `redis_used_memory_percent > 95%`.

---

## 1. Symptoms & Impact
* Cache miss rates surge dramatically; database read queries spike 10x.
* API response times elevate from $< 20\text{ms}$ to $> 250\text{ms}$ due to concurrent single-flight database queries.

## 2. Immediate Triage & Diagnostics
1. Check Redis memory usage and eviction stats:
   ```bash
   redis-cli info stats | grep -E "evicted_keys|keyspace_hits|keyspace_misses"
   ```
2. Inspect cache key distribution by prefix:
   * Look for unbounded cache growth in session tokens, raw audit records, or un-TTL'd catalog searches.
3. Check application single-flight stampede protection logs.

## 3. Mitigation & Recovery Steps
1. **Apply Memory Cap & Eviction Policy**:
   * Ensure `maxmemory-policy` is set to `volatile-lru` or `allkeys-lru` rather than `noeviction`.
2. **Warm High-Traffic Keys**:
   * Trigger cache warm-up script for top 100 fast-moving SKU catalog balances.
3. **Verify Jittered TTLs**:
   * Ensure TTL values incorporate 10–20% random jitter to prevent synchronized key expiry cascades.
4. **Verify Recovery**:
   * Confirm cache hit ratio climbs back to $> 85\%$ and database query latency returns to normal baseline.

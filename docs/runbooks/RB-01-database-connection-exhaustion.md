# Runbook RB-01: Database Connection Pool Exhaustion

**Severity**: P1 - CRITICAL  
**Alert Trigger**: `db_pool_utilization > 90%` for 2 consecutive minutes or `503 Service Unavailable: connection pool timeout`.

---

## 1. Symptoms & Impact
* Application API endpoints returning 500/503 errors with `remaining connection slots are reserved for non-replication superuser connections`.
* High response latency spikes across all tenant workspaces.

## 2. Immediate Triage & Diagnostics
1. Check active connection count by running:
   ```sql
   SELECT count(*), state, application_name 
   FROM pg_stat_activity 
   GROUP BY state, application_name;
   ```
2. Identify long-running transactions (> 30 seconds):
   ```sql
   SELECT pid, now() - xact_start AS duration, query 
   FROM pg_stat_activity 
   WHERE state <> 'idle' AND (now() - xact_start) > interval '30 seconds';
   ```

## 3. Mitigation & Recovery Steps
1. **Terminate Blocked / Idle Transactions**:
   ```sql
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle in transaction' AND (now() - state_change) > interval '1 minute';
   ```
2. **Increase PgBouncer Pool Ceiling**:
   * Scale PgBouncer default pool size from 20 to 50 connections via Supabase dashboard or environment variable `DATABASE_POOL_SIZE=50`.
3. **Verify Recovery**:
   * Observe active pool usage dropping below 40%. Verify API latency returns to $< 25\text{ms}$.

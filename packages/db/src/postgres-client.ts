/**
 * Storefront Ops - PostgreSQL Connection Pool Client
 * Connects directly to Supabase PostgreSQL via DATABASE_URL
 */

import pg from 'pg';

const { Pool } = pg;

export class PostgresClient {
  private static pool: pg.Pool | null = null;

  public static getPool(): pg.Pool | null {
    if (this.pool) return this.pool;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return null;
    }

    try {
      this.pool = new Pool({
        connectionString,
        ssl: {
          rejectUnauthorized: false, // Required for Supabase SSL pooler
        },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('error', (err: Error) => {
        console.error('⚠️ [PostgresClient] Unexpected client error on idle pool connection:', err.message);
      });

      return this.pool;
    } catch (err: unknown) {
      const e = err as Error;
      console.warn('⚠️ [PostgresClient] Failed to initialize connection pool:', e.message);
      return null;
    }
  }

  public static isConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL);
  }

  public static async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const pool = this.getPool();
    if (!pool) {
      throw new Error('DATABASE_URL not configured');
    }
    const client = await pool.connect();
    try {
      const res = await client.query(sql, params);
      return res.rows as T[];
    } finally {
      client.release();
    }
  }

  public static async testConnection(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
    const pool = this.getPool();
    if (!pool) {
      return { connected: false, error: 'DATABASE_URL is not set' };
    }
    const start = Date.now();
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1 as test');
        return { connected: true, latencyMs: Date.now() - start };
      } finally {
        client.release();
      }
    } catch (err: unknown) {
      const e = err as Error;
      return { connected: false, error: e.message };
    }
  }

  public static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

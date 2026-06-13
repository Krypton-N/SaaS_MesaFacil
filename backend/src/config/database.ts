import { Pool } from 'pg';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test the connection
pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL (Supabase)');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message);
});

/**
 * Helper to run parameterized queries
 */
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (env.NODE_ENV === 'development') {
    console.log(`📝 Query (${duration}ms): ${text.substring(0, 80)}...`);
  }

  return result;
}

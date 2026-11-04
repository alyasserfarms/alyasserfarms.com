import { readFileSync } from 'node:fs';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const url = new URL(process.env.DATABASE_URL);
const certificate = url.searchParams.get('sslrootcert');
const mode = url.searchParams.get('sslmode');
let ssl;
if (certificate) {
  if (mode !== 'verify-full') throw new Error('The Supabase CA requires sslmode=verify-full.');
  ssl = { ca: readFileSync(certificate, 'utf8'), rejectUnauthorized: true, servername: url.hostname };
  for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) url.searchParams.delete(key);
}
const pool = new Pool({ connectionString: url.toString(), ...(ssl ? { ssl } : {}), max: 1, connectionTimeoutMillis: 10000 });
try {
  const sql = readFileSync(new URL('../db/005_price_history.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  console.log('Price history migration applied.');
} finally {
  await pool.end();
}

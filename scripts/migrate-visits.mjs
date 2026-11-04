import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const sql = await readFile(new URL('../db/003_site_visits.sql', import.meta.url), 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 });
const client = await pool.connect();
try {
  await client.query('begin');
  await client.query(sql);
  const { rows } = await client.query('select count(*)::int as count from farm.site_visits');
  await client.query('commit');
  console.log(`Site visit migration applied; existing observations: ${rows[0].count}.`);
} catch (error) {
  await client.query('rollback').catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
}

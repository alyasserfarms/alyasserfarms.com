import { readFile } from 'node:fs/promises';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
const sql = await readFile(new URL('../db/002_farm_operations.sql', import.meta.url), 'utf8');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 });
const client = await pool.connect();
try {
  await client.query('begin');
  await client.query(sql);
  const { rows } = await client.query("select count(*)::int as count from farm.crop_plans");
  await client.query('commit');
  console.log(`Crop planning migration applied; existing plans: ${rows[0].count}.`);
} catch (error) {
  await client.query('rollback').catch(() => {});
  throw error;
} finally {
  client.release();
  await pool.end();
}

import "server-only";
import { readFileSync } from "node:fs";
import { Pool, type PoolConfig } from "pg";

export function createFarmPool(max: number): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const url = new URL(connectionString);
  const certificate = url.searchParams.get("sslrootcert");
  const mode = url.searchParams.get("sslmode");
  let ssl: PoolConfig["ssl"];
  if (certificate) {
    if (mode !== "verify-full") throw new Error("The Supabase CA requires sslmode=verify-full.");
    ssl = { ca: readFileSync(certificate, "utf8"), rejectUnauthorized: true, servername: url.hostname };
    for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) url.searchParams.delete(key);
  }
  return new Pool({ connectionString: certificate ? url.toString() : connectionString, ...(ssl ? { ssl } : {}), max, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
}

import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { Pool, type PoolConfig } from "pg";

export function createFarmPool(max: number): Pool {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) throw new Error("DATABASE_URL or POSTGRES_URL is required.");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(connectionString);
  } catch {
    return new Pool({ connectionString, max, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
  }

  const certificate = parsedUrl.searchParams.get("sslrootcert");
  let ssl: PoolConfig["ssl"];

  // 1. Check if the specified certificate file actually exists on this machine/server
  if (certificate && existsSync(certificate)) {
    try {
      ssl = {
        ca: readFileSync(certificate, "utf8"),
        rejectUnauthorized: true,
        servername: parsedUrl.hostname,
      };
    } catch {}
  } else {
    // 2. Check in project certs directory (bundled in repository)
    const bundledCert = path.join(process.cwd(), "certs", "supabase-prod-ca-2021.crt");
    if (existsSync(bundledCert)) {
      try {
        ssl = {
          ca: readFileSync(bundledCert, "utf8"),
          rejectUnauthorized: false,
          servername: parsedUrl.hostname,
        };
      } catch {}
    } else if (parsedUrl.hostname.includes("supabase.co") || parsedUrl.hostname.includes("pooler.supabase.com") || connectionString.includes("sslmode=")) {
      // 3. Fallback for cloud serverless environments (Vercel) connecting to Supabase
      ssl = {
        rejectUnauthorized: false,
      };
    }
  }

  // Remove local-only ssl params from URL so pg doesn't attempt native fs lookup for missing paths
  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
    parsedUrl.searchParams.delete(key);
  }

  return new Pool({
    connectionString: parsedUrl.toString(),
    ssl,
    max: 2, // Safe low limit for serverless workers and Supabase session pooler
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 10000,
  });
}

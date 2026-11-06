import fs from "node:fs";
import { Pool } from "pg";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split("\n")
    .filter(l => l.includes("="))
    .map(l => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    console.log("Applying farm.users migration...");
    await pool.query(`
      create table if not exists farm.users (
        id uuid primary key default gen_random_uuid(),
        username text not null unique,
        name text not null,
        password_hash text not null,
        role text not null check (role in ('admin', 'orders')),
        active boolean not null default true,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
      create index if not exists farm_users_username_idx on farm.users (lower(username));
    `);
    console.log("farm.users table created successfully!");

    // Check if admin user exists; if not, seed with current password from farm.settings or env
    const existing = await pool.query("select id, username from farm.users where lower(username) = 'admin'");
    if (existing.rows.length === 0) {
      // Check if farm.settings has a password hash from user's earlier change
      const settingsRes = await pool.query("select admin_password_hash from farm.settings where id = 1");
      const currentHash = settingsRes.rows[0]?.admin_password_hash;

      if (currentHash) {
        console.log("Seeding admin user with existing updated password hash from farm.settings...");
        await pool.query(
          "insert into farm.users (username, name, password_hash, role) values ($1, $2, $3, $4)",
          ["admin", "مدير المزرعة", currentHash, "admin"]
        );
      } else {
        console.log("Hashing process.env.ADMIN_PASSWORD to seed admin user...");
        const crypto = await import("node:crypto");
        const salt = crypto.randomBytes(16).toString("hex");
        const derived = crypto.scryptSync(env.ADMIN_PASSWORD, salt, 64).toString("hex");
        const hash = `${salt}:${derived}`;
        await pool.query(
          "insert into farm.users (username, name, password_hash, role) values ($1, $2, $3, $4)",
          ["admin", "مدير المزرعة", hash, "admin"]
        );
      }
      console.log("Admin user seeded successfully!");
    } else {
      console.log("Admin user already exists.");
    }

    const allUsers = await pool.query("select id, username, name, role, active, created_at from farm.users");
    console.log("Current users in database:", allUsers.rows);
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

run();

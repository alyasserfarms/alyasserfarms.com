import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getUserByUsername, getUserById } from "./farm-repository";
import type { FarmSessionUser } from "@/data/farm-types";

const cookieName = "alyasser-admin";
const lifetime = 60 * 60 * 8; // 8 hours

function signature(text: string): string {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "alyasser-secret").update(text).digest("hex");
}

function equal(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export function verifyScrypt(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(":");
    if (!salt || !key) return false;
    const derived = scryptSync(password, salt, 64).toString("hex");
    const a = Buffer.from(derived, "hex");
    const b = Buffer.from(key, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

/**
 * Authenticates user by username and password.
 * Checks farm.users table first, and falls back to process.env.ADMIN_PASSWORD if admin not yet in DB.
 */
export async function authenticateUser(usernameInput: string, passwordInput: string): Promise<FarmSessionUser | null> {
  const username = (usernameInput || "admin").trim();
  const password = passwordInput.trim();
  if (!password) return null;

  // 1. Check farm.users table
  const user = await getUserByUsername(username);
  if (user && user.active) {
    if (verifyScrypt(password, user.password_hash)) {
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      };
    }
  }

  // 2. Fallback to process.env.ADMIN_PASSWORD for "admin" user
  if (username.toLowerCase() === "admin") {
    const envPass = process.env.ADMIN_PASSWORD;
    if (envPass && equal(signature(password), signature(envPass))) {
      return {
        id: user?.id ?? "admin",
        username: "admin",
        name: "مدير المزرعة",
        role: "admin",
      };
    }
  }

  return null;
}

/**
 * Backward compatibility helper for legacy password validation
 */
export async function validPassword(value: string): Promise<boolean> {
  const user = await authenticateUser("admin", value);
  return user !== null;
}

/**
 * Resolves the secret token for signing session cookies.
 */
async function getUserSecret(userId: string): Promise<string> {
  if (userId === "admin") {
    return signature(process.env.ADMIN_PASSWORD ?? "admin-fallback");
  }
  const user = await getUserById(userId);
  if (user) return user.password_hash;
  return signature(process.env.ADMIN_PASSWORD ?? "unknown-user");
}

/**
 * Reads and verifies the current admin/staff session from cookies.
 */
export async function getAdminSession(): Promise<FarmSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value ?? "";
  if (!token) return null;

  // Format: expires.userId.role.signed
  const parts = token.split(".");
  if (parts.length === 2) {
    // Legacy format: expires.signed
    const [expires, signed] = parts;
    if (!/^\d+$/.test(expires)) return null;
    const expNum = Number(expires);
    if (expNum <= Date.now() || expNum > Date.now() + lifetime * 1000) return null;

    // Check with admin secret
    const adminUser = await getUserByUsername("admin");
    const secret = adminUser ? adminUser.password_hash : signature(process.env.ADMIN_PASSWORD ?? "");
    if (equal(signed, signature(`${expires}:${secret}`))) {
      return {
        id: adminUser?.id ?? "admin",
        username: "admin",
        name: adminUser?.name ?? "مدير المزرعة",
        role: "admin",
      };
    }
    return null;
  }

  if (parts.length !== 4) return null;
  const [expires, userId, role, signed] = parts;
  if (!/^\d+$/.test(expires)) return null;
  const expNum = Number(expires);
  if (expNum <= Date.now() || expNum > Date.now() + lifetime * 1000) return null;

  const secret = await getUserSecret(userId);
  const expectedSignature = signature(`${expires}:${userId}:${role}:${secret}`);
  if (!equal(signed, expectedSignature)) return null;

  // Get user details
  if (userId === "admin") {
    return { id: "admin", username: "admin", name: "مدير المزرعة", role: "admin" };
  }
  const user = await getUserById(userId);
  if (!user || !user.active) return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
  };
}

export async function isAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

export async function isFullAdmin(): Promise<boolean> {
  const session = await getAdminSession();
  return session !== null && session.role === "admin";
}

/**
 * Creates / sets a signed session cookie for the authenticated user.
 */
export async function setAdminSession(user: FarmSessionUser, overrideSecret?: string): Promise<void> {
  const expires = String(Date.now() + lifetime * 1000);
  const secret = overrideSecret ?? (await getUserSecret(user.id));
  const signed = signature(`${expires}:${user.id}:${user.role}:${secret}`);
  const token = `${expires}.${user.id}.${user.role}.${signed}`;

  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.ADMIN_COOKIE_SECURE === "true",
    path: "/",
    maxAge: lifetime,
  });
}

export async function clearAdminSession(): Promise<void> {
  (await cookies()).delete(cookieName);
}

export function sameOrigin(request: Request): boolean {
  try {
    const host = request.headers.get("host");
    const origin = request.headers.get("origin");
    if (origin) {
      const url = new URL(origin);
      return ["http:", "https:"].includes(url.protocol) && url.host === host;
    }
    const referer = request.headers.get("referer");
    if (referer) {
      const url = new URL(referer);
      return ["http:", "https:"].includes(url.protocol) && url.host === host;
    }
    const fetchSite = request.headers.get("sec-fetch-site");
    if (fetchSite === "same-origin") return true;
    return false;
  } catch {
    return false;
  }
}

const attempts = new Map<string, { count: number; until: number }>();
export function withinLimit(key: string, max: number, milliseconds: number): boolean {
  const now = Date.now();
  for (const [id, bucket] of attempts) if (bucket.until < now) attempts.delete(id);
  const bucket = attempts.get(key) ?? { count: 0, until: now + milliseconds };
  bucket.count++;
  attempts.set(key, bucket);
  return bucket.count <= max;
}

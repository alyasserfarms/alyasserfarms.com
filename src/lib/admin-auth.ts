import "server-only";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getAdminPasswordHash } from "./farm-repository";

const cookieName = "alyasser-admin";
const lifetime = 60 * 60 * 8;

function signature(text: string) {
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(text).digest("hex");
}

function equal(a: string, b: string) {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

function verifyScrypt(password: string, stored: string): boolean {
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

async function getPasswordSecretToken(): Promise<string> {
  const dbHash = await getAdminPasswordHash();
  if (dbHash) return dbHash;
  return signature(process.env.ADMIN_PASSWORD ?? "alyasser-fallback-secret");
}

export async function validPassword(value: string): Promise<boolean> {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  
  // 1. Check if a custom password hash exists in database
  const dbHash = await getAdminPasswordHash();
  if (dbHash) {
    return verifyScrypt(value, dbHash);
  }

  // 2. Fallback to environment variable ADMIN_PASSWORD
  const password = process.env.ADMIN_PASSWORD;
  return !!password && equal(signature(value), signature(password));
}

export async function isAdmin(): Promise<boolean> {
  if (!process.env.ADMIN_SESSION_SECRET) return false;
  const token = (await cookies()).get(cookieName)?.value ?? "";
  const [expires, signed] = token.split(".");
  if (!signed || !/^\d+$/.test(expires)) return false;
  const expNum = Number(expires);
  if (expNum <= Date.now() || expNum > Date.now() + lifetime * 1000) return false;

  const currentSecretToken = await getPasswordSecretToken();
  return equal(signed, signature(`${expires}:${currentSecretToken}`));
}

export async function setAdminSession(): Promise<void> {
  const expires = String(Date.now() + lifetime * 1000);
  const currentSecretToken = await getPasswordSecretToken();
  (await cookies()).set(cookieName, `${expires}.${signature(`${expires}:${currentSecretToken}`)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.ADMIN_COOKIE_SECURE === "true",
    path: "/",
    maxAge: lifetime,
  });
}

export async function clearAdminSession() {
  (await cookies()).delete(cookieName);
}

export function sameOrigin(request: Request) {
  try {
    const origin = new URL(request.headers.get("origin") ?? "");
    return ["http:", "https:"].includes(origin.protocol) && origin.host === request.headers.get("host");
  } catch {
    return false;
  }
}

const attempts = new Map<string, { count: number; until: number }>();
export function withinLimit(key: string, max: number, milliseconds: number) {
  const now = Date.now();
  for (const [id, bucket] of attempts) if (bucket.until < now) attempts.delete(id);
  const bucket = attempts.get(key) ?? { count: 0, until: now + milliseconds };
  bucket.count++;
  attempts.set(key, bucket);
  return bucket.count <= max;
}

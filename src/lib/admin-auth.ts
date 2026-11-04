import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "alyasser-admin";
const lifetime = 60 * 60 * 8;
function signature(text: string) { return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "").update(text).digest("hex"); }
function equal(a: string, b: string) { const aa = Buffer.from(a); const bb = Buffer.from(b); return aa.length === bb.length && timingSafeEqual(aa, bb); }
export function validPassword(value: string) {
  const password = process.env.ADMIN_PASSWORD;
  return !!password && !!process.env.ADMIN_SESSION_SECRET && equal(signature(value), signature(password));
}
export async function isAdmin() {
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) return false;
  const token = (await cookies()).get(cookieName)?.value ?? "";
  const [expires, signed] = token.split(".");
  return !!signed && /^\d+$/.test(expires) && Number(expires) > Date.now() && Number(expires) <= Date.now() + lifetime * 1000 && equal(signed, signature(`${expires}:${signature(process.env.ADMIN_PASSWORD)}`));
}
export async function setAdminSession() {
  const expires = String(Date.now() + lifetime * 1000);
  (await cookies()).set(cookieName, `${expires}.${signature(`${expires}:${signature(process.env.ADMIN_PASSWORD!)}`)}`, { httpOnly: true, sameSite: "strict", secure: process.env.ADMIN_COOKIE_SECURE === "true", path: "/", maxAge: lifetime });
}
export async function clearAdminSession() { (await cookies()).delete(cookieName); }
export function sameOrigin(request: Request) {
  try { const origin = new URL(request.headers.get("origin") ?? ""); return ["http:", "https:"].includes(origin.protocol) && origin.host === request.headers.get("host"); }
  catch { return false; }
}
const attempts = new Map<string, { count: number; until: number }>();
export function withinLimit(key: string, max: number, milliseconds: number) {
  const now = Date.now();
  for (const [id, bucket] of attempts) if (bucket.until < now) attempts.delete(id);
  const bucket = attempts.get(key) ?? { count: 0, until: now + milliseconds };
  bucket.count++; attempts.set(key, bucket); return bucket.count <= max;
}

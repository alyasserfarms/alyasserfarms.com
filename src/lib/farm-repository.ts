import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { products } from "@/data/content";
import { commerceSettings } from "@/data/commerce-settings";
import { isAvailable, type FarmStore, type PublicFarm, type FarmUser, type FarmUserRole } from "@/data/farm-types";
import { collectPriceChanges } from "./farm-rules";

// Local, single-process adapter. Replace with a transactional database before multi-instance hosting.
const directory = process.env.FARM_DATA_DIR ?? path.join(process.cwd(), "data");
const filename = path.join(directory, "farm.json");
let pending: Promise<unknown> = Promise.resolve();
export function seedFarm(): FarmStore {
  return { revision: 0, products: products.map(product => ({ ...product, status: "available", stock: 99, sale: "pack", minimum: 1, preparation: "" })), orders: [], priceHistory: [], settings: { minimumBulkKg: commerceSettings.minimumBulkKg, eid: true, receiveOrders: true, delivery: "تُراجع المنطقة والرسوم والموعد عند التواصل قبل تأكيد الطلب." } };
}
export async function readFarm(): Promise<FarmStore> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return (await import("./farm-postgres")).readPostgresFarm();
  try { const store = JSON.parse(await readFile(filename, "utf8")) as FarmStore; return { ...store, priceHistory: store.priceHistory ?? [] }; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return seedFarm(); throw error; }
}
export async function publicFarm(): Promise<PublicFarm> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return (await import("./farm-postgres")).publicPostgresFarm();
  const store = await readFarm();
  return { products: store.products.filter(isAvailable), settings: store.settings };
}
export async function changeFarm<T>(change: (store: FarmStore) => T | Promise<T>): Promise<T> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) return (await import("./farm-postgres")).changePostgresFarm(change);
  const operation = pending.then(async () => {
    const store = await readFarm();
    const before = store.products.map(product => ({ ...product }));
    const result = await change(store);
    store.priceHistory = [...collectPriceChanges(before, store.products), ...store.priceHistory].slice(0, 100);
    store.revision++;
    await mkdir(directory, { recursive: true });
    const temporary = path.join(directory, `farm-${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(store, null, 2), { mode: 0o600 });
    await rename(temporary, filename);
    return result;
  });
  pending = operation.catch(() => {});
  return operation;
}

export async function getAdminPasswordHash(): Promise<string | null> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).getAdminPasswordHash();
  }
  return null;
}

export async function setAdminPasswordHash(hash: string): Promise<void> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    await (await import("./farm-postgres")).setAdminPasswordHash(hash);
  }
}

export async function getUserByUsername(username: string) {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).getUserByUsername(username);
  }
  return null;
}

export async function getUserById(id: string) {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).getUserById(id);
  }
  return null;
}

export async function listFarmUsers(): Promise<FarmUser[]> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).listFarmUsers();
  }
  return [];
}

export async function createFarmUser(username: string, name: string, passwordHash: string, role: FarmUserRole): Promise<FarmUser> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).createFarmUser(username, name, passwordHash, role);
  }
  throw new Error("قاعدة البيانات غير متصلة.");
}

export async function updateFarmUserPassword(id: string, passwordHash: string): Promise<void> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).updateFarmUserPassword(id, passwordHash);
  }
}

export async function setFarmUserActive(id: string, active: boolean): Promise<void> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).setFarmUserActive(id, active);
  }
}

export async function deleteFarmUser(id: string): Promise<void> {
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    return (await import("./farm-postgres")).deleteFarmUser(id);
  }
}

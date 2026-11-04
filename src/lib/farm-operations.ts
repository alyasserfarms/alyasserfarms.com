import "server-only";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import type { CropPlan } from "@/data/farm-operations";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10000, idleTimeoutMillis: 30000 });
type Row = { id: string; crop_name: string; plot_name: string; area_feddan: string | null; planned_planting: string | null; expected_harvest: string | null; expected_quantity_kg: string | null; status: CropPlan["status"]; notes: string };
function fromRow(row: Row): CropPlan {
  return { id: row.id, cropName: row.crop_name, plotName: row.plot_name, areaFeddan: row.area_feddan === null ? null : Number(row.area_feddan), plannedPlanting: row.planned_planting ?? "", expectedHarvest: row.expected_harvest ?? "", expectedQuantityKg: row.expected_quantity_kg === null ? null : Number(row.expected_quantity_kg), status: row.status, notes: row.notes };
}
function str(value: unknown, max: number) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }
function date(value: unknown) { const result = str(value, 10); if (result && !/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new Error("راجع التاريخ."); return result || null; }
function positive(value: unknown, max: number) { if (value === "" || value === null || value === undefined) return null; const n = Number(value); if (!Number.isFinite(n) || n <= 0 || n > max) throw new Error("راجع الكمية أو المساحة."); return n; }
export async function listCropPlans(): Promise<CropPlan[]> {
  if (!process.env.DATABASE_URL) return [];
  const result = await pool.query<Row>("select id,crop_name,plot_name,area_feddan,planned_planting::text,expected_harvest::text,expected_quantity_kg,status,notes from farm.crop_plans order by expected_harvest nulls last,created_at desc");
  return result.rows.map(fromRow);
}
export async function saveCropPlan(input: Record<string, unknown>): Promise<CropPlan[]> {
  if (!process.env.DATABASE_URL) throw new Error("تخطيط المحاصيل يحتاج قاعدة البيانات.");
  const id = str(input.id, 36) || randomUUID();
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("معرّف الخطة غير صالح.");
  const cropName = str(input.cropName, 80), plotName = str(input.plotName, 80), notes = str(input.notes, 1000);
  const status = str(input.status, 20) as CropPlan["status"];
  const planting = date(input.plannedPlanting), harvest = date(input.expectedHarvest);
  if (cropName.length < 2 || !["planned", "growing", "harvested", "cancelled"].includes(status)) throw new Error("راجع اسم المحصول وحالة الخطة.");
  if (planting && harvest && harvest < planting) throw new Error("الحصاد المتوقع يسبق تاريخ الزراعة.");
  const area = positive(input.areaFeddan, 100000), quantity = positive(input.expectedQuantityKg, 100000000);
  await pool.query(`insert into farm.crop_plans (id,crop_name,plot_name,area_feddan,planned_planting,expected_harvest,expected_quantity_kg,status,notes)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    on conflict (id) do update set crop_name=excluded.crop_name,plot_name=excluded.plot_name,area_feddan=excluded.area_feddan,
    planned_planting=excluded.planned_planting,expected_harvest=excluded.expected_harvest,expected_quantity_kg=excluded.expected_quantity_kg,
    status=excluded.status,notes=excluded.notes,updated_at=now()`, [id,cropName,plotName,area,planting,harvest,quantity,status,notes]);
  return listCropPlans();
}

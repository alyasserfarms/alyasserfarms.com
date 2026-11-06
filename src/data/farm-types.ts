import type { Product } from "./content";

export type FarmProduct = Product & { status: "draft" | "available" | "hidden"; stock: number; sale: "kg" | "pack" | "head" | "live-kg"; minimum: number; preparation: string; };
export type PriceChange = { id: string; productId: string; productName: string; unit: string; before: number; after: number; occurredAt: string };
export type FarmSettings = { minimumBulkKg: number; eid: boolean; receiveOrders: boolean; delivery: string; };
export type FarmOrder = {
  id: string; key: string; createdAt: string; status: "new" | "reviewed" | "confirmed" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  customer: { name: string; phone: string; city: string; address: string; notes: string };
  items: { id: string; name: string; unit: string; quantity: number; price: number }[];
  total: number; kind: "retail" | "bulk"; reserved: boolean;
  delivery: { fee: number | null; date: string; agent: string; note: string };
};
export type FarmStore = { revision: number; products: FarmProduct[]; settings: FarmSettings; orders: FarmOrder[]; priceHistory: PriceChange[] };
export type PublicFarm = { products: FarmProduct[]; settings: FarmSettings };

export type FarmUserRole = "admin" | "orders";
export type FarmUser = {
  id: string;
  username: string;
  name: string;
  role: FarmUserRole;
  active: boolean;
  createdAt: string;
};
export type FarmSessionUser = {
  id: string;
  username: string;
  name: string;
  role: FarmUserRole;
};

export const roleLabels: Record<FarmUserRole, string> = {
  admin: "مدير كامل الصلاحيات",
  orders: "مسؤول الطلبات والتجهيز",
} as const;

export const saleLabels = { kg: "كيلو جرام", pack: "عبوة", head: "رأس", "live-kg": "كيلو وزن حي" } as const;
export const orderLabels: Record<FarmOrder["status"], string> = { new: "طلب جديد", reviewed: "تمت المراجعة", confirmed: "مؤكد", preparing: "قيد التجهيز", out_for_delivery: "خرج للتوصيل", delivered: "تم التسليم", cancelled: "ملغي" };
export function isAvailable(product: FarmProduct) { return product.status === "available" && product.stock >= product.minimum; }

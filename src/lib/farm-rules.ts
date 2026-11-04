import { categories } from "@/data/content";
import { isAvailable, saleLabels, type FarmOrder, type FarmProduct, type FarmStore } from "@/data/farm-types";
import { randomUUID } from "node:crypto";
export function text(value: unknown, maximum = 300) { return typeof value === "string" ? value.trim().slice(0, maximum) : ""; }
export function number(value: unknown, minimum: number, maximum: number) {
  const result = typeof value === "number" ? value : NaN;
  if (!Number.isFinite(result) || result < minimum || result > maximum) throw new Error("قيمة رقمية غير صالحة.");
  return result;
}
export function cleanProduct(raw: Record<string, unknown>): FarmProduct {
  const sale = text(raw.sale) as FarmProduct["sale"];
  const category = text(raw.category) as FarmProduct["category"];
  const status = text(raw.status) as FarmProduct["status"];
  const image = text(raw.image, 180);
  const name = text(raw.name, 80);
  if (!name || !categories.some(item => item.id === category) || !["draft", "available", "hidden"].includes(status) || !Object.hasOwn(saleLabels, sale) || !/^(?:[a-z0-9-]+|uploads\/[a-f0-9-]+)$/.test(image)) throw new Error("راجع الاسم والفئة والصورة وحالة المنتج.");
  const stock = number(raw.stock, 0, 100000);
  const minimum = number(raw.minimum, 1, 10000);
  if (!Number.isInteger(stock) || !Number.isInteger(minimum)) throw new Error("الكمية والحد الأدنى يجب أن يكونا عددين صحيحين.");
  return { id: text(raw.id, 80) || randomUUID(), name, category, image, status, sale, stock, minimum, price: number(raw.price, .01, 10000000), unit: saleLabels[sale], description: text(raw.description, 1200), preparation: text(raw.preparation, 500) };
}
export function createOrder(store: FarmStore, raw: Record<string, unknown>) {
  if (!store.settings.receiveOrders) throw new Error("استقبال الطلبات متوقف مؤقتًا.");
  const key = text(raw.key, 80);
  if (!/^[a-f0-9-]{36}$/.test(key)) throw new Error("أعد تحميل الصفحة ثم حاول مجددًا.");
  const previous = store.orders.find(order => order.key === key);
  if (previous) return previous;
  const input = raw.customer as Record<string, unknown> | undefined;
  if (!input) throw new Error("أكمل بيانات التواصل.");
  const customer = { name: text(input.name, 80), phone: text(input.phone, 24).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))), city: text(input.city, 80), address: text(input.address), notes: text(input.notes) };
  if (customer.name.length < 2 || !/^(?:\+?20)?0?1[0125]\d{8}$/.test(customer.phone.replace(/[\s()-]/g, "")) || customer.city.length < 2 || customer.address.length < 8) throw new Error("راجع الاسم ورقم الهاتف المصري والمنطقة والعنوان.");
  if (!Array.isArray(raw.items) || !raw.items.length || raw.items.length > 50) throw new Error("السلة فارغة أو غير صالحة.");
  const seen = new Set<string>();
  const items = raw.items.map((item: Record<string, unknown>) => {
    const product = store.products.find(product => product.id === item.id);
    if (!product || !isAvailable(product) || seen.has(product.id)) throw new Error("تغير توفر أحد المنتجات. راجع السلة مجددًا.");
    seen.add(product.id);
    const quantity = number(item.quantity, product.minimum, Math.min(99, product.stock));
    if (!Number.isInteger(quantity)) throw new Error("راجع كمية المنتج.");
    return { id: product.id, name: product.name, unit: product.unit, price: product.price, quantity };
  });
  const kind = raw.kind === "bulk" ? "bulk" : "retail";
  if (kind === "bulk" && (items.some(item => store.products.find(product => product.id === item.id)?.sale !== "kg") || items.reduce((sum, item) => sum + item.quantity, 0) < store.settings.minimumBulkKg)) throw new Error(`طلبات الجملة تحتاج ${store.settings.minimumBulkKg} كجم على الأقل من منتجات تُباع بالكيلو.`);
  const order: FarmOrder = { id: randomUUID(), key, createdAt: new Date().toISOString(), status: "new", customer, items, total: Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100, kind, reserved: false };
  store.orders.unshift(order); return order;
}
const transitions: Record<FarmOrder["status"], FarmOrder["status"][]> = { new: ["reviewed", "cancelled"], reviewed: ["confirmed", "cancelled"], confirmed: ["preparing", "cancelled"], preparing: ["delivered", "cancelled"], delivered: [], cancelled: [] };
export function updateOrder(store: FarmStore, id: string, status: FarmOrder["status"]) {
  const order = store.orders.find(order => order.id === id);
  if (!order || !transitions[order.status].includes(status)) throw new Error("انتقال حالة الطلب غير مسموح.");
  if (status === "confirmed") {
    for (const item of order.items) { const product = store.products.find(product => product.id === item.id); if (!product || !isAvailable(product) || product.stock < item.quantity || product.unit !== item.unit) throw new Error(`راجع توفر ووحدة بيع ${item.name} قبل التأكيد.`); }
    for (const item of order.items) store.products.find(product => product.id === item.id)!.stock -= item.quantity;
    order.reserved = true;
  }
  if (status === "cancelled" && order.reserved) { for (const item of order.items) { const product = store.products.find(product => product.id === item.id); if (product) product.stock += item.quantity; } order.reserved = false; }
  order.status = status;
}

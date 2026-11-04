import { isAdmin, sameOrigin } from "@/lib/admin-auth";
import { changeFarm, readFarm } from "@/lib/farm-repository";
import { cleanProduct, number, text, updateOrder, updateOrderDelivery } from "@/lib/farm-rules";
import type { FarmOrder } from "@/data/farm-types";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!await isAdmin()) return new Response(null, { status: 401 });
  return Response.json(await readFarm(), { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request) || !await isAdmin()) return new Response(null, { status: 403 });
  try {
    const body = await request.text();
    if (body.length > 20000) throw new Error("بيانات كثيرة.");
    const input = JSON.parse(body);
    await changeFarm(store => {
      if (input.revision !== store.revision) throw new Error("تغيرت البيانات. حدّث اللوحة وأعد المحاولة.");
      if (input.action === "product") {
        const product = cleanProduct(input.product);
        const existing = store.products.findIndex(item => item.id === product.id);
        if (existing >= 0 && store.products[existing].sale !== product.sale && store.orders.some(order => order.reserved && ["confirmed", "preparing", "out_for_delivery"].includes(order.status) && order.items.some(item => item.id === product.id))) throw new Error("لا يمكن تغيير وحدة منتج محجوز في طلب مؤكد. أنهِ الطلب أو ألغِه أولًا.");
        if (existing < 0) store.products.unshift(product); else store.products[existing] = product;
      } else if (input.action === "price") {
        const product = store.products.find(item => item.id === text(input.id, 80));
        if (!product) throw new Error("المنتج غير موجود. حدّث اللوحة.");
        product.price = number(input.price, 0.01, 10000000);
        if (Math.abs(product.price * 100 - Math.round(product.price * 100)) > 1e-7) throw new Error("السعر يقبل منزلتين عشريتين فقط.");
      } else if (input.action === "settings") {
        store.settings = { minimumBulkKg: number(input.settings.minimumBulkKg, 1, 10000), eid: input.settings.eid === true, receiveOrders: input.settings.receiveOrders === true, delivery: text(input.settings.delivery, 500) };
        if (!Number.isInteger(store.settings.minimumBulkKg)) throw new Error("الحد الأدنى يجب أن يكون عددًا صحيحًا.");
      } else if (input.action === "order") updateOrder(store, text(input.id), input.status as FarmOrder["status"]);
      else if (input.action === "delivery") updateOrderDelivery(store, text(input.id), input.delivery);
      else throw new Error("عملية غير معروفة.");
    });
    return Response.json(await readFarm(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "تعذر الحفظ." }, { status: 400 }); }
}

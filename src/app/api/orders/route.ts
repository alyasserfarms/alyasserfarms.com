import { changeFarm } from "@/lib/farm-repository";
import { sameOrigin, withinLimit } from "@/lib/admin-auth";
import { createOrder } from "@/lib/farm-rules";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  if (!withinLimit("orders", 60, 60000)) return Response.json({ error: "حاول مجددًا بعد قليل." }, { status: 429 });
  try {
    const body = await request.text();
    if (body.length > 16000) throw new Error("حجم الطلب غير صالح.");
    const order = await changeFarm(store => createOrder(store, JSON.parse(body)));
    return Response.json({ reference: order.id, total: order.total }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "تعذر إرسال الطلب." }, { status: 400 }); }
}

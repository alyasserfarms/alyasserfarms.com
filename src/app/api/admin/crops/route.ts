import { isAdmin, sameOrigin } from "@/lib/admin-auth";
import { listCropPlans, saveCropPlan } from "@/lib/farm-operations";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!await isAdmin()) return new Response(null, { status: 401 });
  try { return Response.json(await listCropPlans(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "تعذر تحميل خطط المحاصيل." }, { status: 503 }); }
}
export async function POST(request: Request) {
  if (!sameOrigin(request) || !await isAdmin()) return new Response(null, { status: 403 });
  try { const body = await request.text(); if (body.length > 5000) throw new Error("بيانات كثيرة."); return Response.json(await saveCropPlan(JSON.parse(body)), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "تعذر حفظ الخطة." }, { status: 400 }); }
}

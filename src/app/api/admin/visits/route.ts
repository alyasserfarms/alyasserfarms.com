import { isAdmin } from "@/lib/admin-auth";
import { readVisitSummary } from "@/lib/farm-analytics";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!await isAdmin()) return new Response(null, { status: 401 });
  try { return Response.json(await readVisitSummary(), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "تعذر تحميل الزيارات." }, { status: 503 }); }
}

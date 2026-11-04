import { recordVisit } from "@/lib/farm-analytics";
import { sameOrigin } from "@/lib/admin-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  try {
    const body = await request.text();
    if (body.length > 300) return new Response(null, { status: 204 });
    const { token, path } = JSON.parse(body);
    await recordVisit(token, path);
  } catch { /* Analytics never interrupts shopping. */ }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

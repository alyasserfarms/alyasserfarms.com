import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}\.jpg$/.test(id)) return new Response(null, { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "public", "media", "uploads", id));
    return new Response(file, { headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
  } catch { return new Response(null, { status: 404 }); }
}

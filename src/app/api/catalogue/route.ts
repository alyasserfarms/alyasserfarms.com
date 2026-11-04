import { publicFarm } from "@/lib/farm-repository";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json(await publicFarm(), { headers: { "Cache-Control": "no-store" } }); }

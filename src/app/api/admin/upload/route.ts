import { isAdmin, sameOrigin } from "@/lib/admin-auth";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";
export async function POST(request: Request) {
  if (!sameOrigin(request) || !await isAdmin()) return new Response(null, { status: 403 });
  try {
    if (Number(request.headers.get("content-length")) > 11_000_000) throw new Error("الصورة يجب أن تكون أقل من 10 ميجابايت.");
    const file = (await request.formData()).get("image");
    if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10_000_000) throw new Error("اختر صورة JPG أو PNG أو WebP أقل من 10 ميجابايت.");
    const image = await sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 30000000 }).rotate().resize({ width: 1600, withoutEnlargement: true }).flatten({ background: "#f6f1e7" }).jpeg({ quality: 85 }).toBuffer();
    const directory = path.join(process.cwd(), "public", "media", "uploads");
    await mkdir(directory, { recursive: true });
    const id = randomUUID(); await writeFile(path.join(directory, `${id}.jpg`), image);
    return Response.json({ image: `uploads/${id}` });
  } catch { return Response.json({ error: "تعذر رفع الصورة. تحقق من نوعها وحجمها." }, { status: 400 }); }
}

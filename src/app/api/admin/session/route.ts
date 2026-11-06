import { clearAdminSession, sameOrigin, setAdminSession, validPassword, withinLimit } from "@/lib/admin-auth";
export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!withinLimit("login", 12, 60000)) return Response.json({ error: "محاولات كثيرة. انتظر دقيقة." }, { status: 429 });
  const form = await request.formData();
  if (!await validPassword(String(form.get("password") ?? ""))) return Response.json({ error: "تعذر تسجيل الدخول. تحقق من كلمة المرور." }, { status: 401 });
  await setAdminSession(); return Response.json({ ok: true });
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  await clearAdminSession(); return Response.json({ ok: true });
}

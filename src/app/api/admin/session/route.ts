import { clearAdminSession, sameOrigin, setAdminSession, authenticateUser, withinLimit } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  if (!withinLimit("login", 12, 60000)) return Response.json({ error: "محاولات كثيرة. انتظر دقيقة." }, { status: 429 });

  const form = await request.formData();
  const username = String(form.get("username") ?? "admin").trim();
  const password = String(form.get("password") ?? "").trim();

  const user = await authenticateUser(username, password);
  if (!user) {
    return Response.json({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, { status: 401 });
  }

  await setAdminSession(user);
  return Response.json({ ok: true, user });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return new Response(null, { status: 403 });
  await clearAdminSession();
  return Response.json({ ok: true });
}

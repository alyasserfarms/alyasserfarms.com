import { isAdmin, sameOrigin, setAdminSession, validPassword, hashPassword, withinLimit } from "@/lib/admin-auth";
import { setAdminPasswordHash } from "@/lib/farm-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isAdmin())) {
    return Response.json({ error: "طلب غير مصرح به." }, { status: 403 });
  }

  if (!withinLimit("change_password", 5, 60000)) {
    return Response.json({ error: "محاولات كثيرة لتغيير كلمة المرور. يرجى الانتظار دقيقة." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const current = String(body.currentPassword ?? "").trim();
    const next = String(body.newPassword ?? "").trim();
    const confirm = String(body.confirmPassword ?? "").trim();

    if (!current || !next || !confirm) {
      return Response.json({ error: "جميع الحقول مطلوبة لتغيير كلمة المرور." }, { status: 400 });
    }

    if (next !== confirm) {
      return Response.json({ error: "كلمة المرور الجديدة وتأكيدها غير متطابقين." }, { status: 400 });
    }

    if (next.length < 8) {
      return Response.json({ error: "كلمة المرور الجديدة يجب ألا تقل عن 8 خانات لأمان الحساب." }, { status: 400 });
    }

    // Verify current password
    const isCurrentValid = await validPassword(current);
    if (!isCurrentValid) {
      return Response.json({ error: "كلمة المرور الحالية غير صحيحة." }, { status: 401 });
    }

    // Hash and store
    const newHash = hashPassword(next);
    await setAdminPasswordHash(newHash);

    // Refresh current admin session with new signature
    await setAdminSession();

    return Response.json({ ok: true, message: "تم تحديث كلمة المرور بنجاح. أصبحت كلمة المرور الجديدة سارية الآن." });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "تعذر تحديث كلمة المرور." }, { status: 500 });
  }
}

import { getAdminSession, sameOrigin, setAdminSession, verifyScrypt, hashPassword, withinLimit } from "@/lib/admin-auth";
import { getUserById, getUserByUsername, updateFarmUserPassword, setAdminPasswordHash } from "@/lib/farm-repository";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  }

  const session = await getAdminSession();
  if (!session) {
    return Response.json({ error: "انتهت الجلسة. يرجى تسجيل الدخول مجددًا." }, { status: 401 });
  }

  if (!withinLimit(`pwd_${session.id}`, 5, 60000)) {
    return Response.json({ error: "محاولات كثيرة. يرجى الانتظار دقيقة." }, { status: 429 });
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

    // Verify current password for logged-in user
    let userRecord = await getUserById(session.id);
    if (!userRecord) {
      userRecord = await getUserByUsername(session.username);
    }

    let isCurrentValid = false;
    if (userRecord) {
      isCurrentValid = verifyScrypt(current, userRecord.password_hash);
    } else if (session.username === "admin") {
      isCurrentValid = current === process.env.ADMIN_PASSWORD;
    }

    if (!isCurrentValid) {
      return Response.json({ error: "كلمة المرور الحالية غير صحيحة." }, { status: 401 });
    }

    // Hash and store new password
    const newHash = hashPassword(next);
    if (userRecord) {
      await updateFarmUserPassword(userRecord.id, newHash);
    }
    // Also sync to settings if admin
    if (session.username === "admin") {
      await setAdminPasswordHash(newHash);
    }

    // Refresh session with new hash so user stays authenticated
    await setAdminSession(session, newHash);

    return Response.json({ ok: true, message: "تم تحديث كلمة المرور بنجاح. أصبحت كلمة المرور الجديدة سارية الآن." });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "تعذر تحديث كلمة المرور." }, { status: 500 });
  }
}

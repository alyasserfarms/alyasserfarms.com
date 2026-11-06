import { isFullAdmin, sameOrigin, hashPassword, withinLimit } from "@/lib/admin-auth";
import {
  listFarmUsers,
  createFarmUser,
  updateFarmUserPassword,
  updateFarmUserRole,
  setFarmUserActive,
  deleteFarmUser,
  getUserByUsername,
} from "@/lib/farm-repository";
import { roleLabels, type FarmUserRole } from "@/data/farm-types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isFullAdmin())) {
    return Response.json({ error: "غير مصرح لك بإدارة الموظفين." }, { status: 403 });
  }
  const users = await listFarmUsers();
  return Response.json(users);
}

export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isFullAdmin())) {
    return Response.json({ error: "غير مصرح لك بإدارة الموظفين." }, { status: 403 });
  }

  if (!withinLimit("staff_ops", 30, 60000)) {
    return Response.json({ error: "محاولات كثيرة. انتظر دقيقة." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "create") {
      const username = String(body.username ?? "").trim().toLowerCase();
      const name = String(body.name ?? "").trim();
      const password = String(body.password ?? "").trim();
      const role = (body.role === "orders" ? "orders" : "admin") as FarmUserRole;

      if (!username || !name || !password) {
        return Response.json({ error: "اسم المستخدم والاسم الكامل وكلمة المرور مطلوبة." }, { status: 400 });
      }

      if (!/^[a-z0-9_-]{3,24}$/.test(username)) {
        return Response.json({ error: "اسم المستخدم يجب أن يكون بالإنجليزية من 3 إلى 24 حرفًا وأرقامًا فقط." }, { status: 400 });
      }

      if (password.length < 6) {
        return Response.json({ error: "كلمة المرور يجب ألا تقل عن 6 خانات." }, { status: 400 });
      }

      const existing = await getUserByUsername(username);
      if (existing) {
        return Response.json({ error: "اسم المستخدم هذا مسجل مسبقًا. اختر اسمًا آخر." }, { status: 400 });
      }

      const pHash = hashPassword(password);
      const user = await createFarmUser(username, name, pHash, role);
      return Response.json({ ok: true, user, message: `تمت إضافة الموظف (${name}) بنجاح.` });
    }

    if (action === "update_role") {
      const id = String(body.id ?? "");
      const role = (body.role === "orders" ? "orders" : "admin") as FarmUserRole;
      if (!id) return Response.json({ error: "معرّف الموظف مطلوب." }, { status: 400 });
      await updateFarmUserRole(id, role);
      return Response.json({ ok: true, message: `تم تحديث صلاحية الموظف إلى: ${roleLabels[role]}` });
    }

    if (action === "toggle_active") {
      const id = String(body.id ?? "");
      const active = body.active === true;
      if (!id) return Response.json({ error: "معرّف الموظف مطلوب." }, { status: 400 });
      await setFarmUserActive(id, active);
      return Response.json({ ok: true, message: active ? "تم تفعيل الحساب." : "تم تعطيل الحساب." });
    }

    if (action === "reset_password") {
      const id = String(body.id ?? "");
      const newPassword = String(body.newPassword ?? "").trim();
      if (!id || !newPassword) return Response.json({ error: "المعرف وكلمة المرور مطلوبان." }, { status: 400 });
      if (newPassword.length < 6) return Response.json({ error: "كلمة المرور لا تقل عن 6 خانات." }, { status: 400 });
      const pHash = hashPassword(newPassword);
      await updateFarmUserPassword(id, pHash);
      return Response.json({ ok: true, message: "تم تحديث كلمة مرور الموظف بنجاح." });
    }

    if (action === "delete") {
      const id = String(body.id ?? "");
      const username = String(body.username ?? "").toLowerCase();
      if (username === "admin") {
        return Response.json({ error: "لا يمكن حذف حساب المدير الرئيسي." }, { status: 400 });
      }
      if (!id) return Response.json({ error: "معرّف الموظف مطلوب." }, { status: 400 });
      await deleteFarmUser(id);
      return Response.json({ ok: true, message: "تم حذف الموظف بنجاح." });
    }

    return Response.json({ error: "عملية غير معروفة." }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "حدث خطأ أثناء تنفيذ العملية." }, { status: 500 });
  }
}

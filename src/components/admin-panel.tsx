"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff, House, KeyRound, LogOut, Package, Plus, RefreshCw, ShoppingBag, SlidersHorizontal, Sprout, Tag, Trash2, Shield, Upload, UserCheck, UserPlus, Users, UserX } from "lucide-react";
import { BrandName } from "./ui";
import { AdminOverview } from "./admin-overview";
import { AdminCrops } from "./admin-crops";
import { AdminOrders } from "./admin-orders";
import { AdminPricing } from "./admin-pricing";
import { categories, displayPrice } from "@/data/content";
import { saleLabels, isAvailable, roleLabels, type FarmProduct, type FarmStore, type FarmSessionUser, type FarmUser, type FarmUserRole } from "@/data/farm-types";

async function api(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "تعذر تنفيذ العملية. أعد تسجيل الدخول إن انتهت الجلسة.");
  return data;
}

export function AdminLogin({ logo }: { logo: string | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/session", { method: "POST", body: new FormData(event.currentTarget) });
      router.refresh();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="farm-admin admin-login">
      <div>
        <BrandName logo={logo} />
        <p className="admin-kicker">مزارع آل ياسر · مساحة الإدارة</p>
        <h1>خيراتك، تحت إدارتك.</h1>
        <p>المنتجات والتوفر وطلبات العملاء وإدارة الفريق في مكان واحد.</p>
        <form onSubmit={login}>
          <label>
            اسم المستخدم
            <input type="text" name="username" defaultValue="admin" required maxLength={50} autoCapitalize="none" autoCorrect="off" placeholder="مثال: admin" />
          </label>
          <label>
            كلمة المرور
            <input type="password" name="password" autoComplete="current-password" required maxLength={200} />
          </label>
          {error && <p role="alert" className="admin-error">{error}</p>}
          <button className="admin-primary" disabled={busy}>
            {busy ? "جارٍ الدخول…" : "الدخول إلى المزرعة"}
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </form>
        <Link href="/">العودة للموقع</Link>
      </div>
    </main>
  );
}

function blankProduct(): FarmProduct {
  return { id: "", name: "", description: "", category: "meat", image: "beef", price: 1, unit: "كيلو جرام", sale: "kg", stock: 0, minimum: 1, status: "draft", preparation: "" };
}

export function AdminPanel({ initial, logo, currentUser }: { initial: FarmStore; logo: string | null; currentUser?: FarmSessionUser }) {
  const user: FarmSessionUser = currentUser ?? { id: "admin", username: "admin", name: "مدير المزرعة", role: "admin" };
  const [store, setStore] = useState(initial);
  const [tab, setTab] = useState(user.role === "orders" ? "orders" : "overview");
  const [draft, setDraft] = useState<FarmProduct | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState(initial.settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  // Change Password state
  const [pwdCurrent, setPwdCurrent] = useState("");
  const [pwdNew, setPwdNew] = useState("");
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [pwdMessage, setPwdMessage] = useState("");
  const [pwdError, setPwdError] = useState("");

  // Staff Management state
  const [staff, setStaff] = useState<FarmUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffUsername, setStaffUsername] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<FarmUserRole>("orders");
  const [staffBusy, setStaffBusy] = useState(false);
  const [staffMessage, setStaffMessage] = useState("");
  const [staffError, setStaffError] = useState("");

  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadStaff() {
    if (user.role !== "admin") return;
    setLoadingStaff(true);
    try {
      const data = await api("/api/admin/users", { cache: "no-store" });
      setStaff(data);
    } catch {}
    finally { setLoadingStaff(false); }
  }

  useEffect(() => {
    if (tab === "settings" && user.role === "admin") {
      loadStaff();
    }
  }, [tab, user.role]);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPwdBusy(true);
    setPwdError("");
    setPwdMessage("");
    try {
      const res = await api("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew, confirmPassword: pwdConfirm }),
      });
      setPwdMessage(res.message ?? "تم تحديث كلمة المرور بنجاح.");
      setPwdCurrent("");
      setPwdNew("");
      setPwdConfirm("");
    } catch (err) {
      setPwdError((err as Error).message);
    } finally {
      setPwdBusy(false);
    }
  }

  async function handleAddStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStaffBusy(true);
    setStaffError("");
    setStaffMessage("");
    try {
      const res = await api("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          username: staffUsername,
          name: staffName,
          password: staffPassword,
          role: staffRole,
        }),
      });
      setStaffMessage(res.message ?? "تمت إضافة الموظف بنجاح.");
      setStaffUsername("");
      setStaffName("");
      setStaffPassword("");
      setStaffRole("orders");
      await loadStaff();
    } catch (err) {
      setStaffError((err as Error).message);
    } finally {
      setStaffBusy(false);
    }
  }

  async function handleToggleStaffActive(targetId: string, currentActive: boolean) {
    setStaffBusy(true);
    setStaffError("");
    setStaffMessage("");
    try {
      const res = await api("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_active", id: targetId, active: !currentActive }),
      });
      setStaffMessage(res.message);
      await loadStaff();
    } catch (err) {
      setStaffError((err as Error).message);
    } finally {
      setStaffBusy(false);
    }
  }

  async function handleDeleteStaff(targetId: string, targetUsername: string) {
    if (!window.confirm(`هل أنت متأكد من حذف حساب الموظف (${targetUsername})؟`)) return;
    setStaffBusy(true);
    setStaffError("");
    setStaffMessage("");
    try {
      const res = await api("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: targetId, username: targetUsername }),
      });
      setStaffMessage(res.message);
      await loadStaff();
    } catch (err) {
      setStaffError((err as Error).message);
    } finally {
      setStaffBusy(false);
    }
  }

  async function mutate(body: object) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const data = await api("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, revision: store.revision }),
      });
      setStore(data);
      setMessage("تم الحفظ. التغييرات متاحة في المتجر.");
      router.refresh();
      return true;
    } catch (error) {
      setError((error as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    try {
      const data = await api("/api/admin", { cache: "no-store" });
      setStore(data);
      setSettings(data.settings);
      setError("");
      setMessage("تم تحديث البيانات.");
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File | undefined) {
    if (!file || !draft) return;
    setBusy(true);
    const form = new FormData();
    form.set("image", file);
    try {
      const data = await api("/api/admin/upload", { method: "POST", body: form });
      setDraft({ ...draft, image: data.image });
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const shown = store.products.filter(product => filter === "all" || (filter === "available" ? isAvailable(product) : !isAvailable(product)));

  const navItems = user.role === "orders"
    ? [{ id: "orders", title: "الطلبات", icon: ShoppingBag }]
    : [
        { id: "overview", title: "الرئيسية", icon: House },
        { id: "orders", title: "الطلبات", icon: ShoppingBag },
        { id: "products", title: "المنتجات", icon: Package },
        { id: "pricing", title: "الأسعار", icon: Tag },
        { id: "crops", title: "المحاصيل", icon: Sprout },
        { id: "settings", title: "الإعدادات وفريق العمل", icon: SlidersHorizontal },
      ];

  return (
    <main id="main" className="farm-admin">
      <header className="admin-header">
        <div className="admin-brand">
          <BrandName logo={logo} />
          <div>
            <strong>إدارة المزرعة</strong>
            <p>{user.name} ({roleLabels[user.role]}) · الخير له أصل</p>
          </div>
        </div>
        <div className="admin-header-actions">
          <Link href="/" target="_blank">
            معاينة الموقع
            <Eye size={18} aria-hidden="true" />
          </Link>
          <button type="button" aria-label="تحديث البيانات" onClick={refresh} disabled={busy}>
            <RefreshCw size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="تسجيل الخروج"
            onClick={async () => {
              await api("/api/admin/session", { method: "DELETE" });
              router.refresh();
            }}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="admin-layout">
        <nav className="admin-nav" aria-label="أقسام الإدارة">
          {navItems.map(item => (
            <button
              key={item.id}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => {
                setTab(item.id);
                setDraft(null);
                setOrderId(null);
                setError("");
                setMessage("");
              }}
            >
              <item.icon size={19} aria-hidden="true" />
              {item.title}
              {item.id === "orders" && store.orders.some(order => order.status === "new") && (
                <span>{store.orders.filter(order => order.status === "new").length}</span>
              )}
            </button>
          ))}
          {user.role === "admin" && (
            <Link className="admin-lab-link" href="/admin/planning-lab">
              <Sprout size={18} aria-hidden="true" />
              مختبر تخطيط المزرعة
            </Link>
          )}
          <p>
            المتاح فقط يظهر للمشتري.
            <br />
            الطلب يحتاج مراجعتك قبل التأكيد.
          </p>
        </nav>

        <div className="admin-content">
          <div role="status" aria-live="polite">
            {message && (
              <p className="admin-success">
                <Check size={18} aria-hidden="true" />
                {message}
              </p>
            )}
          </div>
          {error && <p role="alert" className="admin-error">{error}</p>}

          <div className="admin-view" key={tab}>
            {tab === "overview" && user.role === "admin" && (
              <AdminOverview
                store={store}
                onOrders={id => {
                  setOrderId(id ?? null);
                  setTab("orders");
                }}
                onProducts={() => setTab("products")}
                onEditProduct={id => {
                  const product = store.products.find(item => item.id === id);
                  if (product) {
                    setDraft({ ...product });
                    setTab("products");
                  }
                }}
              />
            )}

            {tab === "crops" && user.role === "admin" && <AdminCrops />}

            {tab === "pricing" && user.role === "admin" && (
              <AdminPricing products={store.products} history={store.priceHistory ?? []} busy={busy} onMutate={mutate} />
            )}

            {tab === "products" && user.role === "admin" && (
              <>
                <div className="admin-title">
                  <div>
                    <p className="admin-kicker">خيرات المزرعة</p>
                    <h1>{draft ? (draft.id ? "تعديل المنتج" : "إضافة منتج") : "المنتجات والتوفر"}</h1>
                    <p>{store.products.filter(isAvailable).length} متاح من {store.products.length} منتجًا</p>
                  </div>
                  {!draft && (
                    <button className="admin-primary" onClick={() => setDraft(blankProduct())}>
                      <Plus size={18} aria-hidden="true" />
                      إضافة منتج
                    </button>
                  )}
                </div>

                {draft ? (
                  <form
                    className="admin-editor"
                    onSubmit={async event => {
                      event.preventDefault();
                      if (await mutate({ action: "product", product: draft })) setDraft(null);
                    }}
                  >
                    <div className="admin-product-fields">
                      <label>
                        اسم المنتج
                        <input required maxLength={80} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} />
                      </label>
                      <div className="admin-pair">
                        <label>
                          الفئة
                          <select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value as FarmProduct["category"] })}>
                            {categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          طريقة البيع
                          <select value={draft.sale} onChange={event => setDraft({ ...draft, sale: event.target.value as FarmProduct["sale"] })}>
                            {Object.entries(saleLabels).map(([key, value]) => (
                              <option key={key} value={key}>{value}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <div className="admin-pair">
                        <label>
                          السعر بالجنيه
                          <input type="number" min="0.01" max="10000000" step="0.01" required value={draft.price} onChange={event => setDraft({ ...draft, price: Number(event.target.value) })} />
                        </label>
                        <label>
                          الكمية المتاحة
                          <input type="number" min="0" max="100000" step="1" required value={draft.stock} onChange={event => setDraft({ ...draft, stock: Number(event.target.value) })} />
                        </label>
                      </div>
                      <div className="admin-pair">
                        <label>
                          حالة العرض
                          <select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as FarmProduct["status"] })}>
                            <option value="draft">مسودة</option>
                            <option value="available">متاح في المتجر</option>
                            <option value="hidden">مخفي</option>
                          </select>
                        </label>
                        <label>
                          أقل كمية للمنتج
                          <input type="number" min="1" step="1" max="99" value={draft.minimum} onChange={event => setDraft({ ...draft, minimum: Number(event.target.value) })} />
                        </label>
                      </div>
                      <label>
                        وصف المنتج
                        <textarea rows={4} maxLength={1200} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
                      </label>
                      <label>
                        خيارات التجهيز / ملاحظات الوزن
                        <textarea rows={2} maxLength={500} value={draft.preparation} onChange={event => setDraft({ ...draft, preparation: event.target.value })} />
                      </label>
                      <p className="admin-hint">الرأس = خروف كامل. الوزن الحي يختلف عن وزن اللحوم؛ وضّح التفاصيل قبل اعتماد الطلب.</p>
                      <div className="admin-actions">
                        <button className="admin-primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ المنتج"}</button>
                        <button type="button" disabled={busy} onClick={() => setDraft(null)}>إلغاء</button>
                      </div>
                    </div>
                    <aside className="admin-product-preview">
                      <Image src={`/media/${draft.image}.jpg`} alt="معاينة صورة المنتج" width={450} height={360} unoptimized />
                      <input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" onChange={event => upload(event.target.files?.[0])} aria-label="رفع صورة المنتج" />
                      <button type="button" disabled={busy} onClick={() => fileRef.current?.click()}>
                        <Upload size={18} aria-hidden="true" />
                        رفع صورة جديدة
                      </button>
                      <h2>{draft.name || "اسم المنتج"}</h2>
                      <p>{displayPrice(draft.price)} ج.م / {saleLabels[draft.sale]}</p>
                      <span className="admin-hint">{isAvailable(draft) ? "سيظهر للمشتري بعد الحفظ" : "لن يظهر للمشتري"}</span>
                    </aside>
                  </form>
                ) : (
                  <>
                    <div className="admin-filters" role="group" aria-label="تصفية المنتجات">
                      {[{ id: "all", name: "الكل" }, { id: "available", name: "المتاح" }, { id: "hidden", name: "المخفي والمسودات" }].map(item => (
                        <button key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.name}</button>
                      ))}
                    </div>
                    <div className="admin-product-list">
                      {shown.map(product => (
                        <article key={product.id}>
                          <Image src={`/media/${product.image}.jpg`} alt="" width={90} height={90} />
                          <div>
                            <h2>{product.name}</h2>
                            <p>{displayPrice(product.price)} ج.م / {product.unit} · المتبقي {product.stock}</p>
                            <span className={`admin-state ${isAvailable(product) ? "state-available" : ""}`}>
                              {isAvailable(product) ? "ظاهر في المتجر" : product.status === "draft" ? "مسودة" : product.stock < product.minimum ? "الكمية غير متاحة" : "مخفي"}
                            </span>
                          </div>
                          <div className="admin-row-actions">
                            <button disabled={busy} aria-label={`${isAvailable(product) ? "إخفاء" : "إظهار"} ${product.name}`} onClick={() => mutate({ action: "product", product: { ...product, status: isAvailable(product) ? "hidden" : "available" } })}>
                              {isAvailable(product) ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                            </button>
                            <button onClick={() => setDraft({ ...product })}>تعديل</button>
                          </div>
                        </article>
                      ))}
                      {!shown.length && <p className="admin-empty">لا توجد منتجات في هذا العرض. أضف منتجًا أو غيّر التصفية.</p>}
                    </div>
                  </>
                )}
              </>
            )}

            {tab === "orders" && (
              <AdminOrders orders={store.orders} busy={busy} selectedId={orderId} onSelect={setOrderId} onMutate={mutate} />
            )}

            {tab === "settings" && user.role === "admin" && (
              <>
                <div className="admin-title">
                  <div>
                    <p className="admin-kicker">خيارات على مقاس المزرعة</p>
                    <h1>إعدادات المتجر وفريق العمل</h1>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "36px", maxWidth: "700px" }}>
                  {/* Store Operations */}
                  <form className="admin-settings" onSubmit={event => { event.preventDefault(); mutate({ action: "settings", settings }); }}>
                    <h2 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px" }}>خيارات التشغيل والطلبات</h2>
                    <label>
                      أقل كمية للجملة والمطاعم والمناسبات (كجم)
                      <input type="number" min="1" max="10000" required value={settings.minimumBulkKg} onChange={event => setSettings({ ...settings, minimumBulkKg: Number(event.target.value) })} />
                    </label>
                    <p className="admin-hint">لا يطبق هذا الحد على مشتريات الأفراد أو البيع بالرأس.</p>
                    <label className="admin-toggle">
                      <span>عرض قسم العيد والأضحية</span>
                      <input type="checkbox" checked={settings.eid} onChange={event => setSettings({ ...settings, eid: event.target.checked })} />
                    </label>
                    <label className="admin-toggle">
                      <span>استقبال طلبات جديدة</span>
                      <input type="checkbox" checked={settings.receiveOrders} onChange={event => setSettings({ ...settings, receiveOrders: event.target.checked })} />
                    </label>
                    <label>
                      معلومات التوصيل
                      <textarea rows={4} maxLength={500} value={settings.delivery} onChange={event => setSettings({ ...settings, delivery: event.target.value })} />
                    </label>
                    <button className="admin-primary" disabled={busy}>حفظ إعدادات المتجر</button>
                  </form>

                  {/* Change My Password */}
                  <section className="admin-settings" style={{ borderTop: "1px solid var(--admin-line, #e2e8da)", paddingTop: "26px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <KeyRound size={20} style={{ color: "var(--brand-primary, #213626)" }} aria-hidden="true" />
                      <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>تغيير كلمة المرور الخاصة بي</h2>
                    </div>
                    <p className="admin-hint" style={{ margin: "2px 0 8px" }}>
                      تغيير كلمة مرور حسابك الحالي ({user.name} - @{user.username}).
                    </p>
                    {pwdMessage && <p role="status" className="admin-success"><Check size={18} aria-hidden="true" />{pwdMessage}</p>}
                    {pwdError && <p role="alert" className="admin-error">{pwdError}</p>}
                    <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: "14px" }}>
                      <label>
                        كلمة المرور الحالية
                        <input type="password" required value={pwdCurrent} onChange={e => setPwdCurrent(e.target.value)} autoComplete="current-password" />
                      </label>
                      <div className="admin-pair">
                        <label>
                          كلمة المرور الجديدة
                          <input type="password" required minLength={8} value={pwdNew} onChange={e => setPwdNew(e.target.value)} autoComplete="new-password" placeholder="8 خانات على الأقل" />
                        </label>
                        <label>
                          تأكيد كلمة المرور الجديدة
                          <input type="password" required minLength={8} value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)} autoComplete="new-password" placeholder="أعد كتابتها" />
                        </label>
                      </div>
                      <div>
                        <button className="admin-primary" disabled={pwdBusy} type="submit">
                          {pwdBusy ? "جارٍ التحديث…" : "تحديث كلمة المرور"}
                        </button>
                      </div>
                    </form>
                  </section>

                  {/* Staff Management */}
                  <section className="admin-settings" style={{ borderTop: "1px solid var(--admin-line, #e2e8da)", paddingTop: "26px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                        <Users size={20} style={{ color: "var(--brand-primary, #213626)" }} aria-hidden="true" />
                        <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>فريق العمل والموظفون</h2>
                      </div>
                      <button type="button" className="admin-btn-sm" onClick={loadStaff} disabled={loadingStaff}>
                        <RefreshCw size={14} aria-hidden="true" />
                        {loadingStaff ? "جارٍ التحديث…" : "تحديث القائمة"}
                      </button>
                    </div>
                    <p className="admin-hint" style={{ margin: "2px 0 10px" }}>
                      إضافة حسابات للموظفين وتحديد صلاحياتهم (مثل موظف لمتابعة الطلبات وتجهيزها دون الاطلاع على الأسعار والأرباح).
                    </p>

                    {staffMessage && <p role="status" className="admin-success"><Check size={18} aria-hidden="true" />{staffMessage}</p>}
                    {staffError && <p role="alert" className="admin-error">{staffError}</p>}

                    {/* Staff List */}
                    <div className="admin-staff-list">
                      {staff.map(s => (
                        <div key={s.id} className="admin-staff-card">
                          <div className="admin-staff-info">
                            <span className="admin-staff-name">{s.name}</span>
                            <div className="admin-staff-meta">
                              <span>اسم المستخدم: <strong>@{s.username}</strong></span>
                              <span className={`admin-staff-badge ${s.role === "admin" ? "badge-admin" : "badge-orders"}`}>
                                {roleLabels[s.role]}
                              </span>
                              {!s.active && <span className="admin-staff-badge badge-inactive">معطّل</span>}
                            </div>
                          </div>
                          <div className="admin-staff-actions">
                            {s.username !== "admin" && (
                              <>
                                <button
                                  type="button"
                                  className="admin-btn-sm"
                                  disabled={staffBusy}
                                  onClick={() => handleToggleStaffActive(s.id, s.active)}
                                >
                                  {s.active ? <UserX size={14} aria-hidden="true" /> : <UserCheck size={14} aria-hidden="true" />}
                                  {s.active ? "تعطيل" : "تفعيل"}
                                </button>
                                <button
                                  type="button"
                                  className="admin-btn-sm admin-btn-danger"
                                  disabled={staffBusy}
                                  onClick={() => handleDeleteStaff(s.id, s.username)}
                                  title="حذف الموظف"
                                >
                                  <Trash2 size={14} aria-hidden="true" />
                                  حذف
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                      {!staff.length && !loadingStaff && (
                        <p className="admin-hint">لا يوجد موظفون إضافيون حاليًا.</p>
                      )}
                    </div>

                    {/* Add Staff Form */}
                    <form onSubmit={handleAddStaff} style={{ display: "grid", gap: "14px", marginTop: "16px", padding: "16px", background: "var(--admin-surface, #fffcf5)", border: "1px dashed var(--admin-line, #bfc7b4)", borderRadius: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <UserPlus size={18} style={{ color: "var(--brand-primary, #213626)" }} aria-hidden="true" />
                        <h3 style={{ fontSize: "14px", fontWeight: "700", margin: 0 }}>إضافة موظف جديد</h3>
                      </div>
                      <div className="admin-pair">
                        <label>
                          اسم المستخدم (بالإنجليزي)
                          <input
                            type="text"
                            required
                            pattern="^[a-zA-Z0-9_-]{3,24}$"
                            value={staffUsername}
                            onChange={e => setStaffUsername(e.target.value.toLowerCase())}
                            placeholder="مثال: yasser_orders"
                            autoCapitalize="none"
                          />
                        </label>
                        <label>
                          الاسم الكامل للموظف
                          <input
                            type="text"
                            required
                            value={staffName}
                            onChange={e => setStaffName(e.target.value)}
                            placeholder="مثال: ياسر العبدالله"
                          />
                        </label>
                      </div>
                      <div className="admin-pair">
                        <label>
                          نوع الصلاحية
                          <select value={staffRole} onChange={e => setStaffRole(e.target.value as FarmUserRole)}>
                            <option value="orders">مسؤول الطلبات والتجهيز (يرى الطلبات فقط)</option>
                            <option value="admin">مدير كامل الصلاحيات</option>
                          </select>
                        </label>
                        <label>
                          كلمة المرور الأولية
                          <input
                            type="password"
                            required
                            minLength={6}
                            value={staffPassword}
                            onChange={e => setStaffPassword(e.target.value)}
                            placeholder="6 خانات على الأقل"
                          />
                        </label>
                      </div>
                      <div>
                        <button className="admin-primary" disabled={staffBusy} type="submit">
                          <UserPlus size={16} aria-hidden="true" />
                          {staffBusy ? "جارٍ الإضافة…" : "إضافة الموظف"}
                        </button>
                      </div>
                    </form>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff, House, KeyRound, LogOut, Package, Plus, RefreshCw, ShoppingBag, SlidersHorizontal, Sprout, Tag, Upload } from "lucide-react";
import { BrandName } from "./ui";
import { AdminOverview } from "./admin-overview";
import { AdminCrops } from "./admin-crops";
import { AdminOrders } from "./admin-orders";
import { AdminPricing } from "./admin-pricing";
import { categories, displayPrice } from "@/data/content";
import { saleLabels, isAvailable, type FarmProduct, type FarmStore } from "@/data/farm-types";

async function api(url: string, options: RequestInit) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "تعذر تنفيذ العملية. أعد تسجيل الدخول إن انتهت الجلسة.");
  return data;
}
export function AdminLogin({ logo }: { logo: string | null }) {
  const router = useRouter(); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try { await api("/api/admin/session", { method: "POST", body: new FormData(event.currentTarget) }); router.refresh(); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <main id="main" className="farm-admin admin-login"><div><BrandName logo={logo} /><p className="admin-kicker">مزارع آل ياسر · مساحة الإدارة</p><h1>خيراتك، تحت إدارتك.</h1><p>المنتجات والتوفر وطلبات العملاء في مكان واحد.</p><form onSubmit={login}><label>كلمة المرور<input type="password" name="password" autoComplete="current-password" required maxLength={200} /></label>{error && <p role="alert" className="admin-error">{error}</p>}<button className="admin-primary" disabled={busy}>{busy ? "جارٍ الدخول…" : "الدخول إلى المزرعة"}<ArrowLeft size={18} aria-hidden="true" /></button></form><Link href="/">العودة للموقع</Link></div></main>;
}
function blankProduct(): FarmProduct { return { id: "", name: "", description: "", category: "meat", image: "beef", price: 1, unit: "كيلو جرام", sale: "kg", stock: 0, minimum: 1, status: "draft", preparation: "" }; }
export function AdminPanel({ initial, logo }: { initial: FarmStore; logo: string | null }) {
  const [store, setStore] = useState(initial); const [tab, setTab] = useState("overview");
  const [draft, setDraft] = useState<FarmProduct | null>(null); const [orderId, setOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState(initial.settings); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [filter, setFilter] = useState("all");
  const [pwdCurrent, setPwdCurrent] = useState(""); const [pwdNew, setPwdNew] = useState(""); const [pwdConfirm, setPwdConfirm] = useState(""); const [pwdBusy, setPwdBusy] = useState(false); const [pwdMessage, setPwdMessage] = useState(""); const [pwdError, setPwdError] = useState("");
  const router = useRouter(); const fileRef = useRef<HTMLInputElement>(null);
  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPwdBusy(true); setPwdError(""); setPwdMessage("");
    try {
      const res = await api("/api/admin/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pwdCurrent, newPassword: pwdNew, confirmPassword: pwdConfirm }) });
      setPwdMessage(res.message ?? "تم تحديث كلمة المرور بنجاح."); setPwdCurrent(""); setPwdNew(""); setPwdConfirm("");
    } catch (err) { setPwdError((err as Error).message); } finally { setPwdBusy(false); }
  }
  async function mutate(body: object) {
    setBusy(true); setError(""); setMessage("");
    try { const data = await api("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, revision: store.revision }) }); setStore(data); setMessage("تم الحفظ. التغييرات متاحة في المتجر."); router.refresh(); return true; }
    catch (error) { setError((error as Error).message); return false; } finally { setBusy(false); }
  }
  async function refresh() { setBusy(true); try { const data = await api("/api/admin", { cache: "no-store" }); setStore(data); setSettings(data.settings); setError(""); setMessage("تم تحديث البيانات."); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }
  async function upload(file: File | undefined) { if (!file || !draft) return; setBusy(true); const form = new FormData(); form.set("image", file); try { const data = await api("/api/admin/upload", { method: "POST", body: form }); setDraft({ ...draft, image: data.image }); } catch (error) { setError((error as Error).message); } finally { setBusy(false); } }
  const shown = store.products.filter(product => filter === "all" || (filter === "available" ? isAvailable(product) : !isAvailable(product)));
  return <main id="main" className="farm-admin"><header className="admin-header"><div className="admin-brand"><BrandName logo={logo} /><div><strong>إدارة المزرعة</strong><p>مزارع آل ياسر · الخير له أصل</p></div></div><div className="admin-header-actions"><Link href="/" target="_blank">معاينة الموقع<Eye size={18} aria-hidden="true" /></Link><button type="button" aria-label="تحديث البيانات" onClick={refresh} disabled={busy}><RefreshCw size={18} aria-hidden="true" /></button><button type="button" aria-label="تسجيل الخروج" onClick={async () => { await api("/api/admin/session", { method: "DELETE" }); router.refresh(); }}><LogOut size={18} aria-hidden="true" /></button></div></header>
    <div className="admin-layout"><nav className="admin-nav" aria-label="أقسام الإدارة">{[{ id: "overview", title: "الرئيسية", icon: House }, { id: "orders", title: "الطلبات", icon: ShoppingBag }, { id: "products", title: "المنتجات", icon: Package }, { id: "pricing", title: "الأسعار", icon: Tag }, { id: "crops", title: "المحاصيل", icon: Sprout }, { id: "settings", title: "الإعدادات", icon: SlidersHorizontal }].map(item => <button key={item.id} aria-current={tab === item.id ? "page" : undefined} onClick={() => { setTab(item.id); setDraft(null); setOrderId(null); setError(""); setMessage(""); }}><item.icon size={19} aria-hidden="true" />{item.title}{item.id === "orders" && store.orders.some(order => order.status === "new") && <span>{store.orders.filter(order => order.status === "new").length}</span>}</button>)}<Link className="admin-lab-link" href="/admin/planning-lab"><Sprout size={18} aria-hidden="true" />مختبر تخطيط المزرعة</Link><p>المتاح فقط يظهر للمشتري.<br />الطلب يحتاج مراجعتك قبل التأكيد.</p></nav>
    <div className="admin-content"><div role="status" aria-live="polite">{message && <p className="admin-success"><Check size={18} aria-hidden="true" />{message}</p>}</div>{error && <p role="alert" className="admin-error">{error}</p>}<div className="admin-view" key={tab}>
    {tab === "overview" && <AdminOverview store={store} onOrders={id => { setOrderId(id ?? null); setTab("orders"); }} onProducts={() => setTab("products")} onEditProduct={id => { const product = store.products.find(item => item.id === id); if (product) { setDraft({ ...product }); setTab("products"); } }} />}
    {tab === "crops" && <AdminCrops />}
    {tab === "pricing" && <AdminPricing products={store.products} history={store.priceHistory ?? []} busy={busy} onMutate={mutate} />}
    {tab === "products" && <><div className="admin-title"><div><p className="admin-kicker">خيرات المزرعة</p><h1>{draft ? draft.id ? "تعديل المنتج" : "إضافة منتج" : "المنتجات والتوفر"}</h1><p>{store.products.filter(isAvailable).length} متاح من {store.products.length} منتجًا</p></div>{!draft && <button className="admin-primary" onClick={() => setDraft(blankProduct())}><Plus size={18} aria-hidden="true" />إضافة منتج</button>}</div>
      {draft ? <form className="admin-editor" onSubmit={async event => { event.preventDefault(); if (await mutate({ action: "product", product: draft })) setDraft(null); }}><div className="admin-product-fields"><label>اسم المنتج<input required maxLength={80} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} /></label><div className="admin-pair"><label>الفئة<select value={draft.category} onChange={event => setDraft({ ...draft, category: event.target.value as FarmProduct["category"] })}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>طريقة البيع<select value={draft.sale} onChange={event => setDraft({ ...draft, sale: event.target.value as FarmProduct["sale"] })}>{Object.entries(saleLabels).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label></div><div className="admin-pair"><label>السعر بالجنيه<input type="number" min="0.01" max="10000000" step="0.01" required value={draft.price} onChange={event => setDraft({ ...draft, price: Number(event.target.value) })} /></label><label>الكمية المتاحة<input type="number" min="0" max="100000" step="1" required value={draft.stock} onChange={event => setDraft({ ...draft, stock: Number(event.target.value) })} /></label></div><div className="admin-pair"><label>حالة العرض<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as FarmProduct["status"] })}><option value="draft">مسودة</option><option value="available">متاح في المتجر</option><option value="hidden">مخفي</option></select></label><label>أقل كمية للمنتج<input type="number" min="1" step="1" max="99" value={draft.minimum} onChange={event => setDraft({ ...draft, minimum: Number(event.target.value) })} /></label></div><label>وصف المنتج<textarea rows={4} maxLength={1200} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} /></label><label>خيارات التجهيز / ملاحظات الوزن<textarea rows={2} maxLength={500} value={draft.preparation} onChange={event => setDraft({ ...draft, preparation: event.target.value })} /></label><p className="admin-hint">الرأس = خروف كامل. الوزن الحي يختلف عن وزن اللحوم؛ وضّح التفاصيل قبل اعتماد الطلب.</p><div className="admin-actions"><button className="admin-primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ المنتج"}</button><button type="button" disabled={busy} onClick={() => setDraft(null)}>إلغاء</button></div></div><aside className="admin-product-preview"><Image src={`/media/${draft.image}.jpg`} alt="معاينة صورة المنتج" width={450} height={360} unoptimized /><input type="file" ref={fileRef} accept="image/jpeg,image/png,image/webp" onChange={event => upload(event.target.files?.[0])} aria-label="رفع صورة المنتج" /><button type="button" disabled={busy} onClick={() => fileRef.current?.click()}><Upload size={18} aria-hidden="true" />رفع صورة جديدة</button><h2>{draft.name || "اسم المنتج"}</h2><p>{displayPrice(draft.price)} ج.م / {saleLabels[draft.sale]}</p><span className="admin-hint">{isAvailable(draft) ? "سيظهر للمشتري بعد الحفظ" : "لن يظهر للمشتري"}</span></aside></form> : <><div className="admin-filters" role="group" aria-label="تصفية المنتجات">{[{ id: "all", name: "الكل" }, { id: "available", name: "المتاح" }, { id: "hidden", name: "المخفي والمسودات" }].map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.name}</button>)}</div><div className="admin-product-list">{shown.map(product => <article key={product.id}><Image src={`/media/${product.image}.jpg`} alt="" width={90} height={90} /><div><h2>{product.name}</h2><p>{displayPrice(product.price)} ج.م / {product.unit} · المتبقي {product.stock}</p><span className={`admin-state ${isAvailable(product) ? "state-available" : ""}`}>{isAvailable(product) ? "ظاهر في المتجر" : product.status === "draft" ? "مسودة" : product.stock < product.minimum ? "الكمية غير متاحة" : "مخفي"}</span></div><div className="admin-row-actions"><button disabled={busy} aria-label={`${isAvailable(product) ? "إخفاء" : "إظهار"} ${product.name}`} onClick={() => mutate({ action: "product", product: { ...product, status: isAvailable(product) ? "hidden" : "available" } })}>{isAvailable(product) ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button><button onClick={() => setDraft({ ...product })}>تعديل</button></div></article>)}{!shown.length && <p className="admin-empty">لا توجد منتجات في هذا العرض. أضف منتجًا أو غيّر التصفية.</p>}</div></>}
    </>}
    {tab === "orders" && <AdminOrders orders={store.orders} busy={busy} selectedId={orderId} onSelect={setOrderId} onMutate={mutate} />}
    {tab === "settings" && <><div className="admin-title"><div><p className="admin-kicker">خيارات على مقاس المزرعة</p><h1>إعدادات المتجر والأمان</h1></div></div>
      <div style={{ display: "grid", gap: "32px", maxWidth: "680px" }}>
        <form className="admin-settings" onSubmit={event => { event.preventDefault(); mutate({ action: "settings", settings }); }}>
          <h2 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 6px" }}>خيارات التشغيل والطلبات</h2>
          <label>أقل كمية للجملة والمطاعم والمناسبات (كجم)<input type="number" min="1" max="10000" required value={settings.minimumBulkKg} onChange={event => setSettings({ ...settings, minimumBulkKg: Number(event.target.value) })} /></label>
          <p className="admin-hint">لا يطبق هذا الحد على مشتريات الأفراد أو البيع بالرأس.</p>
          <label className="admin-toggle"><span>عرض قسم العيد والأضحية</span><input type="checkbox" checked={settings.eid} onChange={event => setSettings({ ...settings, eid: event.target.checked })} /></label>
          <label className="admin-toggle"><span>استقبال طلبات جديدة</span><input type="checkbox" checked={settings.receiveOrders} onChange={event => setSettings({ ...settings, receiveOrders: event.target.checked })} /></label>
          <label>معلومات التوصيل<textarea rows={4} maxLength={500} value={settings.delivery} onChange={event => setSettings({ ...settings, delivery: event.target.value })} /></label>
          <button className="admin-primary" disabled={busy}>حفظ إعدادات المتجر</button>
        </form>

        <section className="admin-settings" style={{ borderTop: "1px solid var(--admin-line, #e2e8da)", paddingTop: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
            <KeyRound size={20} style={{ color: "var(--brand-primary, #213626)" }} aria-hidden="true" />
            <h2 style={{ fontSize: "16px", fontWeight: "700", margin: 0 }}>أمان الحساب وتغيير كلمة المرور</h2>
          </div>
          <p className="admin-hint" style={{ margin: "2px 0 8px" }}>يمكنك تحديث كلمة مرور الدخول للوحة التحكم في أي وقت لحماية حساب المزرعة.</p>
          {pwdMessage && <p role="status" className="admin-success"><Check size={18} aria-hidden="true" />{pwdMessage}</p>}
          {pwdError && <p role="alert" className="admin-error">{pwdError}</p>}
          <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: "14px" }}>
            <label>كلمة المرور الحالية<input type="password" required value={pwdCurrent} onChange={e => setPwdCurrent(e.target.value)} autoComplete="current-password" /></label>
            <div className="admin-pair">
              <label>كلمة المرور الجديدة<input type="password" required minLength={8} value={pwdNew} onChange={e => setPwdNew(e.target.value)} autoComplete="new-password" placeholder="8 خانات على الأقل" /></label>
              <label>تأكيد كلمة المرور الجديدة<input type="password" required minLength={8} value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)} autoComplete="new-password" placeholder="أعد كتابتها" /></label>
            </div>
            <div><button className="admin-primary" disabled={pwdBusy} type="submit">{pwdBusy ? "جارٍ التحديث…" : "تحديث كلمة المرور"}</button></div>
          </form>
        </section>
      </div></>}
    </div></div></div>
  </main>;
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CalendarDays, Plus, Sprout, X } from "lucide-react";
import { cropStatusLabels, type CropPlan } from "@/data/farm-operations";

const empty: CropPlan = { id: "", cropName: "", plotName: "", areaFeddan: null, plannedPlanting: "", expectedHarvest: "", expectedQuantityKg: null, status: "planned", notes: "" };

export function AdminCrops() {
  const [plans, setPlans] = useState<CropPlan[]>([]);
  const [draft, setDraft] = useState<CropPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/admin/crops", { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل الخطط.");
      if (active) setPlans(data);
    }).catch(error => { if (active) setError((error as Error).message); });
    return () => { active = false; };
  }, []);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/admin/crops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حفظ الخطة.");
      setPlans(data); setDraft(null); setMessage("حُفظت خطة المحصول.");
    } catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <section className="admin-crops" aria-labelledby="admin-crops-title">
    <div className="admin-title"><div><p className="admin-kicker">الموسم القادم</p><h1 id="admin-crops-title">تخطيط المحاصيل</h1><p>خطط مبدئية للتوقيت والمساحة والكمية؛ لا تؤثر في المنتجات المعروضة تلقائيًا.</p></div>{!draft && <button className="admin-primary" onClick={() => setDraft({ ...empty })}><Plus size={18} aria-hidden="true" />خطة محصول</button>}</div>
    {error && <p className="admin-error" role="alert">{error}</p>}{message && <p className="admin-success" role="status">{message}</p>}
    {draft ? <form className="admin-crop-editor" onSubmit={save}><div className="admin-crop-editor-head"><h2>{draft.id ? "تعديل خطة المحصول" : "خطة محصول جديدة"}</h2><button type="button" onClick={() => setDraft(null)} aria-label="إغلاق النموذج"><X size={18} /></button></div>
      <div className="admin-pair"><label>اسم المحصول<input required minLength={2} maxLength={80} value={draft.cropName} onChange={event => setDraft({ ...draft, cropName: event.target.value })} /></label><label>القطعة أو الموقع داخل المزرعة<input maxLength={80} value={draft.plotName} onChange={event => setDraft({ ...draft, plotName: event.target.value })} /></label></div>
      <div className="admin-pair"><label>تاريخ الزراعة المتوقع<input type="date" value={draft.plannedPlanting} onChange={event => setDraft({ ...draft, plannedPlanting: event.target.value })} /></label><label>تاريخ الحصاد المتوقع<input type="date" min={draft.plannedPlanting || undefined} value={draft.expectedHarvest} onChange={event => setDraft({ ...draft, expectedHarvest: event.target.value })} /></label></div>
      <div className="admin-pair"><label>المساحة بالفدان<input type="number" min="0.01" step="0.01" value={draft.areaFeddan ?? ""} onChange={event => setDraft({ ...draft, areaFeddan: event.target.value ? Number(event.target.value) : null })} /></label><label>الإنتاج المتوقع بالكيلو<input type="number" min="0.01" step="0.01" value={draft.expectedQuantityKg ?? ""} onChange={event => setDraft({ ...draft, expectedQuantityKg: event.target.value ? Number(event.target.value) : null })} /></label></div>
      <label>حالة الخطة<select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as CropPlan["status"] })}>{Object.entries(cropStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>ملاحظات الموسم<textarea rows={3} maxLength={1000} value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} /></label>
      <div className="admin-actions"><button className="admin-primary" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ الخطة"}</button><button type="button" onClick={() => setDraft(null)}>إلغاء</button></div>
    </form> : plans.length ? <div className="admin-crop-list">{plans.map(plan => <button key={plan.id} onClick={() => setDraft({ ...plan })}><span className="admin-crop-mark"><Sprout size={22} aria-hidden="true" /></span><span className="admin-crop-name"><strong>{plan.cropName}</strong><small>{plan.plotName || "الموقع غير محدد"} · {cropStatusLabels[plan.status]}</small></span><span className="admin-crop-season"><CalendarDays size={16} aria-hidden="true" />{plan.expectedHarvest ? new Date(`${plan.expectedHarvest}T12:00:00`).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" }) : "الحصاد غير محدد"}</span><span className="admin-crop-quantity">{plan.expectedQuantityKg === null ? "—" : `${plan.expectedQuantityKg.toLocaleString("ar-EG")} كجم متوقع`}</span><ArrowLeft size={17} aria-hidden="true" /></button>)}</div> : <div className="admin-crop-empty"><Sprout size={34} aria-hidden="true" /><h2>الموسم القادم يبدأ بخطة</h2><p>أضف أول محصول تنوي زراعته، وحدد الموعد والكمية عندما تتوفر لديك تقديرات فعلية.</p><button className="admin-primary" onClick={() => setDraft({ ...empty })}><Plus size={18} aria-hidden="true" />إضافة أول خطة</button></div>}
  </section>;
}

"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Check, Clock3, Pencil, Tag, X } from "lucide-react";
import { displayPrice } from "@/data/content";
import type { FarmProduct, PriceChange } from "@/data/farm-types";

type Props = { products: FarmProduct[]; history: PriceChange[]; busy: boolean; onMutate: (body: object) => Promise<boolean> };

export function AdminPricing({ products, history, busy, onMutate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [query, setQuery] = useState("");
  const shown = products.filter(product => product.name.includes(query.trim()));
  const recent = history.slice(0, 20);
  return <section className="admin-pricing" aria-labelledby="admin-pricing-title">
    <div className="admin-title"><div><p className="admin-kicker">سعر واضح للمشتري وقرار موثق للمزرعة</p><h1 id="admin-pricing-title">الأسعار وسجل التغييرات</h1><p>السعر الجديد يطبّق على الطلبات القادمة فقط؛ الطلبات الموجودة تحتفظ بسعر لحظة إرسالها.</p></div></div>
    <div className="admin-pricing-layout"><div className="admin-pricing-products"><div className="admin-pricing-head"><h2>أسعار المنتجات</h2><label>بحث باسم المنتج<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="ابحث عن منتج" /></label></div>
      <div className="admin-pricing-list">{shown.map(product => <div className="admin-pricing-row" key={product.id}>
        <div><strong>{product.name}</strong><small>{product.status === "available" ? "معروض" : "غير معروض"} · {product.unit}</small></div>
        {editingId === product.id ? <form className="admin-price-edit" onSubmit={async event => { event.preventDefault(); const next = Number(price); if (next === product.price) { setEditingId(null); return; } if (await onMutate({ action: "price", id: product.id, price: next })) setEditingId(null); }}><label>السعر الجديد بالجنيه<input type="number" min="0.01" max="10000000" step="0.01" required autoFocus value={price} onChange={event => setPrice(event.target.value)} /></label><button type="submit" className="admin-primary" disabled={busy} aria-label={`حفظ سعر ${product.name}`}><Check size={17} aria-hidden="true" /></button><button type="button" disabled={busy} onClick={() => setEditingId(null)} aria-label="إلغاء تعديل السعر"><X size={17} aria-hidden="true" /></button></form> : <div className="admin-price-current"><strong><bdi>{displayPrice(product.price)} ج.م</bdi></strong><button onClick={() => { setEditingId(product.id); setPrice(String(product.price)); }} disabled={busy} aria-label={`تعديل سعر ${product.name}`}><Pencil size={16} aria-hidden="true" />تعديل</button></div>}
      </div>)}{!shown.length && <p className="admin-pricing-empty">لا توجد منتجات بهذا الاسم.</p>}</div>
    </div><aside className="admin-price-history"><div className="admin-price-history-head"><Clock3 size={20} aria-hidden="true" /><div><h2>سجل تغير السعر</h2><p>آخر {recent.length} تعديل محفوظ</p></div></div>{recent.length ? <ol>{recent.map(event => <li key={event.id}><span className="admin-price-change-icon">{event.after > event.before ? <ArrowUpRight size={17} aria-hidden="true" /> : <ArrowDownRight size={17} aria-hidden="true" />}</span><div><strong>{event.productName}</strong><small>{new Date(event.occurredAt).toLocaleString("ar-EG")} · {event.unit}</small><span><bdi>{displayPrice(event.before)} ج.م</bdi> ← <bdi>{displayPrice(event.after)} ج.م</bdi></span></div></li>)}</ol> : <div className="admin-price-history-empty"><Tag size={23} aria-hidden="true" /><strong>لم يتغير أي سعر بعد</strong><p>سيظهر هنا السعر السابق والجديد فور أول تعديل.</p></div>}</aside></div>
  </section>;
}

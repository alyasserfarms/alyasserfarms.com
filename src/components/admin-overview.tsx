"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, ShoppingBag } from "lucide-react";
import type { FarmOrder, FarmStore } from "@/data/farm-types";
import { isAvailable, orderLabels } from "@/data/farm-types";
import { displayPrice } from "@/data/content";
import type { VisitSummary } from "@/lib/farm-analytics";

type Props = {
  store: FarmStore;
  onOrders: (id?: string) => void;
  onProducts: () => void;
  onEditProduct: (id: string) => void;
};

const activeStatuses: FarmOrder["status"][] = ["new", "reviewed", "confirmed", "preparing"];

export function AdminOverview({ store, onOrders, onProducts, onEditProduct }: Props) {
  const [visits, setVisits] = useState<VisitSummary | null>(null);
  useEffect(() => { let active = true; fetch("/api/admin/visits", { cache: "no-store" }).then(response => response.ok ? response.json() : null).then(data => { if (active) setVisits(data); }).catch(() => {}); return () => { active = false; }; }, []);
  const newOrders = store.orders.filter(order => order.status === "new");
  const activeOrders = store.orders.filter(order => activeStatuses.includes(order.status));
  const lowStock = store.products.filter(product => product.status === "available" && product.stock <= product.minimum + 2);
  const available = store.products.filter(isAvailable);
  const nextOrder = activeOrders[0];
  const productDemand = new Map<string, number>();
  for (const order of store.orders.filter(order => order.status !== "cancelled")) for (const item of order.items) productDemand.set(item.id, (productDemand.get(item.id) ?? 0) + item.quantity);
  const suggested = [...store.products].filter(product => product.status !== "available" && (productDemand.get(product.id) ?? 0) > 0).sort((a, b) => (productDemand.get(b.id) ?? 0) - (productDemand.get(a.id) ?? 0)).slice(0, 3);

  return <section className="admin-overview" aria-labelledby="admin-overview-title">
    <div className="admin-overview-heading"><div><p className="admin-kicker">مزارع آل ياسر / مساحة العمل</p><h1 id="admin-overview-title">نظرة على المزرعة</h1><p>ما يحتاج انتباهك الآن، من الطلب إلى التوفر.</p></div><button className="admin-primary" onClick={() => onOrders()}><ShoppingBag size={17} aria-hidden="true" />الطلبات <ArrowLeft size={17} aria-hidden="true" /></button></div>
    <div className="admin-pulse" aria-label="حالة العمل الحالية">
      <div><span>بانتظار المراجعة</span><strong>{newOrders.length}</strong><small>طلب جديد</small></div>
      <div><span>قيد المتابعة</span><strong>{activeOrders.length}</strong><small>طلب نشط</small></div>
      <div><span>ظاهر في المتجر</span><strong>{available.length}</strong><small>من {store.products.length} منتج</small></div>
      <div><span>يحتاج فحص المخزون</span><strong>{lowStock.length}</strong><small>منتج عند الحد أو قريب منه</small></div>
    </div>
    <div className="admin-insight-strip"><div><span>المتصفحات التقريبية اليوم</span><strong>{visits ? visits.todayBrowsers.toLocaleString("ar-EG") : "—"}</strong><small>يُحسب المتصفح مرة واحدة في اليوم</small></div><div><span>صفحات شوهدت خلال ٧ أيام</span><strong>{visits ? visits.weekViews.toLocaleString("ar-EG") : "—"}</strong><small>صفحة واحدة لكل متصفح في اليوم</small></div><div><span>اقتراحات النشر</span><strong>{suggested.length.toLocaleString("ar-EG")}</strong><small>من طلبات حقيقية لمنتجات غير معروضة</small></div></div>
    <div className="admin-overview-grid">
      <section className="admin-work-block" aria-labelledby="work-orders-title"><div className="admin-block-heading"><div><p className="admin-kicker">الخطوة التالية</p><h2 id="work-orders-title">طلبات تحتاج متابعة</h2></div><button onClick={() => onOrders()}>كل الطلبات <ArrowLeft size={16} aria-hidden="true" /></button></div>
        {activeOrders.length ? <div className="admin-work-list">{activeOrders.slice(0, 4).map(order => <button key={order.id} onClick={() => onOrders(order.id)}><span className="admin-customer-mark" aria-hidden="true">{order.customer.name.trim().charAt(0)}</span><span className="admin-work-identity"><strong>{order.customer.name}</strong><small>{order.customer.city} · {order.kind === "bulk" ? "جملة ومناسبات" : "أفراد"} · {new Date(order.createdAt).toLocaleDateString("ar-EG")}</small></span><span className="admin-work-meta"><span className={order.status === "new" ? "admin-attention" : ""}>{orderLabels[order.status]}</span><bdi>{displayPrice(order.total)} ج.م</bdi></span><ArrowLeft size={16} aria-hidden="true" /></button>)}</div> : <div className="admin-work-empty"><ShoppingBag size={24} aria-hidden="true" /><strong>لا توجد طلبات تنتظر إجراءً</strong><p>ستظهر الطلبات الجديدة هنا فور وصولها.</p></div>}
      </section>
      <section className="admin-work-block admin-stock-block" aria-labelledby="work-stock-title"><div className="admin-block-heading"><div><p className="admin-kicker">من أرضنا إلى المتجر</p><h2 id="work-stock-title">نبض المخزون</h2></div><button onClick={onProducts}>كل المنتجات <ArrowLeft size={16} aria-hidden="true" /></button></div>
        {lowStock.length ? <div className="admin-stock-list">{lowStock.slice(0, 4).map(product => <button key={product.id} onClick={() => onEditProduct(product.id)}><Image src={`/media/${product.image}.jpg`} alt="" width={52} height={52} /><span><strong>{product.name}</strong><small>{product.stock < product.minimum ? "غير ظاهر: أقل من الحد" : "قريب من حد التوفر"}</small></span><bdi>{product.stock} {product.unit}</bdi></button>)}</div> : <div className="admin-work-empty"><Package size={24} aria-hidden="true" /><strong>المخزون المعروض في وضع جيد</strong><p>ستظهر هنا المنتجات التي تقترب من حد التوفر.</p></div>}
      </section>
    </div>
    {suggested.length > 0 && <section className="admin-suggestions" aria-label="منتجات مقترحة للمراجعة"><div><p className="admin-kicker">إشارة من الطلبات</p><h2>منتجات تستحق مراجعة التوفر</h2></div><div>{suggested.map(product => <button key={product.id} onClick={() => onEditProduct(product.id)}>{product.name}<small>{productDemand.get(product.id)} وحدة طُلِبت سابقًا</small><ArrowLeft size={16} aria-hidden="true" /></button>)}</div></section>}
    {nextOrder && <p className="admin-overview-note">أقرب إجراء: <button onClick={() => onOrders(nextOrder.id)}>افتح طلب {nextOrder.customer.name} <ArrowLeft size={15} aria-hidden="true" /></button></p>}
  </section>;
}

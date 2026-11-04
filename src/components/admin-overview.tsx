"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Package, ShoppingBag, Sparkles } from "lucide-react";
import type { FarmOrder, FarmStore } from "@/data/farm-types";
import { isAvailable, orderLabels } from "@/data/farm-types";
import { displayPrice } from "@/data/content";
import type { VisitSummary } from "@/lib/farm-analytics";
import { AdminCount } from "./admin-count";
import { AdminTrendChart } from "./admin-trend-chart";

type Props = {
  store: FarmStore;
  onOrders: (id?: string) => void;
  onProducts: () => void;
  onEditProduct: (id: string) => void;
};

const activeStatuses: FarmOrder["status"][] = ["new", "reviewed", "confirmed", "preparing", "out_for_delivery"];

const arabicDays = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export function AdminOverview({ store, onOrders, onProducts, onEditProduct }: Props) {
  const [visits, setVisits] = useState<VisitSummary | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/visits", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (active) setVisits(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const newOrders = store.orders.filter((order) => order.status === "new");
  const activeOrders = store.orders.filter((order) => activeStatuses.includes(order.status));
  const lowStock = store.products.filter(
    (product) => product.status === "available" && product.stock <= product.minimum + 2
  );
  const available = store.products.filter(isAvailable);
  const nextOrder = activeOrders[0];

  const totalRevenue = useMemo(() => {
    return store.orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + (order.total || 0), 0);
  }, [store.orders]);

  // Generate 7-day trend data from real store orders & visits
  const trendData = useMemo(() => {
    const today = new Date();
    const days: { label: string; orders: number; revenue: number; visits: number; dateStr: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = arabicDays[d.getDay()];

      days.push({
        label: i === 0 ? "اليوم" : dayName,
        dateStr,
        orders: 0,
        revenue: 0,
        visits: 0,
      });
    }

    // Populate orders and revenue
    for (const order of store.orders) {
      if (order.status === "cancelled") continue;
      const orderDate = new Date(order.createdAt).toISOString().split("T")[0];
      const matchingDay = days.find((d) => d.dateStr === orderDate);
      if (matchingDay) {
        matchingDay.orders += 1;
        matchingDay.revenue += order.total || 0;
      }
    }

    // Populate visits safely from summary if available
    if (visits && visits.weekViews > 0) {
      const avgViews = Math.round(visits.weekViews / 7);
      days.forEach((day, idx) => {
        // Today has todayBrowsers/todayViews, previous days distribute evenly/organically
        if (idx === days.length - 1) {
          day.visits = visits.todayViews || visits.todayBrowsers || 0;
        } else {
          day.visits = Math.max(0, avgViews);
        }
      });
    }

    return days;
  }, [store.orders, visits]);

  const productDemand = new Map<string, number>();
  for (const order of store.orders.filter((order) => order.status !== "cancelled")) {
    for (const item of order.items) {
      productDemand.set(item.id, (productDemand.get(item.id) ?? 0) + item.quantity);
    }
  }

  const suggested = [...store.products]
    .filter((product) => product.status !== "available" && (productDemand.get(product.id) ?? 0) > 0)
    .sort((a, b) => (productDemand.get(b.id) ?? 0) - (productDemand.get(a.id) ?? 0))
    .slice(0, 3);

  return (
    <section className="admin-overview" aria-labelledby="admin-overview-title">
      <div className="admin-overview-heading">
        <div>
          <p className="admin-kicker">مزارع آل ياسر / مساحة القيادة</p>
          <h1 id="admin-overview-title">نظرة على المزرعة</h1>
          <p>ما يحتاج انتباهك الآن، من المبيعات والطلبات إلى توفر المحاصيل.</p>
        </div>
        <button className="admin-primary" onClick={() => onOrders()}>
          <ShoppingBag size={17} aria-hidden="true" />
          الطلبات <ArrowLeft size={17} aria-hidden="true" />
        </button>
      </div>

      {/* KPI Pulse Cards */}
      <div className="admin-pulse" aria-label="حالة العمل الحالية">
        <div className={`admin-pulse-card ${newOrders.length ? "admin-pulse-attention" : ""}`}>
          <span className="admin-pulse-label">بانتظار المراجعة</span>
          <strong className="admin-pulse-number">
            <AdminCount value={newOrders.length} />
          </strong>
          <small>{newOrders.length ? "طلب جديد يحتاج تأكيدك" : "لا توجد طلبات معلقة"}</small>
        </div>

        <div className="admin-pulse-card">
          <span className="admin-pulse-label">قيد التجهيز والتوصيل</span>
          <strong className="admin-pulse-number">
            <AdminCount value={activeOrders.length} />
          </strong>
          <small>طلب نشط في المسار</small>
        </div>

        <div className="admin-pulse-card">
          <span className="admin-pulse-label">ظاهر في المتجر</span>
          <strong className="admin-pulse-number">
            <AdminCount value={available.length} />
          </strong>
          <small>من {store.products.length} صنف مسجل</small>
          <div
            className="admin-availability-track"
            role="meter"
            aria-label="نسبة المنتجات المتاحة"
            aria-valuemin={0}
            aria-valuemax={store.products.length}
            aria-valuenow={available.length}
          >
            <span
              style={{
                transform: `scaleX(${store.products.length ? available.length / store.products.length : 0})`,
              }}
            />
          </div>
        </div>

        <div className="admin-pulse-card">
          <span className="admin-pulse-label">تنبيه المخزون</span>
          <strong className="admin-pulse-number">
            <AdminCount value={lowStock.length} />
          </strong>
          <small>{lowStock.length ? "منتجات قاربت على النفاد" : "المخزون متوازن حاليًا"}</small>
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <AdminTrendChart
        data={trendData}
        totalRevenue={totalRevenue}
        totalOrders={store.orders.filter((o) => o.status !== "cancelled").length}
      />

      {/* Quick Insights Bar */}
      <div className="admin-insight-strip">
        <div>
          <span>المتصفحات اليوم</span>
          <strong>{visits ? <AdminCount value={visits.todayBrowsers} /> : "—"}</strong>
          <small>يُحسب الزائر مرة واحدة في اليوم</small>
        </div>
        <div>
          <span>زيارات آخر ٧ أيام</span>
          <strong>{visits ? <AdminCount value={visits.weekViews} /> : "—"}</strong>
          <small>تفاعل مباشر مع المتجر</small>
        </div>
        <div>
          <span>اقتراحات التوفر</span>
          <strong><AdminCount value={suggested.length} /></strong>
          <small>أصناف طُلبت مسبقاً وغير معروضة</small>
        </div>
      </div>

      {/* Work Blocks Grid */}
      <div className="admin-overview-grid">
        <section className="admin-work-block" aria-labelledby="work-orders-title">
          <div className="admin-block-heading">
            <div>
              <p className="admin-kicker">الخطوة التالية</p>
              <h2 id="work-orders-title">طلبات تحتاج متابعة</h2>
            </div>
            <button onClick={() => onOrders()}>
              كل الطلبات <ArrowLeft size={16} aria-hidden="true" />
            </button>
          </div>
          {activeOrders.length ? (
            <div className="admin-work-list">
              {activeOrders.slice(0, 4).map((order) => (
                <button key={order.id} onClick={() => onOrders(order.id)}>
                  <span className="admin-customer-mark" aria-hidden="true">
                    {order.customer.name.trim().charAt(0)}
                  </span>
                  <span className="admin-work-identity">
                    <strong>{order.customer.name}</strong>
                    <small>
                      {order.customer.city} · {order.kind === "bulk" ? "جملة ومناسبات" : "أفراد"} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                    </small>
                  </span>
                  <span className="admin-work-meta">
                    <span className={order.status === "new" ? "admin-attention" : ""}>
                      {orderLabels[order.status]}
                    </span>
                    <bdi>{displayPrice(order.total)} ج.م</bdi>
                  </span>
                  <ArrowLeft size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <div className="admin-work-empty">
              <ShoppingBag size={24} aria-hidden="true" />
              <strong>لا توجد طلبات تنتظر إجراءً</strong>
              <p>ستظهر الطلبات الجديدة هنا فور وصولها.</p>
            </div>
          )}
        </section>

        <section className="admin-work-block admin-stock-block" aria-labelledby="work-stock-title">
          <div className="admin-block-heading">
            <div>
              <p className="admin-kicker">من أرضنا إلى المتجر</p>
              <h2 id="work-stock-title">نبض المخزون</h2>
            </div>
            <button onClick={onProducts}>
              كل المنتجات <ArrowLeft size={16} aria-hidden="true" />
            </button>
          </div>
          {lowStock.length ? (
            <div className="admin-stock-list">
              {lowStock.slice(0, 4).map((product) => (
                <button key={product.id} onClick={() => onEditProduct(product.id)}>
                  <Image src={`/media/${product.image}.jpg`} alt="" width={52} height={52} />
                  <span>
                    <strong>{product.name}</strong>
                    <small>
                      {product.stock < product.minimum
                        ? "غير ظاهر: أقل من الحد"
                        : "قريب من حد التوفر"}
                    </small>
                  </span>
                  <bdi>
                    {product.stock} {product.unit}
                  </bdi>
                </button>
              ))}
            </div>
          ) : (
            <div className="admin-work-empty">
              <Package size={24} aria-hidden="true" />
              <strong>المخزون المعروض في وضع جيد</strong>
              <p>ستظهر هنا المنتجات التي تقترب من حد التوفر.</p>
            </div>
          )}
        </section>
      </div>

      {suggested.length > 0 && (
        <section className="admin-suggestions" aria-label="منتجات مقترحة للمراجعة">
          <div>
            <p className="admin-kicker">
              <Sparkles size={14} className="inline-icon" aria-hidden="true" /> إشارة ذكية
            </p>
            <h2>منتجات تستحق مراجعة التوفر</h2>
          </div>
          <div>
            {suggested.map((product) => (
              <button key={product.id} onClick={() => onEditProduct(product.id)}>
                {product.name}
                <small>{productDemand.get(product.id)} وحدة طُلِبت سابقًا</small>
                <ArrowLeft size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
      )}

      {nextOrder && (
        <p className="admin-overview-note">
          أقرب إجراء:{" "}
          <button onClick={() => onOrders(nextOrder.id)}>
            افتح طلب {nextOrder.customer.name} <ArrowLeft size={15} aria-hidden="true" />
          </button>
        </p>
      )}
    </section>
  );
}

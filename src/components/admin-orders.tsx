"use client";

import { useState } from "react";
import { ArrowLeft, CalendarDays, Check, MapPin, MessageCircle, Phone, Printer, Truck, X } from "lucide-react";
import { displayPrice } from "@/data/content";
import { orderLabels, type FarmOrder } from "@/data/farm-types";

const nextStatuses: Record<FarmOrder["status"], FarmOrder["status"][]> = {
  new: ["reviewed", "cancelled"],
  reviewed: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};
const steps: FarmOrder["status"][] = ["new", "reviewed", "confirmed", "preparing", "out_for_delivery", "delivered"];
const buckets = [
  { id: "attention", label: "تحتاج اتصالًا", statuses: ["new"] },
  { id: "preparation", label: "قيد العمل", statuses: ["reviewed", "confirmed", "preparing", "out_for_delivery"] },
  { id: "done", label: "منتهية", statuses: ["delivered", "cancelled"] },
] as const;

type Props = {
  orders: FarmOrder[];
  busy: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMutate: (body: object) => Promise<boolean>;
};

export function AdminOrders({ orders, busy, selectedId, onSelect, onMutate }: Props) {
  const [bucket, setBucket] = useState<string>("attention");
  const current = orders.find((order) => order.id === selectedId);
  const shown = orders.filter(
    (order) =>
      bucket === "all" ||
      buckets.find((item) => item.id === bucket)?.statuses.includes(order.status as never)
  );
  const counts = Object.fromEntries(
    buckets.map((item) => [
      item.id,
      orders.filter((order) => item.statuses.includes(order.status as never)).length,
    ])
  );

  return (
    <section className="admin-orders-desk" aria-label="مركز الطلبات">
      <div className="admin-title">
        <div>
          <p className="admin-kicker">من استلام الطلب إلى باب العميل</p>
          <h1>مركز الطلبات والتوصيل</h1>
          <p>راجع السعر ورسوم التوصيل مع العميل قبل التأكيد.</p>
        </div>
        {current && (
          <button onClick={() => onSelect(null)}>
            <X size={17} aria-hidden="true" />
            القائمة
          </button>
        )}
      </div>

      {current ? (
        <OrderDetail key={current.id} order={current} busy={busy} onMutate={onMutate} />
      ) : (
        <>
          <div className="admin-order-tabs" role="group" aria-label="حالة الطلبات">
            {buckets.map((item) => (
              <button
                key={item.id}
                aria-pressed={bucket === item.id}
                onClick={() => setBucket(item.id)}
              >
                <span>{item.label}</span>
                <strong>{counts[item.id]}</strong>
              </button>
            ))}
            <button aria-pressed={bucket === "all"} onClick={() => setBucket("all")}>
              <span>كل الطلبات</span>
              <strong>{orders.length}</strong>
            </button>
          </div>

          <div className="admin-order-queue" aria-live="polite">
            {shown.map((order) => (
              <button key={order.id} onClick={() => onSelect(order.id)}>
                <span className="admin-order-queue-main">
                  <strong>{order.customer.name}</strong>
                  <small>
                    <bdi>#{order.id.slice(0, 8)}</bdi> · {order.customer.city} ·{" "}
                    {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                  </small>
                </span>
                <span className="admin-order-queue-status">
                  {orderLabels[order.status]}
                  {order.status !== "cancelled" &&
                    order.status !== "delivered" &&
                    order.delivery?.fee === null && <small>التوصيل يحتاج تسعيرًا</small>}
                </span>
                <strong className="admin-order-queue-price">
                  <bdi>
                    {displayPrice(order.total + (order.delivery?.fee ?? 0))} ج.م
                  </bdi>
                  {order.delivery?.fee === null && <small>قبل التوصيل</small>}
                </strong>
                <ArrowLeft size={18} aria-hidden="true" />
              </button>
            ))}
            {!shown.length && (
              <div className="admin-order-queue-empty">
                <Check size={24} aria-hidden="true" />
                <strong>لا توجد طلبات هنا الآن</strong>
                <span>ستظهر تلقائيًا عند وصولها إلى هذه المرحلة.</span>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function OrderDetail({
  order,
  busy,
  onMutate,
}: {
  order: FarmOrder;
  busy: boolean;
  onMutate: Props["onMutate"];
}) {
  const [delivery, setDelivery] = useState(
    order.delivery ?? { fee: null, date: "", agent: "", note: "" }
  );
  const finished = order.status === "cancelled" || order.status === "delivered";
  const dirty = JSON.stringify(delivery) !== JSON.stringify(order.delivery);
  const stepIndex = steps.indexOf(order.status);
  const canConfirm = !dirty && order.delivery?.fee !== null && order.delivery?.fee !== undefined;

  // WhatsApp quick format
  const rawPhone = order.customer.phone.replace(/[^0-9]/g, "");
  // Prepend Egypt code 20 if local mobile (010, 011, 012, 015)
  const waNumber = rawPhone.startsWith("0") ? `2${rawPhone}` : rawPhone.startsWith("2") ? rawPhone : `20${rawPhone}`;
  const totalWithDelivery = order.total + (order.delivery?.fee ?? 0);
  const waMessage = encodeURIComponent(
    `مرحبًا ${order.customer.name}، بخصوص طلبك من مزارع آل ياسر رقم #${order.id.slice(0, 8)}.\nإجمالي الطلب: ${displayPrice(totalWithDelivery)} ج.م.\nعنوان التوصيل: ${order.customer.city}، ${order.customer.address}.\nيسعدنا تأكيد طلبك وترتيب موعد التوصيل معك.`
  );
  const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

  function handlePrint() {
    window.print();
  }

  return (
    <div className="admin-order-detail" key={order.id}>
      <div className="admin-order-detail-head">
        <div>
          <p className="admin-kicker">طلب {order.kind === "bulk" ? "جملة ومناسبات" : "أفراد"}</p>
          <h2>{order.customer.name}</h2>
          <span>
            <bdi>#{order.id.slice(0, 8)}</bdi> · {new Date(order.createdAt).toLocaleString("ar-EG")}
          </span>
        </div>
        <div className="admin-order-top-actions">
          <button
            type="button"
            className="admin-print-btn"
            onClick={handlePrint}
            title="طباعة بوليصة التوصيل"
          >
            <Printer size={16} aria-hidden="true" />
            <span>طباعة البوليصة</span>
          </button>
          <strong className="admin-order-current">{orderLabels[order.status]}</strong>
        </div>
      </div>

      {order.status !== "cancelled" && (
        <ol className="admin-order-steps" aria-label="مراحل الطلب">
          {steps.map((step, index) => (
            <li
              key={step}
              className={index <= stepIndex ? "is-done" : ""}
              aria-current={index === stepIndex ? "step" : undefined}
            >
              <span>{index < stepIndex ? <Check size={14} aria-hidden="true" /> : index + 1}</span>
              <small>{orderLabels[step]}</small>
            </li>
          ))}
        </ol>
      )}

      <div className="admin-order-columns">
        <div className="admin-order-main">
          <section className="admin-order-section">
            <div className="admin-section-header-inline">
              <h3>بيانات العميل</h3>
              <a
                href={waLink}
                target="_blank"
                rel="noreferrer"
                className="admin-whatsapp-btn"
                title="مراسلة عبر واتساب"
              >
                <MessageCircle size={16} aria-hidden="true" />
                <span>مراسلة واتساب</span>
              </a>
            </div>
            <div className="admin-customer-lines">
              <a href={`tel:${order.customer.phone}`}>
                <Phone size={17} aria-hidden="true" />
                <bdi>{order.customer.phone}</bdi>
              </a>
              <p>
                <MapPin size={17} aria-hidden="true" />
                {order.customer.city}، {order.customer.address}
              </p>
              {order.customer.notes && <p>ملاحظة العميل: {order.customer.notes}</p>}
            </div>
          </section>

          <section className="admin-order-section">
            <h3>المنتجات</h3>
            {order.items.map((item) => (
              <div className="admin-order-line" key={item.id}>
                <span>
                  {item.name}
                  <small>
                    {item.quantity} × {item.unit}
                  </small>
                </span>
                <bdi>{displayPrice(item.price * item.quantity)} ج.م</bdi>
              </div>
            ))}
          </section>

          <section className="admin-order-section">
            <div className="admin-order-section-heading">
              <h3>خطة التوصيل</h3>
              <Truck size={19} aria-hidden="true" />
            </div>
            <p className="admin-hint">
              سجل الرسوم ولو كانت صفرًا. الموعد والمسؤول يمكن تحديثهما عند ترتيب الرحلة.
            </p>
            <form
              className="admin-delivery-form"
              onSubmit={async (event) => {
                event.preventDefault();
                await onMutate({ action: "delivery", id: order.id, delivery });
              }}
            >
              <div className="admin-pair">
                <label>
                  رسوم التوصيل (ج.م)
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    required
                    disabled={finished || busy}
                    value={delivery.fee ?? ""}
                    onChange={(event) =>
                      setDelivery({
                        ...delivery,
                        fee: event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label>
                  موعد التوصيل المتوقع
                  <input
                    type="date"
                    disabled={finished || busy}
                    value={delivery.date}
                    onChange={(event) => setDelivery({ ...delivery, date: event.target.value })}
                  />
                </label>
              </div>
              <label>
                مسؤول التوصيل
                <input
                  maxLength={80}
                  disabled={finished || busy}
                  value={delivery.agent}
                  onChange={(event) => setDelivery({ ...delivery, agent: event.target.value })}
                  placeholder="يُحدد لاحقًا"
                />
              </label>
              <label>
                تعليمات داخلية للتوصيل
                <textarea
                  rows={2}
                  maxLength={500}
                  disabled={finished || busy}
                  value={delivery.note}
                  onChange={(event) => setDelivery({ ...delivery, note: event.target.value })}
                />
              </label>
              {!finished && (
                <button
                  className="admin-primary"
                  disabled={busy || !dirty || delivery.fee === null}
                  type="submit"
                >
                  حفظ خطة التوصيل
                </button>
              )}
            </form>
          </section>
        </div>

        <aside className="admin-order-summary">
          <p className="admin-kicker">ملخص التسعير</p>
          <div>
            <span>المنتجات</span>
            <bdi>{displayPrice(order.total)} ج.م</bdi>
          </div>
          <div>
            <span>التوصيل</span>
            <bdi>
              {order.delivery?.fee === null || order.delivery?.fee === undefined
                ? "لم يُحدد"
                : `${displayPrice(order.delivery.fee)} ج.م`}
            </bdi>
          </div>
          <div className="admin-order-grand">
            <strong>الإجمالي بعد التوصيل</strong>
            <strong>
              <bdi>
                {order.delivery?.fee === null || order.delivery?.fee === undefined
                  ? "—"
                  : `${displayPrice(order.total + order.delivery.fee)} ج.م`}
              </bdi>
            </strong>
          </div>
          <p>
            السعر الأساسي محفوظ وقت الطلب. راجع الوزن النهائي وأي تعديل مع العميل قبل التأكيد.
          </p>
          {order.delivery?.date && (
            <p className="admin-order-date">
              <CalendarDays size={16} aria-hidden="true" />
              {order.delivery.date}
            </p>
          )}
        </aside>
      </div>

      {!finished && (
        <div className="admin-order-actions">
          <h3>الخطوة التالية</h3>
          <div>
            {nextStatuses[order.status].map((status) => (
              <button
                key={status}
                className={status === "cancelled" ? "" : "admin-primary"}
                disabled={
                  busy ||
                  (status === "confirmed" && !canConfirm) ||
                  (status === "out_for_delivery" &&
                    (dirty || !order.delivery?.date || !order.delivery?.agent))
                }
                onClick={() => {
                  if (status === "cancelled" && !window.confirm("إلغاء الطلب وإعادة أي كميات محجوزة؟"))
                    return;
                  onMutate({ action: "order", id: order.id, status });
                }}
              >
                {status === "reviewed" ? "تمت المراجعة مع العميل" : orderLabels[status]}
              </button>
            ))}
          </div>
          {order.status === "reviewed" && !canConfirm && (
            <p className="admin-hint">احفظ رسوم التوصيل، ولو صفرًا، قبل تأكيد الطلب.</p>
          )}
          {order.status === "preparing" && (!order.delivery?.date || !order.delivery?.agent || dirty) && (
            <p className="admin-hint">احفظ الموعد ومسؤول التوصيل قبل إخراج الطلب.</p>
          )}
        </div>
      )}
    </div>
  );
}

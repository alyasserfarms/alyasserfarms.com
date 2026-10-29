"use client";

import { ArrowLeft, ArrowRight, Check, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { categories, displayPrice, products, type Product } from "@/data/content";
import { MAX_QUANTITY, useCart } from "@/lib/cart-store";
import { ProductCard } from "./product-card";
import { Photo } from "./ui";

export function Breadcrumb({ current, category }: { current: string; category?: string }) {
  return <nav className="breadcrumb" aria-label="مسار التصفح"><Link href="/">الرئيسية</Link><span aria-hidden="true">/</span>{category && <><Link href="/shop">المتجر</Link><span aria-hidden="true">/</span></>}<span aria-current="page">{current}</span></nav>;
}

export function DemoNotice() {
  return <p className="commerce-demo-note">معاينة تفاعلية. الصور والمنتجات والأسعار تجريبية؛ العملة وبيانات البيع النهائية للاعتماد.</p>;
}

function Feedback({ text, clear }: { text: string; clear: () => void }) {
  return <div className="commerce-feedback" role="status" aria-live="polite">{text && <><Check size={18} aria-hidden="true" /><span>{text}</span><button className="icon-button" type="button" onClick={clear} aria-label="إغلاق التنبيه"><X size={18} aria-hidden="true" /></button></>}</div>;
}

export function ShopView({ initialCategory = "all", initialQuery = "" }: { initialCategory?: string; initialQuery?: string }) {
  const { count } = useCart();
  const [category, setCategory] = useState(categories.some((item) => item.id === initialCategory) ? initialCategory : "all");
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState("featured");
  const [notice, setNotice] = useState("");
  const normalized = (text: string) => text.trim().replace(/[أإآ]/g, "ا").replace(/[ًٌٍَُِّْـ]/g, "");
  const filtered = products.filter((product) => (category === "all" || product.category === category) && normalized(`${product.name} ${categories.find((item) => item.id === product.category)?.name}`).includes(normalized(query)));
  const visible = [...filtered].sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : 0);

  function updateUrl(nextCategory: string, nextQuery: string) {
    const params = new URLSearchParams();
    if (nextCategory !== "all") params.set("category", nextCategory);
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    window.history.replaceState(null, "", `/shop${params.size ? `?${params}` : ""}`);
  }

  return <div className="commerce-page frame">
    <Breadcrumb current="المتجر" />
    <div className="shop-intro"><div><h1>كل الخير، أقرب إليك</h1><p>اختر ما يلهم وجبتك القادمة.</p></div><Photo name="vegetables" alt="خضروات متنوعة، تصوير تمثيلي" sizes="(max-width: 700px) 90vw, 36vw" priority /></div>
    <DemoNotice />
    <div className="shop-toolbar" data-ui><div><label htmlFor="shop-search">ابحث عن منتج</label><div className="search-input"><Search size={20} aria-hidden="true" /><input id="shop-search" type="search" value={query} placeholder="ماذا تحب على مائدتك؟" onChange={(event) => { setQuery(event.target.value); updateUrl(category, event.target.value); }} /></div></div><div><label htmlFor="shop-sort">ترتيب المنتجات</label><select id="shop-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">اختياراتنا</option><option value="price-low">السعر: من الأقل</option><option value="price-high">السعر: من الأعلى</option></select></div></div>
    <div className="product-filters shop-filters" role="group" aria-label="فئات المتجر"><button type="button" aria-pressed={category === "all"} onClick={() => { setCategory("all"); updateUrl("all", query); }}>الكل</button>{categories.map((item) => <button type="button" key={item.id} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); updateUrl(item.id, query); }}>{item.name}</button>)}</div>
    <div className="catalogue-count"><p role="status">{visible.length ? `عرض ${displayPrice(visible.length)} من المنتجات التجريبية` : "لا توجد نتائج مطابقة"}</p>{(query || category !== "all") && <button className="reset-filters" type="button" onClick={() => { setQuery(""); setCategory("all"); updateUrl("all", ""); }}>مسح التصفية<X size={16} aria-hidden="true" /></button>}</div>
    {visible.length ? <div className="catalogue-grid">{visible.map((product) => <ProductCard key={product.id} product={product} onAdded={(name) => setNotice(`أضيف ${name} إلى سلة المعاينة. عدد المنتجات ${displayPrice(count + 1)}.`)} />)}</div> : <div className="commerce-empty"><Search size={44} aria-hidden="true" /><h2>نبحث عن اختيار آخر؟</h2><p>جرّب اسمًا أقصر، أو اختر فئة مختلفة.</p><button className="button" type="button" onClick={() => { setQuery(""); setCategory("all"); updateUrl("all", ""); }}>عرض جميع المنتجات<ArrowLeft size={18} aria-hidden="true" /></button></div>}
    <Feedback text={notice} clear={() => setNotice("")} />
  </div>;
}

export function QuantityControl({ value, setValue, name, min = 1, max = MAX_QUANTITY }: { value: number; setValue: (value: number) => void; name: string; min?: number; max?: number }) {
  return <div className="quantity-picker" role="group" aria-label={`كمية ${name}`}><button type="button" disabled={value <= min} onClick={() => setValue(value - 1)} aria-label={`تقليل كمية ${name}`}><Minus size={18} aria-hidden="true" /></button><output aria-live="polite" aria-label="الكمية">{displayPrice(value)}</output><button type="button" disabled={value >= max} onClick={() => setValue(value + 1)} aria-label={`زيادة كمية ${name}`}><Plus size={18} aria-hidden="true" /></button></div>;
}

export function ProductView({ product }: { product: Product }) {
  const { cart, count, add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState("");
  const remaining = MAX_QUANTITY - (cart[product.id] ?? 0);
  const category = categories.find((item) => item.id === product.category)!;
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  return <div className="commerce-page frame">
    <Breadcrumb current={product.name} category={category.name} />
    <div className="product-page-layout"><Photo name={product.image} alt={`صورة تجريبية: ${product.name}`} sizes="(max-width: 700px) 90vw, 52vw" priority /><div className="product-page-copy"><h1>{product.name}</h1><p className="product-page-unit"><Link href={`/shop?category=${product.category}`}>{category.name}</Link><span aria-hidden="true"> · </span>{product.unit}</p><p>{product.description}</p><p className="product-page-price"><bdi>{displayPrice(product.price)}</bdi><span>وحدة سعرية تجريبية</span></p><div className="product-purchase" data-ui><QuantityControl name={product.name} value={quantity} setValue={setQuantity} max={remaining || 1} /><button className="button" type="button" disabled={!remaining} onClick={() => { const amount = Math.min(quantity, remaining); if (add(product.id, amount)) { setNotice(`أضيف ${product.name}، بكمية ${displayPrice(amount)} إلى سلة المعاينة. عدد المنتجات ${displayPrice(count + amount)}.`); setQuantity(1); } }}>أضف إلى السلة<Plus size={20} aria-hidden="true" /></button></div>{remaining === 0 && <p role="status">وصلت إلى حد كمية المعاينة لهذا الصنف.</p>}<div className="product-live-feedback" role="status">{notice && <><Check size={18} aria-hidden="true" /><p>{notice}</p><Link href="/cart">عرض السلة<ArrowLeft size={16} aria-hidden="true" /></Link></>}</div><DemoNotice /><details className="product-disclosure"><summary>عن بيانات المنتج</summary><p>الصورة والوصف والعبوة والسعر أمثلة لتجربة التصميم. تفاصيل المنشأ والحفظ والصلاحية والوزن النهائي ستظهر بعد اعتماد المنتج الفعلي.</p></details><details className="product-disclosure"><summary>الطلب والتوصيل</summary><p>يمكنك تجربة السلة ومراجعة بيانات التوصيل محليًا. المناطق والرسوم والمواعيد وطرق الدفع لم تُعتمد بعد.</p><Link href="/delivery" className="text-link">معاينة التوصيل<ArrowLeft size={18} aria-hidden="true" /></Link></details></div></div>
    <section className="related-section" aria-labelledby="related-title"><div className="section-heading"><h2 id="related-title">للمائدة بقية</h2><Link href="/shop" className="text-link">كل المنتجات<ArrowLeft size={18} aria-hidden="true" /></Link></div><div className="catalogue-grid">{related.map((item) => <ProductCard product={item} key={item.id} onAdded={(name) => setNotice(`أضيف ${name} إلى سلة المعاينة. عدد المنتجات ${displayPrice(count + 1)}.`)} />)}</div></section>
  </div>;
}

function EmptyCart() {
  return <div className="commerce-empty"><ShoppingBag size={48} strokeWidth={1.3} aria-hidden="true" /><h2>مائدتك تنتظر اختيارك</h2><p>ابدأ بمنتج تحبّه، وسنجمع اختياراتك هنا.</p><Link href="/shop" className="button">اكتشف المتجر<ArrowLeft size={18} aria-hidden="true" /></Link></div>;
}

export function CartSummary({ action = true }: { action?: boolean }) {
  const { items, total } = useCart();
  return <aside className="order-summary" aria-labelledby="summary-title"><h2 id="summary-title">ملخص اختياراتك</h2><ul>{items.map(({ product, quantity }) => <li key={product.id}><span>{product.name}<small>الكمية: {displayPrice(quantity)}</small></span><bdi>{displayPrice(product.price * quantity)}</bdi></li>)}</ul><div className="summary-total"><span>إجمالي تجريبي</span><strong><bdi>{displayPrice(total)}</bdi></strong></div><p>بوحدات سعرية تجريبية. رسوم التوصيل والعملة النهائية لم تُعتمدا بعد.</p>{action && <Link href="/delivery" className="button">معاينة التوصيل<ArrowLeft size={18} aria-hidden="true" /></Link>}<p className="summary-note">لا تنشئ هذه المعاينة طلبًا أو عملية دفع.</p></aside>;
}

export function CartView() {
  const { items, total, ready, setQuantity, remove, storageAvailable } = useCart();
  const [removed, setRemoved] = useState<{ id: string; name: string; quantity: number } | null>(null);
  return <div className="commerce-page transaction-page frame"><Breadcrumb current="السلة" /><div className="commerce-title"><h1>سلة المائدة</h1><p>راجع ما تحب، وعدّل الكمية على مهل.</p></div><DemoNotice />
    {removed && <div className="undo-removal" role="status"><span>حُذف {removed.name} من السلة.</span><button type="button" onClick={() => { setQuantity(removed.id, removed.quantity); setRemoved(null); }}>تراجع عن الحذف<ArrowRight size={18} aria-hidden="true" /></button><button className="icon-button" type="button" aria-label="إغلاق رسالة الحذف" onClick={() => setRemoved(null)}><X size={18} aria-hidden="true" /></button></div>}
    {!ready ? <p role="status" className="cart-loading">جارٍ استعادة اختيارات السلة…</p> : items.length ? <div className="cart-page-layout"><div className="cart-page-list">{items.map(({ product, quantity }) => <article className="cart-line" key={product.id}><Link href={`/products/${product.id}`} className="cart-line-photo"><Image src={`/media/${product.image}.jpg`} alt={`صورة تمثيلية: ${product.name}`} width={160} height={180} /></Link><div className="cart-line-copy"><h2><Link href={`/products/${product.id}`}>{product.name}</Link></h2><p>{product.unit}</p><QuantityControl name={product.name} value={quantity} setValue={(value) => setQuantity(product.id, value)} /></div><div className="cart-line-end"><p className="price"><bdi>{displayPrice(product.price * quantity)}</bdi></p><button className="remove-line" type="button" onClick={() => { setRemoved({ id: product.id, name: product.name, quantity }); remove(product.id); }} aria-label={`حذف ${product.name}`}><Trash2 size={18} aria-hidden="true" /><span>حذف</span></button></div></article>)}<div className="cart-list-footer"><Link href="/shop" className="text-link">أكمل اكتشاف المتجر<ArrowLeft size={18} aria-hidden="true" /></Link><p>الإجمالي: <bdi>{displayPrice(total)}</bdi> وحدة تجريبية</p></div></div><CartSummary /></div> : <EmptyCart />}
    <p className="cart-storage-note">{storageAvailable ? "تُحفظ اختيارات السلة على هذا المتصفح فقط. لا تُحفظ بيانات التوصيل." : "التخزين المحلي غير متاح في متصفحك؛ تبقى السلة أثناء هذه الزيارة فقط."}</p>
  </div>;
}

type Address = { name: string; phone: string; city: string; address: string; notes: string };
type AddressErrors = Partial<Record<keyof Address, string>>;
const fields = [{ id: "name", label: "الاسم", autoComplete: "name" }, { id: "phone", label: "رقم الهاتف", autoComplete: "tel" }, { id: "city", label: "المدينة", autoComplete: "address-level2" }, { id: "address", label: "العنوان بالتفصيل", autoComplete: "street-address" }] as const;

export function DeliveryView() {
  const { items, ready } = useCart();
  const [address, setAddress] = useState<Address>({ name: "", phone: "", city: "", address: "", notes: "" });
  const [errors, setErrors] = useState<AddressErrors>({});
  const [review, setReview] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: AddressErrors = {};
    if (address.name.trim().length < 2) next.name = "اكتب الاسم من حرفين على الأقل.";
    const phone = address.phone.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
    if (!/^[+\d()\s-]{7,24}$/.test(phone) || phone.replace(/\D/g, "").length < 7) next.phone = "اكتب رقم هاتف صحيحًا من 7 أرقام على الأقل.";
    if (address.city.trim().length < 2) next.city = "اكتب اسم المدينة.";
    if (address.address.trim().length < 8) next.address = "أضف الشارع والمبنى وتفاصيل تساعد على الوصول، 8 أحرف على الأقل.";
    setErrors(next);
    if (Object.keys(next).length) { window.setTimeout(() => errorRef.current?.focus(), 0); return; }
    setReview(true);
    window.setTimeout(() => { reviewRef.current?.focus(); reviewRef.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, 0);
  }

  return <div className="commerce-page transaction-page frame"><Breadcrumb current="التوصيل" /><div className="commerce-title"><h1>{review ? "مراجعة الاختيارات" : "عنوان التوصيل"}</h1><p>معاينة محلية لخطوة التوصيل.</p></div><DemoNotice />{!ready ? <p role="status" className="cart-loading">جارٍ استعادة اختيارات السلة…</p> : !items.length ? <EmptyCart /> : <div className="delivery-page-layout"><div>{review ? <div className="address-review" ref={reviewRef} tabIndex={-1}><Check size={36} aria-hidden="true" /><h2>بياناتك جاهزة للمراجعة</h2><p>تُعرض هنا على جهازك فقط. لم تُرسل إلى المزارع ولم يُنشأ طلب.</p><dl><div><dt>الاسم</dt><dd>{address.name}</dd></div><div><dt>الهاتف</dt><dd><bdi dir="ltr">{address.phone}</bdi></dd></div><div><dt>المدينة</dt><dd>{address.city}</dd></div><div><dt>العنوان</dt><dd>{address.address}</dd></div>{address.notes.trim() && <div><dt>ملاحظات</dt><dd>{address.notes}</dd></div>}</dl><div className="review-actions"><button className="button" type="button" onClick={() => setReview(false)}>تعديل البيانات<ArrowRight size={18} aria-hidden="true" /></button><Link href="/shop" className="text-link">العودة للمتجر<ArrowLeft size={18} aria-hidden="true" /></Link></div><p className="delivery-policy-note">مناطق الخدمة ورسوم التوصيل ومواعيده ووسائل الدفع ستظهر بعد اعتمادها.</p></div> : <form className="delivery-form" noValidate onSubmit={submit}><h2>بيانات المستلم</h2><p>استخدم بيانات تجريبية للمراجعة؛ لا يجري إرسالها أو حفظها.</p>{Object.keys(errors).length > 0 && <div ref={errorRef} className="form-error-summary" role="alert" tabIndex={-1}><h3>راجع الحقول التالية</h3><ul>{fields.filter((field) => errors[field.id]).map((field) => <li key={field.id}><a href={`#delivery-${field.id}`} onClick={(event) => { event.preventDefault(); document.getElementById(`delivery-${field.id}`)?.focus(); }}>{errors[field.id]}</a></li>)}</ul></div>}<div className="address-fields">{fields.map((field) => <div className={`address-field field-${field.id}`} key={field.id}><label htmlFor={`delivery-${field.id}`}>{field.label}<span>مطلوب</span></label>{field.id === "address" ? <textarea id={`delivery-${field.id}`} rows={3} autoComplete={field.autoComplete} maxLength={300} required value={address[field.id]} aria-invalid={!!errors[field.id]} aria-describedby={errors[field.id] ? `${field.id}-error` : undefined} onChange={(event) => setAddress((current) => ({ ...current, [field.id]: event.target.value }))} /> : <input id={`delivery-${field.id}`} type={field.id === "phone" ? "tel" : "text"} dir={field.id === "phone" ? "ltr" : undefined} autoComplete={field.autoComplete} maxLength={field.id === "phone" ? 24 : 80} required value={address[field.id]} aria-invalid={!!errors[field.id]} aria-describedby={errors[field.id] ? `${field.id}-error` : undefined} onChange={(event) => setAddress((current) => ({ ...current, [field.id]: event.target.value }))} />}{errors[field.id] && <p className="field-error" id={`${field.id}-error`}>{errors[field.id]}</p>}</div>)}<div className="address-field field-notes"><label htmlFor="delivery-notes">ملاحظات إضافية<span>اختياري</span></label><textarea id="delivery-notes" rows={3} maxLength={300} value={address.notes} onChange={(event) => setAddress((current) => ({ ...current, notes: event.target.value }))} /></div></div><p className="delivery-policy-note">لا تظهر رسوم أو مواعيد افتراضية. تُضاف الخيارات الفعلية بعد اعتماد مناطق الخدمة.</p><button className="button" type="submit">مراجعة البيانات محليًا<ArrowLeft size={18} aria-hidden="true" /></button><Link className="text-link delivery-back" href="/cart">العودة إلى السلة<ArrowRight size={18} aria-hidden="true" /></Link></form>}</div><CartSummary action={false} /></div>}</div>;
}

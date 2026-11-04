"use client";
import { useFarm } from "@/components/farm-provider";

import { ArrowLeft, ArrowRight, Check, Minus, Plus, Search, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { categories, displayPrice, } from "@/data/content";
import { MAX_QUANTITY, useCart } from "@/lib/cart-store";
import { ProductCard } from "./product-card";
import { Photo } from "./ui";
import { CheckoutView } from "./checkout";
import type { FarmProduct } from "@/data/farm-types";

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
  const { products } = useFarm();
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

export function ProductView({ product: initialProduct }: { product: FarmProduct }) {
  const { products } = useFarm();
  const product = products.find(item => item.id === initialProduct.id) ?? initialProduct;
  const { cart, count, add } = useCart();
  const [quantity, setQuantity] = useState(product.minimum);
  const [notice, setNotice] = useState("");
  const remaining = Math.max(0, Math.min(MAX_QUANTITY, product.stock) - (cart[product.id] ?? 0));
  const category = categories.find((item) => item.id === product.category)!;
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  return <div className="commerce-page frame">
    <Breadcrumb current={product.name} category={category.name} />
    <div className="product-page-layout"><Photo name={product.image} alt={`صورة تجريبية: ${product.name}`} sizes="(max-width: 700px) 90vw, 52vw" priority /><div className="product-page-copy"><h1>{product.name}</h1><p className="product-page-unit"><Link href={`/shop?category=${product.category}`}>{category.name}</Link><span aria-hidden="true"> · </span>{product.unit}</p><p>{product.description}</p>{product.preparation && <p>{product.preparation}</p>}<p className="product-page-price"><bdi>{displayPrice(product.price)}</bdi><span>ج.م</span></p><div className="product-purchase" data-ui><QuantityControl name={product.name} value={quantity} setValue={setQuantity} min={product.minimum} max={remaining || product.minimum} /><button className="button" type="button" disabled={remaining < product.minimum} onClick={() => { const amount = Math.min(quantity, remaining); if (add(product.id, amount)) { setNotice(`أضيف ${product.name}، بكمية ${displayPrice(amount)} إلى سلة المعاينة. عدد المنتجات ${displayPrice(count + amount)}.`); setQuantity(product.minimum); } }}>أضف إلى السلة<Plus size={20} aria-hidden="true" /></button></div>{remaining === 0 && <p role="status">وصلت إلى حد كمية المعاينة لهذا الصنف.</p>}<div className="product-live-feedback" role="status">{notice && <><Check size={18} aria-hidden="true" /><p>{notice}</p><Link href="/cart">عرض السلة<ArrowLeft size={16} aria-hidden="true" /></Link></>}</div><DemoNotice /><details className="product-disclosure"><summary>عن بيانات المنتج</summary><p>الصورة والوصف والعبوة والسعر أمثلة لتجربة التصميم. تفاصيل المنشأ والحفظ والصلاحية والوزن النهائي ستظهر بعد اعتماد المنتج الفعلي.</p></details><details className="product-disclosure"><summary>الطلب والتوصيل</summary><p>يمكنك إرسال طلبك للمراجعة، ثم تتواصل معك المزرعة لتأكيد التوفر والتوصيل. الرسوم والمواعيد وطرق الدفع تُحدّد عند التواصل.</p><Link href="/delivery" className="text-link">متابعة الطلب<ArrowLeft size={18} aria-hidden="true" /></Link></details></div></div>
    <section className="related-section" aria-labelledby="related-title"><div className="section-heading"><h2 id="related-title">للمائدة بقية</h2><Link href="/shop" className="text-link">كل المنتجات<ArrowLeft size={18} aria-hidden="true" /></Link></div><div className="catalogue-grid">{related.map((item) => <ProductCard product={item} key={item.id} onAdded={(name) => setNotice(`أضيف ${name} إلى سلة المعاينة. عدد المنتجات ${displayPrice(count + 1)}.`)} />)}</div></section>
  </div>;
}

function EmptyCart() {
  return <div className="commerce-empty"><ShoppingBag size={48} strokeWidth={1.3} aria-hidden="true" /><h2>مائدتك تنتظر اختيارك</h2><p>ابدأ بمنتج تحبّه، وسنجمع اختياراتك هنا.</p><Link href="/shop" className="button">اكتشف المتجر<ArrowLeft size={18} aria-hidden="true" /></Link></div>;
}

export function CartSummary({ action = true }: { action?: boolean }) {
  const { items, total } = useCart();
  return <aside className="order-summary" aria-labelledby="summary-title"><h2 id="summary-title">ملخص اختياراتك</h2><ul>{items.map(({ product, quantity }) => <li key={product.id}><span>{product.name}<small>الكمية: {displayPrice(quantity)}</small></span><bdi>{displayPrice(product.price * quantity)}</bdi></li>)}</ul><div className="summary-total"><span>الإجمالي المبدئي</span><strong><bdi>{displayPrice(total)}</bdi></strong></div><p>بالجنيه المصري. التوصيل والوزن النهائي يُراجعان قبل التأكيد.</p>{action && <Link href="/delivery" className="button">متابعة الطلب<ArrowLeft size={18} aria-hidden="true" /></Link>}<p className="summary-note">يرسل الطلب للمراجعة قبل تأكيده. لا تتم عملية دفع.</p></aside>;
}

export function CartView() {
  const { items, total, ready, setQuantity, remove, storageAvailable, invalidIds } = useCart();
  const [removed, setRemoved] = useState<{ id: string; name: string; quantity: number } | null>(null);
  return <div className="commerce-page transaction-page frame"><Breadcrumb current="السلة" /><div className="commerce-title"><h1>سلة المائدة</h1><p>راجع ما تحب، وعدّل الكمية على مهل.</p></div><DemoNotice />
    {!!invalidIds.length && <div className="admin-error"><p>بعض المنتجات لم تعد متاحة. أزلها قبل متابعة الطلب.</p><button type="button" onClick={() => invalidIds.forEach(remove)}>إزالة الأصناف غير المتاحة</button></div>}
    {removed && <div className="undo-removal" role="status"><span>حُذف {removed.name} من السلة.</span><button type="button" onClick={() => { setQuantity(removed.id, removed.quantity); setRemoved(null); }}>تراجع عن الحذف<ArrowRight size={18} aria-hidden="true" /></button><button className="icon-button" type="button" aria-label="إغلاق رسالة الحذف" onClick={() => setRemoved(null)}><X size={18} aria-hidden="true" /></button></div>}
    {!ready ? <p role="status" className="cart-loading">جارٍ استعادة اختيارات السلة…</p> : items.length ? <div className="cart-page-layout"><div className="cart-page-list">{items.map(({ product, quantity }) => <article className="cart-line" key={product.id}><Link href={`/products/${product.id}`} className="cart-line-photo"><Image src={`/media/${product.image}.jpg`} alt={`صورة تمثيلية: ${product.name}`} width={160} height={180} /></Link><div className="cart-line-copy"><h2><Link href={`/products/${product.id}`}>{product.name}</Link></h2><p>{product.unit}</p><QuantityControl name={product.name} value={quantity} min={product.minimum} max={Math.min(99, product.stock)} setValue={(value) => setQuantity(product.id, value)} /></div><div className="cart-line-end"><p className="price"><bdi>{displayPrice(product.price * quantity)}</bdi></p><button className="remove-line" type="button" onClick={() => { setRemoved({ id: product.id, name: product.name, quantity }); remove(product.id); }} aria-label={`حذف ${product.name}`}><Trash2 size={18} aria-hidden="true" /><span>حذف</span></button></div></article>)}<div className="cart-list-footer"><Link href="/shop" className="text-link">أكمل اكتشاف المتجر<ArrowLeft size={18} aria-hidden="true" /></Link><p>الإجمالي: <bdi>{displayPrice(total)}</bdi> ج.م</p></div></div><CartSummary /></div> : <EmptyCart />}
    <p className="cart-storage-note">{storageAvailable ? "تُحفظ اختيارات السلة على هذا المتصفح فقط. تُرسل بيانات التوصيل عند تقديم الطلب للمزرعة." : "التخزين المحلي غير متاح في متصفحك؛ تبقى السلة أثناء هذه الزيارة فقط."}</p>
  </div>;
}


export function DeliveryView() { return <CheckoutView />; }

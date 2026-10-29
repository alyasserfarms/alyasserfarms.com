"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowUpLeft, Check, ChevronDown, ClipboardCheck, Copy, Leaf, MapPin, Minus, Package, Phone, Plus, ShoppingBasket, ShoppingCart, Sprout, Truck, Utensils, Users, Wheat, X } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { products, displayPrice } from "@/data/content";
import { commerceSettings as settings } from "@/data/commerce-settings";
import { useCart, MAX_QUANTITY } from "@/lib/cart-store";

const retailIds = ["tomatoes", "cucumber", "oranges", "milk", "dates", "vegetable-basket"];
const meatIds = ["beef", "chicken"];
const productCutouts = new Set(["tomatoes", "cucumber", "oranges"]);
const productPhoto = (id: string, image: string) => productCutouts.has(id) ? `/media/product-${id}.webp` : `/media/${image}.jpg`;
const bundleTypes = [{ id: "wholesale", label: "جملة", icon: Package }, { id: "restaurants", label: "مطاعم", icon: Utensils }, { id: "events", label: "مناسبات", icon: Users }] as const;
type BundleType = typeof bundleTypes[number]["id"];
const orderSteps = [
  { icon: ShoppingBasket, title: "اختار المنتجات والكميات", text: "تجوّل بين الخيرات، وافتح التفاصيل، واجمع اختياراتك في السلة." },
  { icon: ClipboardCheck, title: "راجع التفاصيل", text: "راجع الأصناف والكميات. وللطلبات الكبيرة، جهّز تفاصيل الباقة التي تناسبك." },
  { icon: Phone, title: "تواصل لتأكيد الطلب", text: "اتصل بنا للاستفسار عن التشكيلة والأسعار والتوصيل قبل اعتماد أي طلب." },
];

function SceneImage({ name, alt, className = "" }: { name: string; alt: string; className?: string }) {
  return <div className={`farm-scene-image ${className}`}><Image src={`/media/${name}.webp`} alt={alt} fill sizes="100vw" quality={85} /></div>;
}

function SectionTitle({ children, light = false, id }: { children: React.ReactNode; light?: boolean; id?: string }) {
  return <div className={`farm-section-heading ${light ? "on-forest" : ""}`} data-reveal="type"><Wheat size={25} strokeWidth={1.4} aria-hidden="true" /><h2 id={id}>{children}</h2></div>;
}

function EidDetails({ meat }: { meat: boolean }) {
  return <dl className="farm-eid-details"><div><dt>التشكيلة</dt><dd>{meat ? "أصناف وقطع اللحوم للاعتماد" : "أصناف الخرفان للاعتماد"}</dd></div><div><dt>الوزن والسعر</dt><dd>يُؤكدان حسب الاختيار</dd></div><div><dt>تفاصيل الطلب</dt><dd>نراجعها معك عند التواصل</dd></div></dl>;
}

export function LivingFarmHome() {
  const root = useRef<HTMLDivElement>(null);
  const inquiry = useRef<HTMLDialogElement>(null);
  const { count, add, cart } = useCart();
  const [market, setMarket] = useState<"agri" | "meat">("agri");
  const [productId, setProductId] = useState("tomatoes");
  const [quantity, setQuantity] = useState(1);
  const [eidType, setEidType] = useState<"sheep" | "meat">("sheep");
  const [bundle, setBundle] = useState<BundleType>("restaurants");
  const [bulkKg, setBulkKg] = useState(String(settings.minimumBulkKg));
  const [bulkCategories, setBulkCategories] = useState(["الزراعي"]);
  const [bulkError, setBulkError] = useState("");
  const [inquiryType, setInquiryType] = useState<"bulk" | "eid">("bulk");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const selected = products.find(product => product.id === productId) ?? products[0];
  const available = (market === "agri" ? retailIds : meatIds).flatMap(id => {
    const product = products.find(item => item.id === id);
    return product ? [product] : [];
  });
  const bundleLabel = bundleTypes.find(item => item.id === bundle)?.label ?? "جملة";
  const allowedQuantity = Math.max(0, MAX_QUANTITY - (cart[selected.id] ?? 0));

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 6500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const sections = root.current?.querySelectorAll<HTMLElement>(".farm-animated-scene");
      sections?.forEach(section => {
        const image = section.querySelector(".farm-scene-image");
        if (image) gsap.fromTo(image, { yPercent: -2 }, { yPercent: 2, ease: "none", scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: .8 } });
      });
      const steps = root.current?.querySelector(".farm-order-steps");
      if (steps) gsap.fromTo(steps, { "--farm-route": 0 }, { "--farm-route": 1, ease: "none", scrollTrigger: { trigger: steps, start: "top 85%", end: "bottom 55%", scrub: .6 } });
    }, root);
    return () => media.revert();
  }, []);

  function selectMarket(value: "agri" | "meat") {
    setMarket(value); setProductId(value === "agri" ? "tomatoes" : "beef"); setQuantity(1);
  }
  function addSelected() {
    if (quantity > allowedQuantity || !add(selected.id, quantity)) { setNotice("وصلت إلى حد كمية المعاينة لهذا الصنف. راجع السلة لتعديل الكمية."); return; }
    setNotice(`أضفنا ${displayPrice(quantity)} من ${selected.name} إلى سلة المعاينة.`);
  }
  function showBulk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const weight = Number(bulkKg);
    if (!Number.isInteger(weight) || weight < settings.minimumBulkKg || weight > 10000) { setBulkError(`أدخل كمية من ${displayPrice(settings.minimumBulkKg)} إلى ١٠٬٠٠٠ كجم.`); return; }
    if (!bulkCategories.length) { setBulkError("اختر نوعًا واحدًا على الأقل من المنتجات."); return; }
    setBulkError(""); setCopied(false); setInquiryType("bulk"); inquiry.current?.showModal();
  }
  const inquirySummary = inquiryType === "bulk" ? `استفسار ${bundleLabel} — ${bulkCategories.join("، ")} — ${bulkKg} كجم` : `استفسار عن تشكيلة العيد — ${eidType === "sheep" ? "خرفان" : "لحوم"}`;
  async function copyInquiry() {
    try { await navigator.clipboard.writeText(`${inquirySummary}\nمزارع آل ياسر — ${settings.phone}`); setCopied(true); }
    catch { setNotice("يمكنك تحديد ملخص الاستفسار ونسخه، أو الاتصال بنا مباشرة."); }
  }

  return <div ref={root} className="farm-experience-home">
    <section className="farm-market" id="categories" aria-labelledby="market-title">
      <div className="frame"><SectionTitle id="market-title">سوق الخير المتكامل</SectionTitle>
        <div className="farm-market-tabs" role="group" aria-label="اختر قسم السوق"><button type="button" aria-pressed={market === "agri"} onClick={() => selectMarket("agri")}><Sprout size={22} aria-hidden="true" />الزراعي</button><button type="button" aria-pressed={market === "meat"} onClick={() => selectMarket("meat")}><ShoppingBasket size={22} aria-hidden="true" />اللحوم والخرفان</button><a href="#wholesale"><Package size={22} aria-hidden="true" />الجملة</a></div>
      </div>
      <div className={`farm-market-stage farm-animated-scene ${productId !== "tomatoes" ? "has-alternate-product" : ""}`} id="products">
        <SceneImage name="living-market" alt="تكوين توضيحي مولّد للطماطم والخيار وسط نخيل مصري، وليس تصويرًا لمنتجات المزارع" />
        {productId !== "tomatoes" && <div className={`farm-alternate-photo ${productCutouts.has(productId) ? "is-cutout" : ""}`} key={productId}><Image src={productPhoto(selected.id, selected.image)} alt={`صورة تمثيلية: ${selected.name}`} fill sizes="(max-width: 700px) 45vw, 46vw" quality={85} /></div>}
        <div className="frame farm-market-layout"><div className="farm-product-copy" key={selected.id}>
          <p className="farm-overline"><Leaf size={22} aria-hidden="true" />{market === "agri" ? "خيرات لمائدتك" : "اختيارات للَمّة البيت"}</p>
          <p className="farm-small-note">صور وأسعار توضيحية لحين اعتماد التشكيلة.</p>
          <span className="farm-demo-label">كتالوج تجريبي</span>
          <h3>{selected.name}</h3><p className="farm-product-description">{selected.description}</p>
          <div className="farm-product-price"><strong><bdi>{displayPrice(selected.price)}</bdi><small>ج.م</small></strong><span>سعر توضيحي · {selected.unit}</span></div>
          <div className="farm-purchase-row"><div className="farm-quantity" role="group" aria-label={`كمية ${selected.name}`}><button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} aria-label="تقليل الكمية"><Minus size={18} aria-hidden="true" /></button><output aria-live="polite">{displayPrice(quantity)}</output><button type="button" onClick={() => setQuantity(Math.min(MAX_QUANTITY, quantity + 1))} disabled={quantity >= MAX_QUANTITY} aria-label="زيادة الكمية"><Plus size={18} aria-hidden="true" /></button></div><button className="farm-button farm-button-sun" type="button" onClick={addSelected}><ShoppingCart size={21} aria-hidden="true" />أضف للسلة<ArrowLeft size={18} aria-hidden="true" /></button></div>
          {market === "meat" && <a className="farm-text-link" href="#eid">اكتشف تشكيلة الخرفان والعيد<ArrowUpLeft size={18} aria-hidden="true" /></a>}
        </div></div>
      </div>
      <div className="frame farm-product-rail" role="group" aria-label="اختيارات المنتجات">{available.map(product => <button type="button" key={product.id} aria-pressed={product.id === productId} onClick={() => { setProductId(product.id); setQuantity(1); }}><span className={`farm-rail-photo ${productCutouts.has(product.id) ? "is-cutout" : ""}`}><Image src={productPhoto(product.id, product.image)} alt="" fill sizes="110px" /></span><span>{product.name}</span></button>)}<Link className="farm-all-products" href="/shop">كل الخيرات<ArrowLeft size={20} aria-hidden="true" /></Link></div>
    </section>

    <div className="farm-wave-divider" aria-hidden="true"><Image src="/media/living-wave.webp" alt="" fill sizes="100vw" /></div>
    <section className="farm-eid farm-animated-scene" id="eid" aria-labelledby="eid-title" data-selection={eidType}>
      <SceneImage name="living-eid" alt="خروف وحمل في مشهد ريفي توضيحي مولّد، لا يمثلان ماشية فعلية معروضة للبيع" />
      {eidType === "meat" && <div className="farm-eid-meat-art"><Image src="/media/beef.jpg" alt="صورة لحوم تمثيلية مرخصة، وليست المنتج الفعلي" fill sizes="(max-width: 700px) 100vw, 50vw" /></div>}
      <div className="frame farm-scene-layout"><div className="farm-eid-copy"><div className="farm-eid-intro" data-reveal="type"><p className="farm-overline"><Wheat size={22} aria-hidden="true" />العيد والأضحية</p><h2 id="eid-title">خير العيد<br />ولَمّة البيت.</h2><p>{eidType === "sheep" ? "خرفان العيد، وتفاصيل نختارها معك." : "اختيارات اللحوم، على مقاس لَمّتكم."}</p></div>
        <div className="farm-eid-tabs" role="group" aria-label="تشكيلة العيد"><button type="button" aria-pressed={eidType === "sheep"} onClick={() => setEidType("sheep")}>خرفان</button><button type="button" aria-pressed={eidType === "meat"} onClick={() => setEidType("meat")}>لحوم</button></div>
        <div className="farm-eid-desktop-details"><EidDetails meat={eidType === "meat"} /></div><details className="farm-eid-mobile-details"><summary>التشكيلة والوزن والسعر<ChevronDown size={18} aria-hidden="true" /></summary><EidDetails meat={eidType === "meat"} /></details>
        <button className="farm-button farm-button-sun" type="button" onClick={() => { setInquiryType("eid"); setCopied(false); inquiry.current?.showModal(); }}>استفسر عن التشكيلة<ArrowLeft size={20} aria-hidden="true" /></button><p className="farm-section-disclosure">معاينة موسمية توضيحية؛ لا تمثل عرض بيع أو حجزًا ساريًا.</p>
      </div></div>
    </section>

    <section className="farm-wholesale farm-animated-scene" id="wholesale" aria-labelledby="bulk-title">
      <SceneImage name="living-wholesale" alt="تكوين توضيحي مولّد لخضروات ولحوم وألبان، وليس صورة لباقات فعلية" />
      <div className="frame farm-scene-layout"><div className="farm-bulk-copy"><div data-reveal="type"><p className="farm-overline"><Package size={24} aria-hidden="true" />الجملة وباقاتك</p><h2 id="bulk-title">للمطاعم<br />{" "}والمناسبات.</h2><p>كوّن تشكيلة تناسب احتياجك، وراجع تفاصيلها معنا.</p></div>
        <div className="farm-bundle-tabs" role="group" aria-label="نوع الباقة">{bundleTypes.map(item => <button key={item.id} type="button" aria-pressed={bundle === item.id} onClick={() => setBundle(item.id)}><item.icon size={20} aria-hidden="true" />{item.label}</button>)}</div>
        <form className="farm-bulk-form" onSubmit={showBulk} noValidate><fieldset><legend>نوع المنتجات</legend><div className="farm-bulk-choices">{["الزراعي", "اللحوم", "الألبان"].map(label => <label key={label}><input type="checkbox" checked={bulkCategories.includes(label)} onChange={event => setBulkCategories(current => event.target.checked ? [...current, label] : current.filter(item => item !== label))} /><span>{label}</span></label>)}</div></fieldset>
          <label className="farm-bulk-weight" htmlFor="bulk-weight"><span>الكمية بالكيلو جرام</span><input id="bulk-weight" type="number" min={settings.minimumBulkKg} max={10000} step="1" value={bulkKg} onChange={event => { setBulkKg(event.target.value); setBulkError(""); }} aria-describedby={`bulk-minimum${bulkError ? " bulk-error" : ""}`} aria-invalid={!!bulkError} inputMode="numeric" /></label>
          <p id="bulk-minimum" className="farm-bulk-minimum"><Package size={18} aria-hidden="true" />حد أدنى {displayPrice(settings.minimumBulkKg)} كجم للجملة والمطاعم والمناسبات فقط.</p>
          {bulkError && <p className="farm-form-error" id="bulk-error" role="alert">{bulkError}</p>}
          <div className="farm-bulk-actions"><button className="farm-button" type="submit">جهّز طلب الباقة<ArrowLeft size={19} aria-hidden="true" /></button><a href={settings.phoneHref} className="farm-call-link"><Phone size={18} aria-hidden="true" />اتصل للاستفسار</a></div><p className="farm-small-note">تجهيز استفسار فقط. تفاصيل الباقات والأسعار تُعتمد لاحقًا.</p>
        </form>
      </div></div>
    </section>

    <section className="farm-about" id="about" aria-labelledby="about-title"><div className="frame farm-about-layout"><div className="farm-about-copy" data-reveal="type"><p className="farm-overline"><Sprout size={24} aria-hidden="true" />من نحن</p><h2 id="about-title">مزارع آل ياسر.<br /><span>الخير له أصل.</span></h2><p>خيرات متنوعة، ومائدة تتّسع للجميع. تجمع هذه التجربة المنتجات الزراعية واللحوم والدواجن والألبان ومنتجات المزرعة في مكان واحد.</p><p>نصنع مساحة للاختيار على مهل؛ تعرف المنتج، وتحدد ما يناسبك، وتراجع التفاصيل قبل تأكيد الطلب.</p><a href="#categories" className="farm-text-link">اكتشف عالم الخيرات<ArrowUpLeft size={20} aria-hidden="true" /></a></div><figure className="farm-about-picture" data-reveal="picture"><Image src="/media/living-about.webp" alt="مشهد ريفي مصري توضيحي مولّد، وليس تصويرًا للمزرعة" fill sizes="(max-width: 700px) 90vw, 48vw" quality={85} /><figcaption>روح المكان · مشهد توضيحي</figcaption></figure></div></section>

    <section className="farm-order" id="delivery" aria-labelledby="order-title"><div className="frame"><SectionTitle id="order-title">كيف تطلب؟</SectionTitle><p className="farm-order-intro" data-reveal>من أول اختيار، لحد مراجعة التفاصيل.<br />خطوات واضحة، وطلب على مقاس احتياجك.</p><ol className="farm-order-steps">{orderSteps.map((step, index) => <li key={step.title} data-reveal><span className="farm-order-icon"><step.icon size={28} strokeWidth={1.5} aria-hidden="true" /></span><span className="farm-step-number">{["٠١", "٠٢", "٠٣"][index]}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
      <div className="farm-delivery-info"><div><Truck size={30} strokeWidth={1.4} aria-hidden="true" /><h3>والتوصيل؟</h3><p>تُعتمد مناطق الخدمة والمواعيد والرسوم قبل إطلاق الطلبات. تواصل معنا للاستفسار عن منطقتك.</p><a href={settings.phoneHref} className="farm-text-link">اسأل عن التوصيل<ArrowUpLeft size={18} aria-hidden="true" /></a></div><div className="farm-faq"><details><summary>المنتجات والكميات<ChevronDown size={18} aria-hidden="true" /></summary><p>اختر الكمية من كل منتج على حدة. الأصناف والأسعار المعروضة في هذه النسخة بيانات توضيحية لحين اعتماد الكتالوج.</p></details><details><summary>باقات الجملة والمطاعم والمناسبات<ChevronDown size={18} aria-hidden="true" /></summary><p>الحد الأدنى المبدئي {displayPrice(settings.minimumBulkKg)} كجم لهذا المسار فقط. جهّز نوع الباقة والمنتجات والكمية، ثم تواصل لتأكيد التفاصيل.</p></details><details><summary>هل تم تأكيد طلبي؟<ChevronDown size={18} aria-hidden="true" /></summary><p>السلة وتجهيز الاستفسار للمعاينة محليًا. لا يُرسل طلب فعلي ولا تتم عملية دفع؛ التأكيد يحتاج تواصلًا واعتماد تفاصيل الخدمة.</p></details></div></div>
    </div></section>

    <section className="farm-contact" id="contact" aria-labelledby="contact-title"><div className="frame farm-contact-layout"><div className="farm-contact-copy" data-reveal="type"><p className="farm-overline"><Phone size={23} aria-hidden="true" />للاستفسار وطلباتكم</p><h2 id="contact-title">نبقى على تواصل.</h2><p>سؤال عن منتج، تشكيلة العيد، أو باقة تناسبك؟<br />يسعدنا نراجع معك التفاصيل.</p><a href={settings.phoneHref} className="farm-phone"><bdi dir="ltr">{settings.phone}</bdi><span><Phone size={21} aria-hidden="true" />اتصل بنا</span></a><p className="farm-international"><bdi dir="ltr">{settings.internationalPhone}</bdi></p></div><div className="farm-map-module" data-reveal="picture"><div className="farm-map-art"><Image src="/media/living-location.webp" alt="رسم توضيحي لحقول وطريق، وليس خريطة فعلية لموقع المزرعة" fill sizes="(max-width: 700px) 90vw, 45vw" quality={80} /><span><MapPin size={18} aria-hidden="true" />موقع المزرعة</span></div><a href={settings.demoMapUrl} target="_blank" rel="noreferrer" className="farm-map-link">افتح Google Maps<ArrowUpLeft size={20} aria-hidden="true" /></a><p>خريطة ورابط تجريبيان · يُحدّثان لاحقًا</p></div></div></section>

    <div className="farm-mobile-navigation"><a href="#home" aria-label="العودة إلى الرئيسية"><Sprout size={22} aria-hidden="true" /><span>الرئيسية</span></a><a href="#categories"><Leaf size={22} aria-hidden="true" /><span>الأقسام</span></a><Link href="/cart" aria-label={`السلة، ${displayPrice(count)} منتجات`}><span className="farm-mobile-cart-icon"><ShoppingBasket size={23} aria-hidden="true" />{count > 0 && <b aria-hidden="true">{displayPrice(count)}</b>}</span><span>السلة</span></Link></div>
    <div className="farm-live-notice" role="status" aria-live="polite">{notice && <div><Check size={19} aria-hidden="true" /><span>{notice}</span><button type="button" aria-label="إغلاق التنبيه" onClick={() => setNotice("")}><X size={18} aria-hidden="true" /></button></div>}</div>
    <dialog ref={inquiry} className="modal farm-inquiry" aria-labelledby="inquiry-title" onClick={event => { if (event.currentTarget === event.target) inquiry.current?.close(); }}><div className="modal-inner"><div className="modal-heading"><h2 id="inquiry-title">{inquiryType === "bulk" ? "تفاصيل استفسار الباقة" : "استفسار العيد والأضحية"}</h2><button className="icon-button" type="button" aria-label="إغلاق" onClick={() => inquiry.current?.close()}><X aria-hidden="true" /></button></div><p className="farm-inquiry-summary">{inquirySummary}</p><p>هذه مراجعة للاستفسار فقط. لم يُرسل طلب، ولم يُعتمد سعر أو حجز.</p><div className="farm-inquiry-actions"><a className="farm-button" href={settings.phoneHref}><Phone size={19} aria-hidden="true" />اتصل لتأكيد التفاصيل</a><button type="button" className="farm-call-link" onClick={copyInquiry}><Copy size={18} aria-hidden="true" />{copied ? "نُسخ الملخص" : "انسخ الملخص"}</button></div></div></dialog>
  </div>;
}


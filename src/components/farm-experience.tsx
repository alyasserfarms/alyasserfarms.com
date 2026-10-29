"use client";

import { ArrowUpLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { categories } from "@/data/content";
import { Photo } from "./ui";

export function LivingCategories({ category, onSelect }: { category: string; onSelect: (id: string) => void }) {
  return <section className="living-categories" id="categories" aria-labelledby="categories-title">
    <div className="frame">
      <div className="living-section-title" data-reveal="type"><div><p className="harvest-eyebrow">خيرات تتنوع، وأصل يجمعها</p><h2 id="categories-title">لكل مائدة،<br /><span className="harvest-accent">باب من الخير.</span></h2></div><p>من ألوان الحقل إلى أساسيات المائدة.<br />اختر ما تحب، ودع الباقي يلهمك.</p></div>
      <div className="harvest-category-grid">{categories.map((item, index) => <Link href="#products" key={item.id} className={`harvest-category ${category === item.id ? "is-selected" : ""}`} onClick={() => onSelect(item.id)} aria-current={category === item.id ? "true" : undefined} data-reveal="picture" style={{ "--item-delay": `${index % 3 * 70}ms` } as React.CSSProperties}><div className="harvest-category-photo"><Photo name={item.image} alt={`صورة تمثيلية لفئة ${item.name}`} sizes="(max-width: 600px) 44vw, 30vw" /><span className="harvest-category-arrow"><ArrowUpLeft size={23} aria-hidden="true" /></span></div><div className="harvest-category-label"><h3>{item.name}</h3><p>{item.detail}</p></div></Link>)}</div>
      <p className="harvest-category-note">صور تمثيلية للتشكيلة المقترحة. الكتالوج النهائي قيد الاعتماد.</p>
    </div>
  </section>;
}

export function HarvestStory() {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      if (media.matches) { section.style.setProperty("--story-progress", "0"); return; }
      const rect = section.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > innerHeight) return;
      const travel = Math.max(1, rect.height - innerHeight * .65);
      const progress = Math.min(1, Math.max(0, (innerHeight * .2 - rect.top) / travel));
      section.style.setProperty("--story-progress", progress.toFixed(3));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); media.removeEventListener("change", schedule); };
  }, []);
  return <section ref={ref} className="origin-scene" id="story" aria-labelledby="story-title"><div className="origin-stage"><Photo name="egypt-fields" alt="حقول مصرية، صورة مرخصة تمثيلية وليست من مزارع العميل" className="origin-land" sizes="100vw" /><Photo name="vegetables" alt="ألوان الخضروات، صورة تمثيلية مرخصة" className="origin-harvest" sizes="100vw" /><div className="origin-shade" /><div className="origin-words frame"><p className="harvest-eyebrow">حكاية تبدأ من الأرض</p><h2 id="story-title">من أرضنا<br /><span>إلى مائدتك.</span></h2><p>للأرض إيقاعها. وللمائدة حكاياتها.<br />وبينهما، خير نحب أن يجمعنا.</p><Link href="/shop" className="button button-sun">اكتشف خيرات المائدة<ArrowUpLeft size={22} aria-hidden="true" /></Link></div><p className="origin-credit">مشاهد تمثيلية مرخصة.</p></div></section>;
}

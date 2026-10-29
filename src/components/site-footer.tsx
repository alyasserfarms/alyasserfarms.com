import Link from "next/link";
import { ArrowUpLeft, ArrowUp, Phone, Sprout } from "lucide-react";
import { BrandName } from "./ui";
import { brand, navigation } from "@/data/content";
import credits from "../../public/media/credits.json";
import { commerceSettings } from "@/data/commerce-settings";

export function FarmFooter({ logo }: { logo: string | null }) {
  return <footer className="site-footer farm-footer" id="site-footer">
    <div className="frame">
      <div className="farm-footer-opening"><div><Sprout size={24} aria-hidden="true" /><span>من أرضنا، تبدأ الحكاية</span></div><a href="#home" className="farm-back-top" aria-label="العودة إلى بداية الصفحة"><ArrowUp size={19} aria-hidden="true" /></a></div>
      <div className="farm-footer-grid">
        <div className="farm-footer-brand"><BrandName logo={logo} footer /><div><p className="farm-footer-tagline">{brand.tagline}</p><p>خيرات الأرض المصرية،<br />ومائدة تجمعنا على الخير.</p><span lang="en" dir="ltr">AL Yasser Farms</span></div></div>
        <nav aria-label="تسوق من المزرعة"><h2>سوق الخير</h2><Link href="/#categories">منتجات المزرعة</Link><Link href="/#eid">العيد والأضحية</Link><Link href="/#wholesale">الجملة والباقات</Link><Link href="/shop">تصفّح المتجر<ArrowUpLeft size={16} aria-hidden="true" /></Link></nav>
        <nav aria-label="دليلك للمزارع"><h2>أقرب لك</h2><Link href="/#about">من نحن</Link><Link href="/#delivery">كيف تطلب والتوصيل</Link><Link href="/#contact">موقع المزرعة</Link><a href={commerceSettings.phoneHref}>تواصل معنا</a></nav>
        <div className="farm-footer-reach"><span>نتكلم في طلبك؟</span><a href={commerceSettings.phoneHref}><Phone size={22} aria-hidden="true" /><bdi>010 9629 9171</bdi></a><p>للأفراد والمطاعم والمناسبات</p><Link href="/#wholesale">جهّز باقتك<ArrowUpLeft size={18} aria-hidden="true" /></Link></div>
      </div>
      <div className="footer-bottom"><p>© {new Date().getFullYear()} {brand.name}</p><span>معاينة تصميم · البيع غير مفعّل</span></div>
      <details className="media-credits"><summary>عن الصور والمحتوى التجريبي</summary><p>مشاهد السوق والخرفان والباقات وقصة المكان مولّدة بصريًا لهذه المعاينة؛ لا تمثل تصويرًا لمزارع آل ياسر أو منتجاتها أو ماشيتها الفعلية. صور الأصناف الأخرى والفيديو تمثيلية مرخصة. الأسعار والتشكيلات والخريطة توضيحية، ويُعتمد المحتوى قبل البيع.</p><ul>{credits.map(credit => <li key={credit.file}><a href={credit.source} target="_blank" rel="noreferrer">{credit.title}</a>، {credit.creator} · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a></li>)}</ul></details>
    </div>
  </footer>;
}

export function SiteFooter({ logo, creative = false }: { logo: string | null; creative?: boolean }) {
  return <footer className={`site-footer ${creative ? "living-footer" : ""}`} id="contact"><div className="frame"><div className="footer-top"><div><BrandName logo={logo} footer /><p>{brand.tagline}</p></div><nav aria-label="روابط التذييل">{navigation.slice(1).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}<Link href="/delivery">الطلب والتوصيل</Link></nav><div className="footer-contact"><h2>نبقى على تواصل</h2><p>تُضاف قنوات التواصل المعتمدة قريبًا.</p><Link href="/" className="text-link">إلى بداية الحكاية<ArrowUpLeft size={18} aria-hidden="true" /></Link></div></div><p className="footer-wordmark" aria-hidden="true">الخير له أصل</p><div className="footer-bottom"><p>© {new Date().getFullYear()} {brand.name}</p><span lang="en" dir="ltr">AL Yasser Farms</span><span>معاينة المتجر</span></div><details className="media-credits"><summary>عن المحتوى التجريبي ومصادر الصور</summary><p>هذه معاينة تصميم. الصور والفيديوهات تمثيلية مرخصة، والمنتجات والأسعار بيانات عرض تحتاج اعتمادًا. لا تمثل الصور منتجات المزارع الفعلية.</p><ul>{credits.map((credit) => <li key={credit.file}><a href={credit.source} target="_blank" rel="noreferrer">{credit.title}</a>، {credit.creator} · <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a></li>)}</ul></details></div></footer>;
}

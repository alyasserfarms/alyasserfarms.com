import Link from "next/link";
import { ArrowUpLeft, ArrowUp } from "lucide-react";
import { BrandName } from "./ui";
import { brand, navigation } from "@/data/content";
import { commerceSettings } from "@/data/commerce-settings";

export function FarmFooter({ logo }: { logo: string | null }) {
  return <footer className="site-footer farm-footer" id="site-footer">
    <div className="frame">
      <div className="farm-footer-compact">
        <div className="farm-footer-signature"><BrandName logo={logo} footer /><p>{brand.tagline}</p></div>
        <nav aria-label="روابط التذييل"><Link href="/shop">المتجر</Link><Link href="/#about">من نحن</Link><Link href="/#delivery">الطلب والتوصيل</Link></nav>
        <a href="#home" className="farm-back-top" aria-label="العودة إلى بداية الصفحة"><ArrowUp size={19} aria-hidden="true" /></a>
      </div>
      <div className="footer-bottom"><p>© {new Date().getFullYear()} {brand.name}</p></div>
      
    </div>
  </footer>;
}

export function SiteFooter({ logo, creative = false }: { logo: string | null; creative?: boolean }) {
  return <footer className={`site-footer ${creative ? "living-footer" : ""}`} id="contact"><div className="frame"><div className="footer-top"><div><BrandName logo={logo} footer /><p>{brand.tagline}</p></div><nav aria-label="روابط التذييل">{navigation.slice(1).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}<Link href="/delivery">الطلب والتوصيل</Link></nav><div className="footer-contact"><h2>نبقى على تواصل</h2><a href={commerceSettings.phoneHref} dir="ltr">{commerceSettings.phone}</a><Link href="/" className="text-link">إلى بداية الحكاية<ArrowUpLeft size={18} aria-hidden="true" /></Link></div></div><p className="footer-wordmark" aria-hidden="true">الخير له أصل</p><div className="footer-bottom"><p>© {new Date().getFullYear()} {brand.name}</p><span lang="en" dir="ltr">AL Yasser Farms</span><span>معاينة المتجر</span></div></div></footer>;
}



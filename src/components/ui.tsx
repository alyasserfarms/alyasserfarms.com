import { ArrowUpLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function ArrowLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return <Link className={`arrow-link ${className}`} href={href}>{children}<ArrowUpLeft size={20} aria-hidden="true" /></Link>;
}

export function SectionHeading({ children, text, action }: { children: ReactNode; text?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><h2>{children}</h2>{text && <p>{text}</p>}</div>{action}</div>;
}

export function Photo({ name, alt, className = "", sizes = "(max-width: 700px) 100vw, 50vw", priority = false }: { name: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  return <div className={`photo ${className}`}><Image src={`/media/${name}.jpg`} alt={alt} fill sizes={sizes} priority={priority} quality={80} /></div>;
}

export function BrandName({ logo, footer = false }: { logo: string | null; footer?: boolean }) {
  return <Link href="/" className={`brand-name ${footer ? "brand-name-footer" : ""}`} aria-label="مزارع آل ياسر، الرئيسية">{logo ? <Image src={logo} alt="مزارع آل ياسر" width={footer ? 128 : 88} height={footer ? 128 : 88} sizes={footer ? "128px" : "(max-width: 800px) 66px, 88px"} priority={!footer} /> : <span>مزارع آل ياسر</span>}</Link>;
}

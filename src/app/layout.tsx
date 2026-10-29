import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./living.css";
import "./reference-hero.css";
import "./harvest-home.css";
import "./living-farm.css";
import "./farm-shell.css";

const arabic = localFont({
  src: [
    { path: "../assets/fonts/cairo-arabic-wght-normal.woff2", weight: "400 800", style: "normal" },
    { path: "../assets/fonts/cairo-latin-wght-normal.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "مزارع آل ياسر | الخير له أصل",
  description: "مزارع آل ياسر، اكتشف عالمًا من اللحوم والدواجن والخضروات والفواكه والألبان ومنتجات المزرعة. معاينة تجربة المتجر.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" className={arabic.variable}><body><a className="skip-link" href="#main">تجاوز إلى المحتوى</a>{children}</body></html>;
}

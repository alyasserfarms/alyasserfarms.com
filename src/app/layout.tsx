import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./living.css";
import "./reference-hero.css";
import "./harvest-home.css";
import "./living-farm.css";
import "./farm-shell.css";
import "./admin.css";
import "./planning-lab.css";
import { FarmProvider } from "@/components/farm-provider";
import { publicFarm } from "@/lib/farm-repository";
import { VisitRecorder } from "@/components/visit-recorder";

const arabic = localFont({
  src: [
    { path: "../assets/fonts/cairo-arabic-wght-normal.woff2", weight: "400 800", style: "normal" },
    { path: "../assets/fonts/cairo-latin-wght-normal.woff2", weight: "400 800", style: "normal" },
  ],
  variable: "--font-arabic",
  display: "swap",
});

const siteUrl = "https://alyasserfarms.com";

export const viewport: Viewport = {
  themeColor: "#213626",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "مزارع آل ياسر | الخير له أصل — منتجات عضوية وطازجة",
    template: "%s | مزارع آل ياسر",
  },
  description:
    "مزارع آل ياسر — متجر زراعي متكامل يقدم أجود أنواع اللحوم الطازجة، الدواجن، الخضروات، الفواكه الموسمية، الألبان ومنتجات المزرعة الطبيعية من أرضنا لمائدتكم مباشرة.",
  keywords: [
    "مزارع آل ياسر",
    "الخير له أصل",
    "لحوم طازجة",
    "دواجن مزارع",
    "خضروات عضوية",
    "فواكه موسمية",
    "ألبان طازجة",
    "أضاحي العيد",
    "تمور فاخرة",
    "متجر مزارع آل ياسر",
    "AL Yasser Farms",
  ],
  authors: [{ name: "مزارع آل ياسر", url: siteUrl }],
  creator: "مزارع آل ياسر",
  publisher: "مزارع آل ياسر",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: siteUrl,
    title: "مزارع آل ياسر | الخير له أصل",
    description: "أجود اللحوم والدواجن والخضار والفواكه والألبان الطازجة مباشرة من المزرعة لمائدتكم.",
    siteName: "مزارع آل ياسر | AL Yasser Farms",
    images: [
      {
        url: "/brand-optimized/02_أغلفة_التواصل_الاجتماعي/06_غلاف_فيسبوك.webp",
        width: 1200,
        height: 630,
        alt: "مزارع آل ياسر — الخير له أصل",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "مزارع آل ياسر | الخير له أصل",
    description: "أجود اللحوم والدواجن والخضار والفواكه والألبان الطازجة مباشرة من المزرعة لمائدتكم.",
    images: ["/brand-optimized/02_أغلفة_التواصل_الاجتماعي/06_غلاف_فيسبوك.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "مزارع آل ياسر",
      alternateName: "AL Yasser Farms",
      url: siteUrl,
      logo: `${siteUrl}/brand-optimized/01_شعارات_وأيقونات/01_الشعار_الأساسي_شفاف.webp`,
      slogan: "الخير له أصل",
      description: "مزارع آل ياسر لإنتاج وتوزيع اللحوم والدواجن والخضروات والفواكه ومنتجات المزرعة الطبيعية.",
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+201096299171",
        contactType: "customer service",
        areaServed: "EG",
        availableLanguage: ["Arabic", "English"],
      },
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "مزارع آل ياسر",
      description: "متجر مزارع آل ياسر لمنتجات المزرعة الطازجة",
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "ar",
      potentialAction: {
        "@type": "SearchAction",
        target: `${siteUrl}/shop?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const farm = await publicFarm();
  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <FarmProvider initial={farm}>
          <VisitRecorder />
          <a className="skip-link" href="#main">
            تجاوز إلى المحتوى
          </a>
          {children}
        </FarmProvider>
      </body>
    </html>
  );
}

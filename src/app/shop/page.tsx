import type { Metadata } from "next";
import { CommerceShell } from "@/components/commerce-shell";
import { ShopView } from "@/components/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "المتجر والمنتجات الطازجة",
  description:
    "تصفح تشكيلة مزارع آل ياسر من اللحوم البلدية، الدواجن الطازجة، الخضروات، الفواكه الموسمية، الألبان، ومنتجات المزرعة الطبيعية. جودة مضمونة وتوصيل حتى باب المنزل.",
  alternates: {
    canonical: "https://alyasserfarms.com/shop",
  },
  openGraph: {
    title: "متجر مزارع آل ياسر | لحوم ودواجن وخضروات طازجة",
    description:
      "تصفح جميع أقسام المنتجات الطازجة واطلب ما تحتاجه لمائدتك مباشرة من المزرعة.",
    url: "https://alyasserfarms.com/shop",
  },
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "all";
  const query = typeof params.q === "string" ? params.q : "";
  return (
    <CommerceShell>
      <ShopView initialCategory={category} initialQuery={query} key={`${category}|${query}`} />
    </CommerceShell>
  );
}

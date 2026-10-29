import type { Metadata } from "next";
import { CommerceShell } from "@/components/commerce-shell";
import { ShopView } from "@/components/commerce";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المتجر | مزارع آل ياسر" };

export default async function ShopPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const category = typeof params.category === "string" ? params.category : "all";
  const query = typeof params.q === "string" ? params.q : "";
  return <CommerceShell><ShopView initialCategory={category} initialQuery={query} key={`${category}|${query}`} /></CommerceShell>;
}

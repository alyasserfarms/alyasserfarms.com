import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommerceShell } from "@/components/commerce-shell";
import { ProductView } from "@/components/commerce";
import { products } from "@/data/content";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((item) => item.id === id);
  return { title: product ? `${product.name} | مزارع آل ياسر` : "المنتج غير موجود | مزارع آل ياسر" };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = products.find((item) => item.id === id);
  if (!product) notFound();
  return <CommerceShell><ProductView product={product} /></CommerceShell>;
}

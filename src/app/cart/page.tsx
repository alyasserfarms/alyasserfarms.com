import type { Metadata } from "next";
import { CommerceShell } from "@/components/commerce-shell";
import { CartView } from "@/components/commerce";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "السلة | مزارع آل ياسر", robots: { index: false, follow: false }, alternates: { canonical: "/cart" } };

export default function CartPage() {
  return <CommerceShell><CartView /></CommerceShell>;
}

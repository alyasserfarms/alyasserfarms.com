import type { Metadata } from "next";
import { CommerceShell } from "@/components/commerce-shell";
import { DeliveryView } from "@/components/commerce";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "التوصيل | مزارع آل ياسر", robots: { index: false, follow: false }, alternates: { canonical: "/delivery" } };

export default function DeliveryPage() {
  return <CommerceShell><DeliveryView /></CommerceShell>;
}

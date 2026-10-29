import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommerceShell } from "@/components/commerce-shell";

export default function NotFound() {
  return <CommerceShell><div className="commerce-page frame"><div className="commerce-empty"><h1>لم نجد هذه الصفحة</h1><p>يمكنك العودة إلى المتجر واكتشاف اختيارات أخرى.</p><Link className="button" href="/shop">العودة للمتجر<ArrowLeft size={18} aria-hidden="true" /></Link></div></div></CommerceShell>;
}

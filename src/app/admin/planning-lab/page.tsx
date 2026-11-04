import { isAdmin } from "@/lib/admin-auth";
import { AdminLogin } from "@/components/admin-panel";
import { PlanningLab } from "@/components/planning-lab";
import { getBrandLogo } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "مختبر تخطيط المزرعة | مزارع آل ياسر", robots: { index: false, follow: false } };

export default async function PlanningLabPage() {
  const logo = await getBrandLogo();
  return await isAdmin() ? <PlanningLab /> : <AdminLogin logo={logo} />;
}

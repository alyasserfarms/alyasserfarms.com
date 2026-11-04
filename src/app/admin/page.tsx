import { isAdmin } from "@/lib/admin-auth";
import { readFarm } from "@/lib/farm-repository";
import { AdminPanel, AdminLogin } from "@/components/admin-panel";
import { getBrandLogo } from "@/lib/brand";
export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة المزرعة | مزارع آل ياسر", robots: { index: false, follow: false } };
export default async function AdminPage() {
  const logo = await getBrandLogo();
  return await isAdmin() ? <AdminPanel initial={await readFarm()} logo={logo} /> : <AdminLogin logo={logo} />;
}

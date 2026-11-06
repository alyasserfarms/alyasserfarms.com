import { getAdminSession } from "@/lib/admin-auth";
import { readFarm } from "@/lib/farm-repository";
import { AdminPanel, AdminLogin } from "@/components/admin-panel";
import { getBrandLogo } from "@/lib/brand";

export const dynamic = "force-dynamic";
export const metadata = { title: "إدارة المزرعة | مزارع آل ياسر", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const [logo, session] = await Promise.all([getBrandLogo(), getAdminSession()]);
  if (!session) return <AdminLogin logo={logo} />;
  const store = await readFarm();
  return <AdminPanel initial={store} logo={logo} currentUser={session} />;
}

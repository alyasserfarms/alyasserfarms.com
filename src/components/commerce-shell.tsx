import type { ReactNode } from "react";
import { getBrandLogo } from "@/lib/brand";
import { SiteFooter } from "./site-footer";
import { Storefront } from "./storefront";

export async function CommerceShell({ children }: { children: ReactNode }) {
  const logo = await getBrandLogo();
  return <><Storefront logo={logo} catalogue={false}>{children}</Storefront><SiteFooter logo={logo} /></>;
}

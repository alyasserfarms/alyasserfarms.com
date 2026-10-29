import { getBrandLogo } from "@/lib/brand";
import { Reveal } from "@/components/reveal";
import { Storefront } from "@/components/storefront";
import { FarmFooter } from "@/components/site-footer";
import { ReferenceHero } from "@/components/reference-hero";
import { LivingFarmHome } from "@/components/living-farm-home";

export const dynamic = "force-dynamic";

export default async function Home() {
  const logo = await getBrandLogo();
  return <>
    <Reveal />
    <Storefront logo={logo} showCatalogue={false}>
      <ReferenceHero />
      <LivingFarmHome />
    </Storefront>
    <FarmFooter logo={logo} />
  </>;
}

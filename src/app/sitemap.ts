import type { MetadataRoute } from "next";
import { publicFarm } from "@/lib/farm-repository";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://alyasserfarms.com";
  // Only canonical pages intended for search results belong here.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl },
    { url: `${baseUrl}/shop` },
  ];

  // Available product pages have their own canonical URLs.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { products } = await publicFarm();
    productRoutes = products.map((product) => ({
      url: `${baseUrl}/products/${product.id}`,
    }));
  } catch (error) {
    console.error("Failed to load products for sitemap:", error);
  }

  return [...staticRoutes, ...productRoutes];
}

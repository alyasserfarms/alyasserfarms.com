import type { MetadataRoute } from "next";
import { publicFarm } from "@/lib/farm-repository";
import { categories } from "@/data/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://alyasserfarms.com";
  const now = new Date();

  // 1. Static Core Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/shop`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/delivery`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.4,
    },
  ];

  // 2. Category filters in Shop
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${baseUrl}/shop?category=${cat.id}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // 3. Dynamic Product Pages from Farm Database
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const { products } = await publicFarm();
    productRoutes = products.map((product) => ({
      url: `${baseUrl}/products/${product.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
    }));
  } catch (error) {
    console.error("Failed to load products for sitemap:", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}

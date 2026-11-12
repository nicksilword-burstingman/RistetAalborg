import type { MetadataRoute } from "next";
import { products } from "@/lib/catalog";
import { guides } from "@/lib/guides";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [
    "",
    "/shop",
    "/stoet",
    ...products.map((p) => `/stoet/${p.slug}`),
    "/om-os",
    "/abonnement",
    "/bryggeguide",
    ...products.map((p) => `/shop/${p.slug}`),
    ...guides.map((g) => `/bryggeguide/${g.slug}`),
  ].map((path) => ({ url: base + path }));
}

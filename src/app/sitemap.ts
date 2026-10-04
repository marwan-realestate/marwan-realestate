import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { listArticles, listAreas, listProperties, listServices, getSettings } from "@/lib/queries";
import { db } from "@/db";
import { pages } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { SYSTEM_ROUTES } from "@/lib/shared";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const base = (settings.canonicalBase || `${proto}://${host}`).replace(/\/$/, "");
  const [properties, articles, areas, services, custom] = await Promise.all([
    listProperties({ publishedOnly: true }),
    listArticles({ publishedOnly: true }),
    listAreas(true),
    listServices(true),
    db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages).where(and(eq(pages.published, true), eq(pages.isSystem, false))),
  ]);
  const staticRoutes = Object.values(SYSTEM_ROUTES).filter((path) => path !== "/404").map((path) => ({ url: `${base}${path}`, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 }));
  return [
    ...staticRoutes,
    ...properties.map((item) => ({ url: `${base}/properties/${item.slug}`, lastModified: item.updatedAt })),
    ...articles.map((item) => ({ url: `${base}/blog/${item.slug}`, lastModified: item.updatedAt })),
    ...areas.map((item) => ({ url: `${base}/areas/${item.slug}` })),
    ...services.map((item) => ({ url: `${base}/services/${item.slug}` })),
    ...custom.map((item) => ({ url: `${base}/p/${item.slug}`, lastModified: item.updatedAt })),
  ];
}

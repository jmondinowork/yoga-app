import type { MetadataRoute } from "next";
import { getContent } from "@/lib/content";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteUrl = await getContent("seo_site_url", "https://www.pranamotion.fr");
  const indexAllowed = await getContent("seo_robots_index", "true");
  const followAllowed = await getContent("seo_robots_follow", "true");

  const rules: MetadataRoute.Robots["rules"] = indexAllowed === "true"
    ? {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/mon-espace/"],
      }
    : {
        userAgent: "*",
        disallow: "/",
      };

  return {
    rules,
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

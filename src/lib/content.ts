import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

/**
 * Get a single content value by key, with an optional fallback.
 * Cached for 120 seconds.
 */
export async function getContent(
  key: string,
  fallback: string = ""
): Promise<string> {
  const cached = unstable_cache(
    async () => {
      const entry = await prisma.siteContent.findUnique({ where: { key } });
      return entry?.value ?? fallback;
    },
    [`cms-content-${key}`],
    { revalidate: 120, tags: ["cms"] }
  );
  return cached();
}

/**
 * Get multiple content values at once (single query).
 * Cached for 120 seconds.
 */
export async function getContents(
  keys: string[]
): Promise<Record<string, string>> {
  const cacheKey = `cms-contents-${keys.sort().join(",")}`;
  const cached = unstable_cache(
    async () => {
      const entries = await prisma.siteContent.findMany({
        where: { key: { in: keys } },
      });
      const map: Record<string, string> = {};
      for (const e of entries) map[e.key] = e.value;
      return map;
    },
    [cacheKey],
    { revalidate: 120, tags: ["cms"] }
  );
  return cached();
}

/**
 * Get ALL content entries (for admin page). Not cached.
 */
export async function getAllContent(): Promise<Record<string, string>> {
  const entries = await prisma.siteContent.findMany();
  const map: Record<string, string> = {};
  for (const e of entries) map[e.key] = e.value;
  return map;
}

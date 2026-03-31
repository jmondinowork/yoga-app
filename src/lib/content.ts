import { prisma } from "@/lib/prisma";

/**
 * Get a single content value by key, with an optional fallback.
 */
export async function getContent(
  key: string,
  fallback: string = ""
): Promise<string> {
  const entry = await prisma.siteContent.findUnique({ where: { key } });
  return entry?.value ?? fallback;
}

/**
 * Get multiple content values at once (single query).
 * Returns a map of key -> value for the keys that exist.
 */
export async function getContents(
  keys: string[]
): Promise<Record<string, string>> {
  const entries = await prisma.siteContent.findMany({
    where: { key: { in: keys } },
  });
  const map: Record<string, string> = {};
  for (const e of entries) map[e.key] = e.value;
  return map;
}

/**
 * Get ALL content entries (for admin page).
 */
export async function getAllContent(): Promise<Record<string, string>> {
  const entries = await prisma.siteContent.findMany();
  const map: Record<string, string> = {};
  for (const e of entries) map[e.key] = e.value;
  return map;
}

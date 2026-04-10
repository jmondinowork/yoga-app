import type { Metadata } from "next";
import { getContents } from "@/lib/content";
import CoursPageClient from "./CoursPageClient";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents(["seo_courses_title", "seo_courses_description", "seo_courses_keywords", "seo_courses_og_title", "seo_courses_og_description"]);
  const title = c["seo_courses_title"] ?? "Tous les cours";
  const description = c["seo_courses_description"] ?? "Parcourez notre catalogue de cours de yoga : Vinyasa, Hatha, Yin, Méditation et plus. Filtrez par niveau, thème et durée.";
  return {
    title,
    description,
    ...(c["seo_courses_keywords"] ? { keywords: c["seo_courses_keywords"].split(",").map((k: string) => k.trim()) } : {}),
    openGraph: { title: c["seo_courses_og_title"] || title, description: c["seo_courses_og_description"] || description },
  };
}

export default async function CoursPage() {
  const c = await getContents(["courses_heading", "courses_description"]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
          {c["courses_heading"] || "Nos Cours"}
        </h1>
        <p className="text-lg text-text max-w-2xl">
          {c["courses_description"] || "Explorez notre catalogue complet de cours de yoga. Filtrez par thème, niveau ou durée pour trouver la séance parfaite."}
        </p>
      </div>

      <CoursPageClient />
    </div>
  );
}

import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/r2";
import { getContents } from "@/lib/content";
import FormationsPageClient from "./FormationsPageClient";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents(["seo_formations_title", "seo_formations_description", "seo_formations_keywords", "seo_formations_og_title", "seo_formations_og_description"]);
  const title = c["seo_formations_title"] ?? "Formations";
  const description = c["seo_formations_description"] ?? "Découvrez nos formations complètes de yoga, des programmes structurés pour progresser étape par étape.";
  return {
    title,
    description,
    ...(c["seo_formations_keywords"] ? { keywords: c["seo_formations_keywords"].split(",").map((k: string) => k.trim()) } : {}),
    openGraph: { title: c["seo_formations_og_title"] || title, description: c["seo_formations_og_description"] || description },
  };
}

export default async function FormationsPage() {
  const formations = await prisma.formation.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      videos: {
        orderBy: { sortOrder: "asc" },
        select: { duration: true },
      },
    },
  });

  const formattedFormations = await Promise.all(
    formations.map(async (f) => {
      let thumbnailUrl: string | null = null;
      if (f.thumbnail && !f.thumbnail.startsWith("http")) {
        try {
          thumbnailUrl = await getPresignedUrl(f.thumbnail, 7200);
        } catch {
          thumbnailUrl = null;
        }
      } else {
        thumbnailUrl = f.thumbnail;
      }

      return {
        slug: f.slug,
        title: f.title,
        description: f.description,
        thumbnail: thumbnailUrl,
        price: f.price,
        videoCount: f.videos.length,
        totalDuration: f.videos.reduce((acc, v) => acc + v.duration, 0),
        hasBooklet: !!f.bookletUrl,
      };
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
          Formations
        </h1>
        <p className="text-lg text-text max-w-2xl">
          Des programmes exclusifs avec vidéos, livret PDF et un accompagnement personnalisé d&apos;un an avec Mathilde Torrez pour progresser étape par étape.
        </p>
      </div>

      <FormationsPageClient formations={formattedFormations} />
    </div>
  );
}

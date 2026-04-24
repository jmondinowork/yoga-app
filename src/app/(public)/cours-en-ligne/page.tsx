import type { Metadata } from "next";
import { getContents } from "@/lib/content";
import CalendrierClient from "./CalendrierClient";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents([
    "seo_calendrier_title",
    "seo_calendrier_description",
  ]);
  return {
    title:
      c["seo_calendrier_title"] ??
      "Cours en ligne — Prana Motion Yoga",
    description:
      c["seo_calendrier_description"] ??
      "Inscrivez-vous à nos séances de yoga en direct sur Zoom avec Mathilde. Consultez le planning et réservez votre place.",
  };
}

export default async function CalendrierPage() {
  const c = await getContents([
    "calendrier_page_heading",
    "calendrier_page_subtitle",
  ]);

  return (
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-heading mb-4">
            {c["calendrier_page_heading"] ?? "Cours en direct"}
          </h1>
          <p className="text-text text-lg max-w-2xl mx-auto">
            {c["calendrier_page_subtitle"] ??
              "Rejoignez Mathilde en direct sur Zoom pour des séances de yoga interactives. Inscrivez-vous et réservez votre place !"}
          </p>
        </div>

        <CalendrierClient />
      </div>
    </section>
  );
}

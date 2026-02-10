import type { Metadata } from "next";
import CoursPageClient from "./CoursPageClient";

export const metadata: Metadata = {
  title: "Tous les cours",
  description: "Parcourez notre catalogue de cours de yoga : Vinyasa, Hatha, Yin, Méditation et plus. Filtrez par niveau, thème et durée.",
};

export default function CoursPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
          Nos Cours
        </h1>
        <p className="text-lg text-text max-w-2xl">
          Explorez notre catalogue complet de cours de yoga. Filtrez par thème,
          niveau ou durée pour trouver la séance parfaite.
        </p>
      </div>

      <CoursPageClient />
    </div>
  );
}

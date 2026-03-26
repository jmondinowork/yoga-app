"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import FormationCard from "@/components/courses/FormationCard";

interface Formation {
  slug: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  price?: number | null;
  videoCount: number;
  totalDuration: number;
  hasBooklet?: boolean;
}

interface FormationsPageClientProps {
  formations: Formation[];
}

export default function FormationsPageClient({ formations }: FormationsPageClientProps) {
  const [search, setSearch] = useState("");

  const filteredFormations = useMemo(() => {
    if (!search) return formations;
    const q = search.toLowerCase();
    return formations.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [formations, search]);

  return (
    <>
      <div className="space-y-4 mb-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une formation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 focus:border-button transition-all"
            />
          </div>
        </div>
      </div>

      {filteredFormations.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🔍</span>
          <h3 className="font-heading text-xl font-semibold text-heading mb-2">
            Aucune formation trouvée
          </h3>
          <p className="text-muted">
            Essayez de modifier votre recherche pour trouver des formations
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted mb-6">
            {filteredFormations.length} formation{filteredFormations.length > 1 ? "s" : ""} trouvée{filteredFormations.length > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredFormations.map((formation) => (
              <FormationCard key={formation.slug} {...formation} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { BookOpen, ArrowRight, Clock, Video, FileText, Search } from "lucide-react";
import Button from "@/components/ui/Button";

export interface FormationCardData {
  id: string;
  slug: string;
  title: string;
  bookletUrl: string | null;
  totalVideos: number;
  completedVideos: number;
  progressPercent: number;
  durationLabel: string;
}

interface Props {
  formations: FormationCardData[];
  otherFormationsCount: number;
}

export default function MesFormationsClient({
  formations,
  otherFormationsCount,
}: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return formations;
    return formations.filter((f) =>
      f.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [formations, search]);

  return (
    <div className="space-y-6">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="w-4 h-4 text-muted absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher une formation..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-card border border-border text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-button/30 focus:border-button transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-muted">Aucune formation trouvée avec cette recherche.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted -mt-2">
            {filtered.length} formation{filtered.length > 1 ? "s" : ""} trouvée
            {filtered.length > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((formation) => (
              <Link
                key={formation.id}
                href={`/formations/${formation.slug}`}
                className="group block"
              >
                <div className="bg-card rounded-2xl border border-border p-5 hover:border-button/30 hover:shadow-md transition-all space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-button" />
                    </div>
                    <h3 className="font-heading font-semibold text-heading group-hover:text-button transition-colors">
                      {formation.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Video className="w-3.5 h-3.5" />
                      {formation.totalVideos} vidéo{formation.totalVideos > 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formation.durationLabel}
                    </span>
                    {formation.bookletUrl && (
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Livret
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted">
                      <span>
                        {formation.completedVideos}/{formation.totalVideos} vidéos complétées
                      </span>
                      <span>{formation.progressPercent}%</span>
                    </div>
                    <div className="h-2 bg-primary/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-button rounded-full transition-all"
                        style={{ width: `${formation.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Découvrir d'autres formations */}
      {otherFormationsCount > 0 && (
        <div className="flex justify-center">
          <Link href="/formations">
            <Button variant="outline">
              Découvrez nos autres formations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

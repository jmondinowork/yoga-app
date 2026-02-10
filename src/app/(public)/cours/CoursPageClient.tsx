"use client";

import { useState, useMemo } from "react";
import CourseCard from "@/components/courses/CourseCard";
import FilterBar, { FilterState } from "@/components/courses/FilterBar";

// Données de démo
const allCourses = [
  { slug: "salutation-au-soleil", title: "Salutation au Soleil — Séance matinale", thumbnail: null, duration: 20, level: "BEGINNER" as const, theme: "Vinyasa", isFree: true, price: null },
  { slug: "yin-yoga-relaxation", title: "Yin Yoga — Relaxation profonde", thumbnail: null, duration: 45, level: "BEGINNER" as const, theme: "Yin Yoga", isFree: false, price: 9.99 },
  { slug: "vinyasa-flow-intermediaire", title: "Vinyasa Flow — Énergie & Force", thumbnail: null, duration: 35, level: "INTERMEDIATE" as const, theme: "Vinyasa", isFree: false, price: null },
  { slug: "meditation-guidee-stress", title: "Méditation guidée — Gestion du stress", thumbnail: null, duration: 15, level: "BEGINNER" as const, theme: "Méditation", isFree: true, price: null },
  { slug: "hatha-yoga-equilibre", title: "Hatha Yoga — Équilibre & Souplesse", thumbnail: null, duration: 40, level: "INTERMEDIATE" as const, theme: "Hatha", isFree: false, price: 12.99 },
  { slug: "yoga-avance-inversions", title: "Inversions — Défie la gravité", thumbnail: null, duration: 50, level: "ADVANCED" as const, theme: "Vinyasa", isFree: false, price: null },
  { slug: "yoga-doux-matin", title: "Yoga doux — Réveil en douceur", thumbnail: null, duration: 25, level: "BEGINNER" as const, theme: "Hatha", isFree: false, price: 7.99 },
  { slug: "power-yoga-core", title: "Power Yoga — Renfort du core", thumbnail: null, duration: 40, level: "ADVANCED" as const, theme: "Power Yoga", isFree: false, price: 14.99 },
  { slug: "meditation-pleine-conscience", title: "Méditation de pleine conscience", thumbnail: null, duration: 20, level: "BEGINNER" as const, theme: "Méditation", isFree: true, price: null },
  { slug: "yin-yoga-hanches", title: "Yin Yoga — Ouverture des hanches", thumbnail: null, duration: 50, level: "INTERMEDIATE" as const, theme: "Yin Yoga", isFree: false, price: 11.99 },
  { slug: "pranayama-respiration", title: "Pranayama — L'art de la respiration", thumbnail: null, duration: 15, level: "BEGINNER" as const, theme: "Respiration", isFree: false, price: 6.99 },
  { slug: "yoga-restauratif-soir", title: "Yoga restauratif — Séance du soir", thumbnail: null, duration: 30, level: "BEGINNER" as const, theme: "Restauratif", isFree: false, price: 8.99 },
];

const themes = [...new Set(allCourses.map((c) => c.theme))].sort();

export default function CoursPageClient() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    theme: "",
    level: "",
    duration: "",
  });

  const filteredCourses = useMemo(() => {
    return allCourses.filter((course) => {
      if (filters.search && !course.title.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.theme && course.theme !== filters.theme) return false;
      if (filters.level && course.level !== filters.level) return false;
      if (filters.duration && course.duration > parseInt(filters.duration)) return false;
      return true;
    });
  }, [filters]);

  return (
    <>
      <FilterBar themes={themes} onFilterChange={setFilters} />

      {filteredCourses.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl block mb-4">🔍</span>
          <h3 className="font-heading text-xl font-semibold text-heading mb-2">
            Aucun cours trouvé
          </h3>
          <p className="text-muted">
            Essayez de modifier vos filtres pour trouver des cours
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted mb-6">
            {filteredCourses.length} cours trouvé{filteredCourses.length > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.slug} {...course} />
            ))}
          </div>
        </>
      )}
    </>
  );
}

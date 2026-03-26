"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import CourseCard from "@/components/courses/CourseCard";
import FilterBar, { FilterState } from "@/components/courses/FilterBar";

interface Course {
  slug: string;
  title: string;
  thumbnail: string | null;
  duration: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  theme: string;
  price: number | null;
  includedInSubscription: boolean;
}

export default function CoursPageClient() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    theme: "",
    level: "",
    duration: "",
  });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (filters.theme) params.set("theme", filters.theme);
      if (filters.level) params.set("level", filters.level);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/courses?${params}`);
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {
      console.error("Erreur lors du chargement des cours");
    } finally {
      setLoading(false);
    }
  }, [filters.theme, filters.level, filters.search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Filtrage durée côté client (l'API ne le supporte pas)
  const filteredCourses = useMemo(() => {
    if (!filters.duration) return courses;
    return courses.filter((c) => c.duration <= parseInt(filters.duration));
  }, [courses, filters.duration]);

  // Extraire les thèmes uniques pour le FilterBar
  const themes = useMemo(() => {
    return [...new Set(courses.map((c) => c.theme))].sort();
  }, [courses]);

  return (
    <>
      <FilterBar themes={themes} onFilterChange={setFilters} />

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-button border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted">Chargement des cours...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
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

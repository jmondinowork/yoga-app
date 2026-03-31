"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import CourseCard from "@/components/courses/CourseCard";
import FilterBar, { FilterState } from "@/components/courses/FilterBar";

interface Course {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  duration: number;
  theme: string;
  price: number | null;
  includedInSubscription: boolean;
}

interface Props {
  courses: Course[];
  progressByCourse: Record<string, number>;
  hasActiveSubscription: boolean;
  otherCoursesCount: number;
}

export default function MesCoursClient({
  courses,
  progressByCourse,
  hasActiveSubscription,
  otherCoursesCount,
}: Props) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    theme: "",
    duration: "",
  });

  const themes = useMemo(
    () => [...new Set(courses.map((c) => c.theme))].sort(),
    [courses]
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      if (
        filters.search &&
        !course.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (filters.theme && course.theme !== filters.theme) return false;
      if (
        filters.duration &&
        course.duration > parseInt(filters.duration)
      )
        return false;
      return true;
    });
  }, [courses, filters]);

  return (
    <div className="space-y-6">
      <FilterBar themes={themes} onFilterChange={setFilters} />

      {filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">🔍</span>
          <p className="text-muted">Aucun cours trouvé avec ces filtres.</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted -mt-2">
            {filteredCourses.length} cours trouvé
            {filteredCourses.length > 1 ? "s" : ""}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                slug={course.slug}
                title={course.title}
                thumbnail={course.thumbnail}
                duration={course.duration}
                theme={course.theme}
                price={course.price}
                includedInSubscription={course.includedInSubscription}
                progress={progressByCourse[course.id]}
              />
            ))}
          </div>
        </>
      )}

      {/* Découvrir d'autres cours */}
      {!hasActiveSubscription && otherCoursesCount > 0 && (
        <div className="flex justify-center">
          <Link href="/cours">
            <Button variant="outline">
              Découvrez nos autres cours
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Upsell abonnement */}
      {!hasActiveSubscription && (
        <div className="bg-linear-to-r from-accent-light/50 to-primary/30 rounded-2xl p-8 text-center space-y-3">
          <Sparkles className="w-10 h-10 text-button mx-auto" />
          <h2 className="font-heading text-xl font-bold text-heading">
            Accédez à tous les cours
          </h2>
          <p className="text-sm text-text max-w-md mx-auto">
            Avec un abonnement, profitez de l&apos;ensemble du catalogue de
            cours vidéo en illimité.
          </p>
          <Link href="/tarifs">
            <Button>
              Voir les abonnements
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

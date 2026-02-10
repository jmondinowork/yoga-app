import type { Metadata } from "next";
import Link from "next/link";
import { Play, BookOpen, ArrowRight, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import CourseCard from "@/components/courses/CourseCard";

export const metadata: Metadata = {
  title: "Mon espace",
};

// Données de démo
const continueWatching = [
  { slug: "salutation-au-soleil", title: "Salutation au Soleil — Séance matinale", thumbnail: null, duration: 20, level: "BEGINNER" as const, theme: "Vinyasa", isFree: true, price: null, progress: 65 },
  { slug: "yin-yoga-relaxation", title: "Yin Yoga — Relaxation profonde", thumbnail: null, duration: 45, level: "BEGINNER" as const, theme: "Yin Yoga", isFree: false, price: 9.99, progress: 30 },
];

const recommended = [
  { slug: "hatha-yoga-equilibre", title: "Hatha Yoga — Équilibre & Souplesse", thumbnail: null, duration: 40, level: "INTERMEDIATE" as const, theme: "Hatha", isFree: false, price: 12.99 },
  { slug: "meditation-guidee-stress", title: "Méditation guidée — Gestion du stress", thumbnail: null, duration: 15, level: "BEGINNER" as const, theme: "Méditation", isFree: true, price: null },
  { slug: "yoga-doux-matin", title: "Yoga doux — Réveil en douceur", thumbnail: null, duration: 25, level: "BEGINNER" as const, theme: "Hatha", isFree: false, price: 7.99 },
];

export default function MonEspacePage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Tableau de bord
        </h1>
        <p className="text-muted">Bienvenue dans votre espace personnel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Play className="w-5 h-5 text-button" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-heading">7</p>
              <p className="text-xs text-muted">Cours suivis</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Clock className="w-5 h-5 text-button" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-heading">3h 45m</p>
              <p className="text-xs text-muted">Temps de pratique</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-button" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-heading">2</p>
              <p className="text-xs text-muted">Formations en cours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription status */}
      <div className="bg-gradient-to-r from-button/10 to-accent-light/30 rounded-2xl border border-button/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="premium">Abonnement mensuel</Badge>
            <Badge variant="success">Actif</Badge>
          </div>
          <p className="text-sm text-text">
            Prochain renouvellement : 9 mars 2026
          </p>
        </div>
        <Link href="/mon-espace/parametres">
          <Button variant="outline" size="sm">
            Gérer
          </Button>
        </Link>
      </div>

      {/* Continue watching */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-heading">
            Reprendre votre pratique
          </h2>
          <Link href="/cours" className="text-sm text-button hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {continueWatching.map((course) => (
            <CourseCard key={course.slug} {...course} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-heading">
            Recommandé pour vous
          </h2>
          <Link href="/cours" className="text-sm text-button hover:underline flex items-center gap-1">
            Voir tout <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recommended.map((course) => (
            <CourseCard key={course.slug} {...course} />
          ))}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, Check, Lock, Play } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Formation",
};

// Données de démo
const formation = {
  title: "Programme Débutant Complet",
  description:
    "Un programme de 4 semaines conçu pour les débutants souhaitant découvrir les bases du yoga. Chaque semaine aborde un thème différent, avec une progression naturelle des postures simples vers des enchaînements plus fluides.\n\nVous apprendrez les fondamentaux de la respiration, les postures debout et au sol, les bases du Vinyasa et comment créer votre propre routine quotidienne.",
  thumbnail: null,
  price: 39.99,
  courseCount: 12,
  totalDuration: 320,
  courses: [
    { title: "Introduction au yoga — Les fondamentaux", duration: 25, completed: false, slug: "intro-yoga-fondamentaux" },
    { title: "Respiration yogique — Pranayama de base", duration: 20, completed: false, slug: "respiration-pranayama-base" },
    { title: "Postures debout — Ancrage et stabilité", duration: 30, completed: false, slug: "postures-debout" },
    { title: "Postures assises — Souplesse du bassin", duration: 25, completed: false, slug: "postures-assises" },
    { title: "Salutation au Soleil — Version débutant", duration: 20, completed: false, slug: "salutation-soleil-debutant" },
    { title: "Équilibre — Trouver son centre", duration: 30, completed: false, slug: "equilibre-centre" },
    { title: "Flow doux — Premier enchaînement", duration: 25, completed: false, slug: "flow-doux-premier" },
    { title: "Postures d'ouverture — Épaules et poitrine", duration: 30, completed: false, slug: "postures-ouverture" },
    { title: "Flexions arrière — En douceur", duration: 25, completed: false, slug: "flexions-arriere" },
    { title: "Inversions douces — Découverte", duration: 20, completed: false, slug: "inversions-douces" },
    { title: "Séance complète — Tout assembler", duration: 35, completed: false, slug: "seance-complete" },
    { title: "Relaxation et méditation finale", duration: 35, completed: false, slug: "relaxation-meditation" },
  ],
};

export default function FormationDetailPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/formations"
        className="inline-flex items-center gap-2 text-muted hover:text-heading transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux formations
      </Link>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Badge variant="premium">Formation</Badge>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-heading">
              {formation.title}
            </h1>
            <div className="flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                {formation.courseCount} cours
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {Math.floor(formation.totalDuration / 60)}h{formation.totalDuration % 60 > 0 ? `${formation.totalDuration % 60}min` : ""}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="font-heading text-2xl font-semibold text-heading mb-4">
              Description
            </h2>
            {formation.description.split("\n\n").map((p, i) => (
              <p key={i} className="text-text leading-relaxed mb-4">
                {p}
              </p>
            ))}
          </div>

          {/* Course list */}
          <div>
            <h2 className="font-heading text-2xl font-semibold text-heading mb-6">
              Programme ({formation.courseCount} cours)
            </h2>
            <div className="space-y-2">
              {formation.courses.map((course, index) => (
                <div
                  key={course.slug}
                  className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-button/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    {course.completed ? (
                      <Check className="w-4 h-4 text-button" />
                    ) : (
                      <span className="text-sm font-medium text-muted">
                        {index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-heading truncate">
                      {course.title}
                    </p>
                  </div>
                  <span className="text-sm text-muted flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {course.duration} min
                  </span>
                  <Lock className="w-4 h-4 text-muted/50 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6 sticky top-24">
            {/* Thumbnail placeholder */}
            <div className="aspect-video bg-gradient-to-br from-button/10 to-primary/40 rounded-xl flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-button/30" />
            </div>

            {formation.price ? (
              <div>
                <p className="text-sm text-muted">Prix de la formation</p>
                <p className="font-heading text-4xl font-bold text-heading">
                  {formation.price} <span className="text-lg text-muted">€</span>
                </p>
              </div>
            ) : (
              <Badge variant="premium" className="text-base px-4 py-1">
                Inclus dans l&apos;abonnement
              </Badge>
            )}

            <Button className="w-full" size="lg">
              {formation.price ? `Acheter — ${formation.price} €` : "S'abonner pour accéder"}
            </Button>

            <div className="text-center">
              <Link href="/tarifs" className="text-sm text-button hover:underline">
                Voir les abonnements
              </Link>
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-xs text-muted">
              <p>✓ {formation.courseCount} cours inclus</p>
              <p>✓ Accès illimité une fois acheté</p>
              <p>✓ Suivi de progression</p>
              <p>✓ Disponible sur tous vos appareils</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

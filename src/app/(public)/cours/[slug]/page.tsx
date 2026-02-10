"use client";

import { useRouter } from "next/navigation";
import { Clock, BarChart3, Tag, ArrowLeft, ShoppingCart } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import VideoPlayer from "@/components/courses/VideoPlayer";
import CourseCard from "@/components/courses/CourseCard";
import Link from "next/link";

// Données de démo
const coursesData: Record<string, {
  title: string;
  description: string;
  thumbnail: string | null;
  videoUrl: string | null;
  duration: number;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  theme: string;
  price: number | null;
  isFree: boolean;
}> = {
  "salutation-au-soleil": {
    title: "Salutation au Soleil — Séance matinale",
    description: "Commencez votre journée en douceur avec cette séance de Salutation au Soleil. Parfaite pour réveiller le corps et l'esprit, cette pratique matinale vous guidera à travers les postures classiques de la Surya Namaskar.\n\nVous apprendrez à synchroniser votre respiration avec chaque mouvement, à développer votre souplesse et à créer une routine matinale bénéfique. Accessible aux débutants, cette séance de 20 minutes est le point de départ idéal.",
    thumbnail: null,
    videoUrl: null,
    duration: 20,
    level: "BEGINNER",
    theme: "Vinyasa",
    price: null,
    isFree: true,
  },
  "yin-yoga-relaxation": {
    title: "Yin Yoga — Relaxation profonde",
    description: "Plongez dans une pratique de Yin Yoga conçue pour une relaxation profonde. Les postures tenues longtemps permettent de travailler les tissus conjonctifs et de relâcher les tensions accumulées.\n\nCette séance est idéale en fin de journée ou après un effort physique. Vous découvrirez les postures fondamentales du Yin et apprendrez à lâcher prise véritablement.",
    thumbnail: null,
    videoUrl: null,
    duration: 45,
    level: "BEGINNER",
    theme: "Yin Yoga",
    price: 9.99,
    isFree: false,
  },
  "vinyasa-flow-intermediaire": {
    title: "Vinyasa Flow — Énergie & Force",
    description: "Un flow dynamique pour les pratiquants intermédiaires. Cette séance vous amène plus loin dans votre pratique avec des enchaînements fluides et des postures de force.\n\nTravaillez votre endurance, votre équilibre et votre concentration avec cette séance énergisante de 35 minutes.",
    thumbnail: null,
    videoUrl: null,
    duration: 35,
    level: "INTERMEDIATE",
    theme: "Vinyasa",
    price: null,
    isFree: false,
  },
};

const levelLabels = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

const relatedCourses = [
  { slug: "yin-yoga-relaxation", title: "Yin Yoga — Relaxation profonde", thumbnail: null, duration: 45, level: "BEGINNER" as const, theme: "Yin Yoga", isFree: false, price: 9.99 },
  { slug: "meditation-guidee-stress", title: "Méditation guidée — Gestion du stress", thumbnail: null, duration: 15, level: "BEGINNER" as const, theme: "Méditation", isFree: true, price: null },
  { slug: "hatha-yoga-equilibre", title: "Hatha Yoga — Équilibre & Souplesse", thumbnail: null, duration: 40, level: "INTERMEDIATE" as const, theme: "Hatha", isFree: false, price: 12.99 },
];

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();

  // In a real app, this would be fetched from the database
  // For now, we use demo data with a fallback
  const slug = "salutation-au-soleil"; // default fallback
  const course = coursesData[slug] || coursesData["salutation-au-soleil"];
  const isLocked = !course.isFree; // Simplified demo logic

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back */}
      <Link
        href="/cours"
        className="inline-flex items-center gap-2 text-muted hover:text-heading transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux cours
      </Link>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          <VideoPlayer
            videoUrl={course.videoUrl}
            thumbnail={course.thumbnail}
            title={course.title}
            isLocked={isLocked}
            onUnlockClick={() => router.push("/tarifs")}
          />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={course.level === "BEGINNER" ? "success" : course.level === "INTERMEDIATE" ? "warning" : "premium"}>
                {levelLabels[course.level]}
              </Badge>
              <Badge>{course.theme}</Badge>
            </div>

            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-heading">
              {course.title}
            </h1>

            <div className="flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.duration} minutes
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                {levelLabels[course.level]}
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                {course.theme}
              </span>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="font-heading text-2xl font-semibold text-heading">
              Description
            </h2>
            {course.description.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-text leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6 sticky top-24">
            {course.isFree ? (
              <>
                <Badge variant="free" className="text-base px-4 py-1">
                  Gratuit
                </Badge>
                <Button className="w-full" size="lg">
                  Regarder maintenant
                </Button>
              </>
            ) : (
              <>
                {course.price && (
                  <div>
                    <p className="text-sm text-muted">Prix à l&apos;unité</p>
                    <p className="font-heading text-4xl font-bold text-heading">
                      {course.price} <span className="text-lg text-muted">€</span>
                    </p>
                  </div>
                )}

                <Button className="w-full" size="lg">
                  <ShoppingCart className="w-5 h-5" />
                  {course.price ? `Acheter — ${course.price} €` : "S'abonner pour accéder"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted">ou</p>
                  <Link href="/tarifs" className="text-sm text-button hover:underline">
                    Voir les abonnements
                  </Link>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs text-muted">
                    ✓ Accès illimité une fois acheté<br />
                    ✓ Disponible sur tous vos appareils<br />
                    ✓ Suivi de progression inclus
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Cours similaires */}
      <section className="mt-20">
        <h2 className="font-heading text-2xl font-bold text-heading mb-8">
          Cours similaires
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {relatedCourses.map((c) => (
            <CourseCard key={c.slug} {...c} />
          ))}
        </div>
      </section>
    </div>
  );
}

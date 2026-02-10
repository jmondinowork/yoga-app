import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Clock } from "lucide-react";
import FormationCard from "@/components/courses/FormationCard";
import Button from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Formations",
  description: "Découvrez nos formations complètes de yoga, des programmes structurés pour progresser étape par étape.",
};

// Données de démo
const formations = [
  {
    slug: "programme-debutant-complet",
    title: "Programme Débutant Complet",
    description: "Un programme de 4 semaines pour découvrir les bases du yoga. De la respiration aux premières postures, progressez en toute confiance.",
    thumbnail: null,
    price: 39.99,
    courseCount: 12,
    totalDuration: 320,
  },
  {
    slug: "30-jours-de-yoga",
    title: "30 Jours de Yoga",
    description: "Un cours par jour pendant 30 jours pour installer une pratique régulière. Chaque séance dure entre 15 et 30 minutes.",
    thumbnail: null,
    price: null,
    courseCount: 30,
    totalDuration: 600,
  },
  {
    slug: "souplesse-et-mobilite",
    title: "Souplesse & Mobilité",
    description: "Un programme progressif pour améliorer votre souplesse et votre mobilité articulaire avec des séances ciblées.",
    thumbnail: null,
    price: 29.99,
    courseCount: 8,
    totalDuration: 240,
  },
  {
    slug: "meditation-et-pranayama",
    title: "Méditation & Pranayama",
    description: "Apprenez les techniques de méditation et de respiration yogique pour réduire le stress et améliorer votre concentration.",
    thumbnail: null,
    price: null,
    courseCount: 10,
    totalDuration: 180,
  },
];

export default function FormationsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
          Formations
        </h1>
        <p className="text-lg text-text max-w-2xl">
          Des programmes structurés pour progresser étape par étape.
          Suivez un parcours complet adapté à vos objectifs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {formations.map((formation) => (
          <FormationCard key={formation.slug} {...formation} />
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 bg-gradient-to-r from-accent-light/50 to-primary/30 rounded-3xl p-10 text-center space-y-4">
        <h2 className="font-heading text-3xl font-bold text-heading">
          Accédez à toutes les formations
        </h2>
        <p className="text-text max-w-xl mx-auto">
          Avec un abonnement, accédez à l&apos;ensemble de notre catalogue de formations et de cours.
        </p>
        <Link href="/tarifs">
          <Button size="lg">
            Voir les abonnements
            <ArrowRight className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

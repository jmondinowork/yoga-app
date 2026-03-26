import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Play,
  Users,
  BookOpen,
  Award,
  Clock,
  BarChart3,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Accordion } from "@/components/ui/index";
import CourseCard from "@/components/courses/CourseCard";
import PricingTable from "@/components/pricing/PricingTable";
import TestimonialCarousel from "@/components/home/TestimonialCarousel";

export const metadata: Metadata = {
  title: "Prana Motion Yoga — Cours de yoga en ligne",
  description:
    "Découvrez le yoga à votre rythme. Des cours en ligne pour tous les niveaux : Vinyasa, Hatha, Yin, Méditation. Abonnement ou achat à l'unité.",
};

// Données de démo pour la page d'accueil (seront remplacées par la BDD)
const featuredCourses = [
  {
    slug: "salutation-au-soleil",
    title: "Salutation au Soleil — Séance matinale",
    thumbnail: null,
    duration: 20,
    level: "BEGINNER" as const,
    theme: "Vinyasa",
    price: 7.99,
  },
  {
    slug: "yin-yoga-relaxation",
    title: "Yin Yoga — Relaxation profonde",
    thumbnail: null,
    duration: 45,
    level: "BEGINNER" as const,
    theme: "Yin Yoga",
    price: 9.99,
  },
  {
    slug: "vinyasa-flow-intermediaire",
    title: "Vinyasa Flow — Énergie & Force",
    thumbnail: null,
    duration: 35,
    level: "INTERMEDIATE" as const,
    theme: "Vinyasa",
    price: 12.99,
  },
  {
    slug: "meditation-guidee-stress",
    title: "Méditation guidée — Gestion du stress",
    thumbnail: null,
    duration: 15,
    level: "BEGINNER" as const,
    theme: "Méditation",
    price: 5.99,
  },
  {
    slug: "hatha-yoga-equilibre",
    title: "Hatha Yoga — Équilibre & Souplesse",
    thumbnail: null,
    duration: 40,
    level: "INTERMEDIATE" as const,
    theme: "Hatha",
    price: 12.99,
  },
  {
    slug: "yoga-avance-inversions",
    title: "Inversions — Défie la gravité",
    thumbnail: null,
    duration: 50,
    level: "ADVANCED" as const,
    theme: "Vinyasa",
    price: 14.99,
  },
];

const faqItems = [
  {
    question: "Ai-je besoin d'expérience pour commencer ?",
    answer:
      "Absolument pas ! Nos cours sont adaptés à tous les niveaux. Chaque vidéo indique clairement le niveau requis et vous guide pas à pas. Commencez par les cours « Débutant » et progressez à votre rythme.",
  },
  {
    question: "Comment fonctionne l'abonnement ?",
    answer:
      "L'abonnement vous donne un accès illimité à tous les cours et formations de la plateforme. Vous pouvez choisir un abonnement mensuel ou annuel (avec 25% de réduction). Vous pouvez annuler à tout moment.",
  },
  {
    question: "Puis-je acheter un cours sans m'abonner ?",
    answer:
      "Oui ! Chaque cours peut être acheté individuellement. Une fois acheté, vous y avez accès à vie. C'est idéal si vous ne souhaitez suivre que quelques cours spécifiques.",
  },
  {
    question: "Sur quels appareils puis-je regarder les cours ?",
    answer:
      "Vous pouvez accéder aux cours depuis n'importe quel appareil : ordinateur, tablette ou smartphone. Le site est entièrement responsive.",
  },
  {
    question: "Y a-t-il une période d'essai ?",
    answer:
      "Nous proposons un large catalogue de cours que vous pouvez découvrir sur la page cours. Pour accéder aux contenus, créez un compte et découvrez nos offres d'abonnement ou achetez à l'unité.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ═══ HERO SECTION ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-background to-accent-light/30" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-button/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-primary/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 bg-accent-light/50 text-button px-4 py-2 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                Nouveaux cours chaque semaine
              </div>

              <h1 className="font-heading text-5xl lg:text-7xl font-bold text-heading leading-[1.1]">
                Trouvez votre{" "}
                <span className="text-button">équilibre</span>{" "}
                intérieur
              </h1>

              <p className="text-lg text-text max-w-lg leading-relaxed">
                Des cours de yoga en ligne pour tous les niveaux. Pratiquez à votre
                rythme, où que vous soyez, avec des séances guidées par des
                professionnels passionnés.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/cours">
                  <Button size="lg">
                    Découvrir les cours
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/inscription">
                  <Button variant="outline" size="lg">
                    <Play className="w-5 h-5" />
                    Essayer maintenant
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 pt-4">
                <div>
                  <p className="font-heading text-3xl font-bold text-heading">50+</p>
                  <p className="text-sm text-muted">Cours disponibles</p>
                </div>
                <div>
                  <p className="font-heading text-3xl font-bold text-heading">2k+</p>
                  <p className="text-sm text-muted">Élèves actifs</p>
                </div>
                <div>
                  <p className="font-heading text-3xl font-bold text-heading">4.9</p>
                  <p className="text-sm text-muted">Note moyenne</p>
                </div>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative w-[480px] h-[480px]">
                <div className="absolute inset-0 bg-gradient-to-br from-button/20 to-primary/40 rounded-[3rem] rotate-3" />
                <div className="absolute inset-4 bg-gradient-to-br from-accent-light/50 to-card rounded-[2.5rem] -rotate-2 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <span className="text-8xl">🧘‍♀️</span>
                    <p className="font-heading text-xl text-heading/60">
                      Votre espace de sérénité
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ À PROPOS ═══ */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Photo placeholder */}
            <div className="relative">
              <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-primary/60 to-accent-light/40 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-9xl opacity-40">🙏</span>
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 bg-button text-white p-6 rounded-2xl shadow-lg">
                <p className="font-heading text-3xl font-bold">10+</p>
                <p className="text-sm opacity-80">années d&apos;expérience</p>
              </div>
            </div>

            <div className="space-y-6">
              <p className="text-button text-sm font-medium uppercase tracking-wider">
                À propos
              </p>
              <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading">
                Passionnée de yoga, <br />
                je partage ma pratique
              </h2>
              <div className="space-y-4 text-text leading-relaxed">
                <p>
                  Depuis plus de 10 ans, le yoga a transformé ma vie. Formée auprès
                  des plus grands maîtres, je vous propose des cours accessibles qui
                  allient tradition et modernité.
                </p>
                <p>
                  Mon approche est bienveillante et adaptée à chaque niveau. Que vous
                  soyez débutant ou pratiquant confirmé, vous trouverez des séances qui
                  vous correspondent.
                </p>
              </div>
              <Link href="/a-propos">
                <Button variant="outline">
                  En savoir plus
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ COURS POPULAIRES ═══ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-button text-sm font-medium uppercase tracking-wider mb-3">
              Nos cours
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              Cours populaires
            </h2>
            <p className="text-text text-lg max-w-2xl mx-auto">
              Découvrez nos cours les plus appréciés par la communauté
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <CourseCard key={course.slug} {...course} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/cours">
              <Button variant="outline" size="lg">
                Voir tous les cours
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ COMMENT ÇA MARCHE ═══ */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-accent-light/30 to-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-button text-sm font-medium uppercase tracking-wider mb-3">
              Simple & rapide
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              Comment ça marche ?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                step: "01",
                title: "Créez votre compte",
                description:
                  "Inscription gratuite en quelques secondes. Connectez-vous avec Google ou votre email.",
              },
              {
                icon: BookOpen,
                step: "02",
                title: "Choisissez votre cours",
                description:
                  "Parcourez notre catalogue, filtrez par niveau, thème ou durée. Trouvez le cours parfait pour vous.",
              },
              {
                icon: Award,
                step: "03",
                title: "Pratiquez & progressez",
                description:
                  "Suivez vos cours à votre rythme, suivez votre progression et atteignez vos objectifs.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="relative bg-card rounded-2xl p-8 border border-border shadow-sm text-center space-y-4"
                >
                  <div className="absolute -top-4 left-8 bg-button text-white px-3 py-1 rounded-lg text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mx-auto">
                    <Icon className="w-7 h-7 text-button" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-heading">
                    {item.title}
                  </h3>
                  <p className="text-text text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ TARIFS ═══ */}
      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-button text-sm font-medium uppercase tracking-wider mb-3">
              Tarifs
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              Un plan pour chaque pratique
            </h2>
            <p className="text-text text-lg max-w-2xl mx-auto">
              Achetez vos cours à l&apos;unité ou optez pour un abonnement illimité
            </p>
          </div>

          <PricingTable />
        </div>
      </section>

      {/* ═══ TÉMOIGNAGES ═══ */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-button text-sm font-medium uppercase tracking-wider mb-3">
              Témoignages
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              Ce que disent nos élèves
            </h2>
          </div>

          <TestimonialCarousel />
        </div>
      </section>

      {/* ═══ THÈMES ═══ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              Explorez nos thèmes
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Vinyasa", emoji: "🔥", count: 15 },
              { name: "Hatha", emoji: "🌿", count: 12 },
              { name: "Yin Yoga", emoji: "🌙", count: 10 },
              { name: "Méditation", emoji: "🧘", count: 8 },
              { name: "Prénatal", emoji: "🤰", count: 5 },
              { name: "Restauratif", emoji: "💆", count: 6 },
              { name: "Power Yoga", emoji: "💪", count: 7 },
              { name: "Respiration", emoji: "🌬️", count: 4 },
            ].map((theme) => (
              <Link
                key={theme.name}
                href={`/cours?theme=${theme.name}`}
                className="group bg-card rounded-2xl border border-border p-6 text-center hover:border-button hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <span className="text-4xl block mb-3">{theme.emoji}</span>
                <h3 className="font-heading text-lg font-semibold text-heading group-hover:text-button transition-colors">
                  {theme.name}
                </h3>
                <p className="text-sm text-muted mt-1">{theme.count} cours</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-button text-sm font-medium uppercase tracking-wider mb-3">
              FAQ
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              Questions fréquentes
            </h2>
          </div>

          <Accordion items={faqItems} />
        </div>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-20 lg:py-28 bg-gradient-to-r from-button to-button/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="font-heading text-4xl lg:text-5xl font-bold text-white">
            Prêt(e) à commencer votre voyage ?
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Rejoignez des milliers de pratiquants et commencez aujourd&apos;hui votre
            transformation. Découvrez nos cours dès maintenant.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/inscription">
              <Button
                size="lg"
                className="bg-white !text-[color:var(--color-button)] hover:bg-white/90"
              >
                Créer mon compte
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/cours">
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                Voir les cours
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

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
  CalendarDays,
  Video,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { Accordion } from "@/components/ui/index";
import CourseCard from "@/components/courses/CourseCard";
import TarifsClient from "@/components/pricing/TarifsClient";
import TestimonialCarousel from "@/components/home/TestimonialCarousel";
import { getContents, getContent } from "@/lib/content";
import { prisma } from "@/lib/prisma";

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents([
    "seo_homepage_title",
    "seo_homepage_description",
    "seo_homepage_keywords",
    "seo_homepage_og_title",
    "seo_homepage_og_description",
  ]);
  const title = c["seo_homepage_title"] ?? "Prana Motion Yoga — Cours de yoga en ligne";
  const description = c["seo_homepage_description"] ??
    "Découvrez le yoga à votre rythme. Des cours en ligne pour tous les niveaux : Vinyasa, Hatha, Yin, Méditation. Abonnement illimité ou location à l'unité.";
  return {
    title,
    description,
    ...(c["seo_homepage_keywords"] ? { keywords: c["seo_homepage_keywords"].split(",").map((k: string) => k.trim()) } : {}),
    openGraph: {
      title: c["seo_homepage_og_title"] || title,
      description: c["seo_homepage_og_description"] || description,
    },
  };
}

import { getPresignedUrl } from "@/lib/r2";

const defaultFaqItems = [
  {
    question: "Ai-je besoin d'expérience pour commencer ?",
    answer:
      "Absolument pas ! Nos cours sont adaptés à tous les niveaux. Chaque vidéo indique clairement le niveau requis et vous guide pas à pas. Commencez par les cours « Débutant » et progressez à votre rythme.",
  },
  {
    question: "Comment fonctionne l'abonnement ?",
    answer:
      "L'abonnement vous donne un accès illimité à tous les cours vidéo (hors formations). Vous pouvez choisir un abonnement mensuel ou annuel (avec 24% de réduction). Vous pouvez annuler à tout moment.",
  },
  {
    question: "Puis-je accéder à un cours sans m'abonner ?",
    answer:
      "Oui ! Chaque cours peut être loué individuellement pour 72h. C'est idéal si vous ne souhaitez suivre que quelques cours spécifiques sans engagement.",
  },
  {
    question: "Sur quels appareils puis-je regarder les cours ?",
    answer:
      "Vous pouvez accéder aux cours depuis n'importe quel appareil : ordinateur, tablette ou smartphone. Le site est entièrement responsive.",
  },
  {
    question: "Y a-t-il une période d'essai ?",
    answer:
      "Nous proposons un large catalogue de cours que vous pouvez découvrir sur la page cours. Pour accéder aux contenus, créez un compte et découvrez nos offres d'abonnement ou louez un cours à l'unité (72h d'accès).",
  },
];

export default async function HomePage() {
  const c = await getContents([
    "homepage_hero_badge",
    "homepage_hero_title",
    "homepage_hero_subtitle",
    "homepage_about_label",
    "homepage_about_heading",
    "homepage_about_text",
    "homepage_about_stat_1",
    "homepage_about_stat_2",
    "homepage_about_stat_3",
    "homepage_how_label",
    "homepage_how_heading",
    "homepage_how_step_1_title",
    "homepage_how_step_1_desc",
    "homepage_how_step_2_title",
    "homepage_how_step_2_desc",
    "homepage_how_step_3_title",
    "homepage_how_step_3_desc",
    "homepage_cta_heading",
    "homepage_cta_subtitle",
    "homepage_calendar_heading",
    "homepage_calendar_subtitle",
  ]);

  // Fetch upcoming live events (next 3)
  const upcomingEvents = await prisma.liveEvent.findMany({
    where: {
      isPublished: true,
      startTime: { gte: new Date() },
    },
    orderBy: { startTime: "asc" },
    take: 3,
    include: {
      _count: { select: { registrations: true } },
    },
  });

  // Fetch testimonials from DB
  const dbTestimonials = await prisma.testimonial.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" },
  });
  const testimonials = dbTestimonials.map((t) => ({
    id: t.id,
    name: t.name,
    content: t.content,
    rating: t.rating,
  }));

  // Fetch FAQ from DB
  const faqRaw = await getContent("faq_homepage", "[]");
  let faqItems: { question: string; answer: string }[];
  try {
    const parsed = JSON.parse(faqRaw);
    faqItems = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultFaqItems;
  } catch {
    faqItems = defaultFaqItems;
  }

  // Fetch featured courses from DB (6 latest published)
  const dbCourses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
    select: {
      slug: true,
      title: true,
      thumbnail: true,
      duration: true,
      theme: true,
      price: true,
      includedInSubscription: true,
    },
  });
  const featuredCourses = await Promise.all(
    dbCourses.map(async (course) => ({
      ...course,
      thumbnail: course.thumbnail
        ? course.thumbnail.startsWith("http")
          ? course.thumbnail
          : await getPresignedUrl(course.thumbnail, 3600)
        : null,
    }))
  );

  // Fetch themes dynamically from published courses (with count)
  const allCourses = await prisma.course.findMany({
    where: { isPublished: true },
    select: { theme: true },
  });
  const themeCounts: Record<string, number> = {};
  for (const course of allCourses) {
    themeCounts[course.theme] = (themeCounts[course.theme] || 0) + 1;
  }
  const themeEmojis: Record<string, string> = {
    Vinyasa: "🔥", Hatha: "🌿", "Yin Yoga": "🌙", Méditation: "🧘",
    Prénatal: "🤰", Restauratif: "💆", "Power Yoga": "💪", Respiration: "🌬️",
    Pranayama: "🌬️", Ashtanga: "⚡", Kundalini: "✨", Nidra: "😴",
  };
  const themes = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name,
      emoji: themeEmojis[name] || "🧘",
      count,
    }));

  // Parse stats (format: "50+ Cours disponibles")
  const stat1 = (c["homepage_about_stat_1"] ?? "50+ Cours disponibles").split(" ");
  const stat1Num = stat1[0];
  const stat1Label = stat1.slice(1).join(" ");
  const stat2 = (c["homepage_about_stat_2"] ?? "2k+ Élèves actifs").split(" ");
  const stat2Num = stat2[0];
  const stat2Label = stat2.slice(1).join(" ");
  const stat3 = (c["homepage_about_stat_3"] ?? "4.9 Note moyenne").split(" ");
  const stat3Num = stat3[0];
  const stat3Label = stat3.slice(1).join(" ");

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
                {c["homepage_hero_badge"] ?? "Nouveaux cours chaque semaine"}
              </div>

              <h1 className="font-heading text-5xl lg:text-7xl font-bold text-heading leading-[1.1]">
                {c["homepage_hero_title"] ?? (
                  <>
                    Trouvez votre{" "}
                    <span className="text-button">équilibre</span>{" "}
                    intérieur
                  </>
                )}
              </h1>

              <p className="text-lg text-text max-w-lg leading-relaxed">
                {c["homepage_hero_subtitle"] ??
                  "Des cours de yoga en ligne pour tous les niveaux. Pratiquez à votre rythme, où que vous soyez, avec des séances guidées par des professionnels passionnés."}
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
                  <p className="font-heading text-3xl font-bold text-heading">{stat1Num}</p>
                  <p className="text-sm text-muted">{stat1Label}</p>
                </div>
                <div>
                  <p className="font-heading text-3xl font-bold text-heading">{stat2Num}</p>
                  <p className="text-sm text-muted">{stat2Label}</p>
                </div>
                <div>
                  <p className="font-heading text-3xl font-bold text-heading">{stat3Num}</p>
                  <p className="text-sm text-muted">{stat3Label}</p>
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
                {c["homepage_about_label"] ?? "À propos"}
              </p>
              <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading">
                {c["homepage_about_heading"] ?? (
                  <>
                    Passionnée de yoga, <br />
                    je partage ma pratique
                  </>
                )}
              </h2>
              <div className="space-y-4 text-text leading-relaxed">
                {c["homepage_about_text"] ? (
                  c["homepage_about_text"].split("\n\n").map((p, i) => <p key={i}>{p}</p>)
                ) : (
                  <>
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
                  </>
                )}
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
              {c["homepage_how_label"] ?? "Simple & rapide"}
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              {c["homepage_how_heading"] ?? "Comment ça marche ?"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                step: "01",
                title: c["homepage_how_step_1_title"] ?? "Créez votre compte",
                description:
                  c["homepage_how_step_1_desc"] ??
                  "Inscription gratuite en quelques secondes. Connectez-vous avec Google ou votre email.",
              },
              {
                icon: BookOpen,
                step: "02",
                title: c["homepage_how_step_2_title"] ?? "Choisissez votre cours",
                description:
                  c["homepage_how_step_2_desc"] ??
                  "Parcourez notre catalogue, filtrez par niveau, thème ou durée. Trouvez le cours parfait pour vous.",
              },
              {
                icon: Award,
                step: "03",
                title: c["homepage_how_step_3_title"] ?? "Pratiquez & progressez",
                description:
                  c["homepage_how_step_3_desc"] ??
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

      {/* ═══ COURS EN DIRECT ═══ */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-button text-sm font-medium uppercase tracking-wider mb-3">
              En direct
            </p>
            <h2 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
              {c["homepage_calendar_heading"] ?? "Rejoignez nos cours en direct"}
            </h2>
            <p className="text-text text-lg max-w-2xl mx-auto">
              {c["homepage_calendar_subtitle"] ??
                "Pratiquez en live avec Mathilde via Zoom. Des séances interactives où vous pouvez poser vos questions et être corrigé(e) en temps réel."}
            </p>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {upcomingEvents.map((event) => {
                const date = new Date(event.startTime);
                const spotsLeft = event.maxParticipants - event._count.registrations;
                return (
                  <div
                    key={event.id}
                    className="bg-background rounded-2xl border border-border p-6 space-y-4 hover:border-button/30 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-button/10 flex items-center justify-center shrink-0">
                        <Video className="w-6 h-6 text-button" />
                      </div>
                      <div>
                        <h3 className="font-heading font-semibold text-heading">
                          {event.title}
                        </h3>
                        <p className="text-xs text-muted">{event.theme}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        {date.toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        {date.toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-sm text-muted">
                        <Users className="w-4 h-4" />
                        {spotsLeft > 0
                          ? `${spotsLeft} place${spotsLeft > 1 ? "s" : ""}`
                          : "Complet"}
                      </span>
                      <span className="text-sm text-muted">
                        {event.duration} min
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 mb-10">
              <CalendarDays className="w-12 h-12 text-muted/30 mx-auto mb-3" />
              <p className="text-muted">
                Les prochains cours en direct seront bientôt annoncés.
              </p>
            </div>
          )}

          <div className="text-center">
            <Link href="/cours-en-ligne">
              <Button size="lg">
                Voir tous les cours en ligne
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
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
              Louez vos cours à l&apos;unité ou optez pour un abonnement illimité
            </p>
          </div>

          <TarifsClient />
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

          <TestimonialCarousel testimonials={testimonials} />
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
            {themes.map((theme) => (
              <Link
                key={theme.name}
                href={`/cours?theme=${theme.name}`}
                className="group bg-card rounded-2xl border border-border p-6 text-center hover:border-button hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <span className="text-4xl block mb-3">{theme.emoji}</span>
                <h3 className="font-heading text-lg font-semibold text-heading group-hover:text-button transition-colors">
                  {theme.name}
                </h3>
                <p className="text-sm text-muted mt-1">{theme.count} {theme.count > 1 ? "cours" : "cours"}</p>
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
            {c["homepage_cta_heading"] ?? "Prêt(e) à commencer votre voyage ?"}
          </h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            {c["homepage_cta_subtitle"] ??
              "Rejoignez des milliers de pratiquants et commencez aujourd'hui votre transformation. Découvrez nos cours dès maintenant."}
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

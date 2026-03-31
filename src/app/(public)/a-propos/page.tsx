import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Heart, BookOpen, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { getContents } from "@/lib/content";

const ABOUT_KEYS = [
  "about_hero_label",
  "about_hero_heading",
  "about_hero_intro",
  "about_story_heading",
  "about_story_text_1",
  "about_story_text_2",
  "about_story_text_3",
  "about_values_heading",
  "about_value_1_title",
  "about_value_1_desc",
  "about_value_2_title",
  "about_value_2_desc",
  "about_value_3_title",
  "about_value_3_desc",
  "about_value_4_title",
  "about_value_4_desc",
  "seo_about_title",
  "seo_about_description",
];

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents(["seo_about_title", "seo_about_description", "seo_about_keywords", "seo_about_og_title", "seo_about_og_description"]);
  const title = c["seo_about_title"] ?? "À propos";
  const description = c["seo_about_description"] ?? "Découvrez mon parcours, ma philosophie et ma passion pour le yoga. Formatrice certifiée avec plus de 10 ans d'expérience.";
  return {
    title,
    description,
    ...(c["seo_about_keywords"] ? { keywords: c["seo_about_keywords"].split(",").map((k: string) => k.trim()) } : {}),
    openGraph: { title: c["seo_about_og_title"] || title, description: c["seo_about_og_description"] || description },
  };
}

export default async function AProposPage() {
  const c = await getContents(ABOUT_KEYS);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/30 to-accent-light/20 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-button text-sm font-medium uppercase tracking-wider">
                {c["about_hero_label"] ?? "À propos"}
              </p>
              <h1 className="font-heading text-4xl lg:text-6xl font-bold text-heading">
                {c["about_hero_heading"] ?? "Bonjour, je suis votre professeure"}
              </h1>
              <p className="text-lg text-text leading-relaxed">
                {c["about_hero_intro"] ??
                  "Passionnée de yoga depuis plus de 10 ans, j'ai dédié ma vie à cette pratique qui m'a transformée en profondeur. Aujourd'hui, je souhaite partager cette passion avec vous à travers des cours accessibles et bienveillants."}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="relative w-80 h-96">
                <div className="absolute inset-0 bg-gradient-to-br from-button/20 to-primary/40 rounded-3xl rotate-3" />
                <div className="absolute inset-2 bg-card rounded-3xl -rotate-1 flex items-center justify-center shadow-lg">
                  <span className="text-8xl">🧘‍♀️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mon histoire */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-heading">
            {c["about_story_heading"] ?? "Mon histoire"}
          </h2>
          <div className="space-y-6 text-text leading-relaxed text-lg">
            <p>
              {c["about_story_text_1"] ??
                "Tout a commencé lors d'un voyage en Inde, où j'ai découvert le yoga sous sa forme la plus authentique. Ce qui n'était au départ qu'une simple curiosité est devenu une véritable vocation."}
            </p>
            <p>
              {c["about_story_text_2"] ??
                "Après avoir obtenu ma certification RYT 500, j'ai enseigné dans plusieurs studios avant de créer cette plateforme en ligne. Mon objectif : rendre le yoga accessible à tous, partout, à tout moment."}
            </p>
            <p>
              {c["about_story_text_3"] ??
                "Ma philosophie d'enseignement repose sur la bienveillance, la progression naturelle et le respect du corps de chacun. Je crois que le yoga n'est pas une performance, mais un chemin personnel vers le bien-être."}
            </p>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-heading text-center mb-14">
            {c["about_values_heading"] ?? "Mes valeurs"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => {
              const icons = [Heart, BookOpen, Award, Star];
              const Icon = icons[n - 1];
              const defaultTitles = ["Bienveillance", "Accessibilité", "Expertise", "Authenticité"];
              const defaultDescs = [
                "Un espace sans jugement où chacun progresse à son rythme.",
                "Des cours pour tous les niveaux, du débutant à l'avancé.",
                "10+ ans d'expérience et une certification RYT 500.",
                "Un enseignement fidèle aux traditions yogiques.",
              ];
              const title = c[`about_value_${n}_title`] ?? defaultTitles[n - 1];
              const desc = c[`about_value_${n}_desc`] ?? defaultDescs[n - 1];
              return (
                <div
                  key={n}
                  className="text-center space-y-4 p-6 rounded-2xl hover:bg-background transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto">
                    <Icon className="w-6 h-6 text-button" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-heading">
                    {title}
                  </h3>
                  <p className="text-text text-sm">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28 bg-gradient-to-r from-button to-button/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="font-heading text-4xl font-bold text-white">
            Prêt(e) à commencer ?
          </h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            Rejoignez-moi sur le tapis et découvrez les bienfaits du yoga.
          </p>
          <Link href="/cours">
            <Button size="lg" className="bg-white !text-[color:var(--color-button)] hover:bg-white/90">
              Découvrir les cours
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

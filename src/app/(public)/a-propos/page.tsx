import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Award, Heart, BookOpen, Star } from "lucide-react";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "À propos",
  description: "Découvrez mon parcours, ma philosophie et ma passion pour le yoga. Formatrice certifiée avec plus de 10 ans d'expérience.",
};

export default function AProposPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/30 to-accent-light/20 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <p className="text-button text-sm font-medium uppercase tracking-wider">
                À propos
              </p>
              <h1 className="font-heading text-4xl lg:text-6xl font-bold text-heading">
                Bonjour, je suis <br />
                <span className="text-button">votre professeure</span>
              </h1>
              <p className="text-lg text-text leading-relaxed">
                Passionnée de yoga depuis plus de 10 ans, j&apos;ai dédié ma vie à
                cette pratique qui m&apos;a transformée en profondeur. Aujourd&apos;hui,
                je souhaite partager cette passion avec vous à travers des cours
                accessibles et bienveillants.
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
            Mon histoire
          </h2>
          <div className="space-y-6 text-text leading-relaxed text-lg">
            <p>
              Tout a commencé lors d&apos;un voyage en Inde, où j&apos;ai découvert le
              yoga sous sa forme la plus authentique. Ce qui n&apos;était au départ
              qu&apos;une simple curiosité est devenu une véritable vocation.
            </p>
            <p>
              Après avoir obtenu ma certification RYT 500, j&apos;ai enseigné dans
              plusieurs studios avant de créer cette plateforme en ligne. Mon
              objectif : rendre le yoga accessible à tous, partout, à tout moment.
            </p>
            <p>
              Ma philosophie d&apos;enseignement repose sur la bienveillance, la
              progression naturelle et le respect du corps de chacun. Je crois que
              le yoga n&apos;est pas une performance, mais un chemin personnel vers le
              bien-être.
            </p>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-20 lg:py-28 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-heading text-center mb-14">
            Mes valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Heart,
                title: "Bienveillance",
                description: "Un espace sans jugement où chacun progresse à son rythme.",
              },
              {
                icon: BookOpen,
                title: "Accessibilité",
                description: "Des cours pour tous les niveaux, du débutant à l'avancé.",
              },
              {
                icon: Award,
                title: "Expertise",
                description: "10+ ans d'expérience et une certification RYT 500.",
              },
              {
                icon: Star,
                title: "Authenticité",
                description: "Un enseignement fidèle aux traditions yogiques.",
              },
            ].map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="text-center space-y-4 p-6 rounded-2xl hover:bg-background transition-colors"
                >
                  <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center mx-auto">
                    <Icon className="w-6 h-6 text-button" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-heading">
                    {value.title}
                  </h3>
                  <p className="text-text text-sm">{value.description}</p>
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
            <Button size="lg" className="bg-white text-button hover:bg-white/90">
              Découvrir les cours
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

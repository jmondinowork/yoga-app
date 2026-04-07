import Link from "next/link";
import { Instagram, Mail } from "lucide-react";
import { getContents } from "@/lib/content";

export default async function Footer() {
  const c = await getContents([
    "footer_brand",
    "footer_tagline",
    "footer_social_instagram",
    "footer_social_email",
  ]);

  const brand = c["footer_brand"] ?? "Prana Motion Yoga";
  const tagline = c["footer_tagline"] ?? "Découvrez le yoga à votre rythme, avec des cours en ligne accessibles à tous les niveaux.";
  const instagramUrl = c["footer_social_instagram"] ?? "";
  const email = c["footer_social_email"] ?? "";

  return (
    <footer className="bg-heading text-primary/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" prefetch={false} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-button flex items-center justify-center">
                <span className="text-white font-heading text-lg font-bold">Y</span>
              </div>
              <span className="font-heading text-2xl font-bold text-white">
                {brand}
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              {tagline}
            </p>
            <div className="flex gap-3">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-button transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {email && (
                <a
                  href={email.includes("@") ? `mailto:${email}` : email}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-button transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Cours vidéo */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-white">Cours vidéo</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cours" prefetch={false} className="text-sm hover:text-white transition-colors">
                  Cours vidéos
                </Link>
              </li>
              <li>
                <Link href="/formations" prefetch={false} className="text-sm hover:text-white transition-colors">
                  Formations
                </Link>
              </li>
            </ul>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-white">Informations</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/a-propos" prefetch={false} className="text-sm hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/tarifs" prefetch={false} className="text-sm hover:text-white transition-colors">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-white">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/mentions-legales" prefetch={false} className="text-sm hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgv" prefetch={false} className="text-sm hover:text-white transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" prefetch={false} className="text-sm hover:text-white transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-primary/50">
            © {new Date().getFullYear()} {brand}. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

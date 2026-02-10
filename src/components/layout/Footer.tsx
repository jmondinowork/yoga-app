import Link from "next/link";
import { Instagram, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-heading text-primary/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-button flex items-center justify-center">
                <span className="text-white font-heading text-lg font-bold">Y</span>
              </div>
              <span className="font-heading text-2xl font-bold text-white">
                Yoga Flow
              </span>
            </Link>
            <p className="text-sm leading-relaxed">
              Découvrez le yoga à votre rythme, avec des cours en ligne
              accessibles à tous les niveaux.
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-button transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-button transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-button transition-colors"
                aria-label="Email"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Cours */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-white">Cours</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/cours?theme=vinyasa" className="text-sm hover:text-white transition-colors">
                  Vinyasa
                </Link>
              </li>
              <li>
                <Link href="/cours?theme=hatha" className="text-sm hover:text-white transition-colors">
                  Hatha
                </Link>
              </li>
              <li>
                <Link href="/cours?theme=yin" className="text-sm hover:text-white transition-colors">
                  Yin Yoga
                </Link>
              </li>
              <li>
                <Link href="/cours?theme=meditation" className="text-sm hover:text-white transition-colors">
                  Méditation
                </Link>
              </li>
              <li>
                <Link href="/formations" className="text-sm hover:text-white transition-colors">
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
                <Link href="/a-propos" className="text-sm hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/tarifs" className="text-sm hover:text-white transition-colors">
                  Tarifs
                </Link>
              </li>
              <li>
                <Link href="/connexion" className="text-sm hover:text-white transition-colors">
                  Se connecter
                </Link>
              </li>
              <li>
                <Link href="/inscription" className="text-sm hover:text-white transition-colors">
                  Créer un compte
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div className="space-y-4">
            <h3 className="font-heading text-lg font-semibold text-white">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/mentions-legales" className="text-sm hover:text-white transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-sm hover:text-white transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-sm hover:text-white transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-primary/50">
            © {new Date().getFullYear()} Yoga Flow. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}

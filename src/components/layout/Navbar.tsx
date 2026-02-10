"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, User, LogOut } from "lucide-react";
import Button from "@/components/ui/Button";

interface NavbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  } | null;
}

const publicLinks = [
  { href: "/cours", label: "Cours" },
  { href: "/formations", label: "Formations" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
];

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-full bg-button flex items-center justify-center">
              <span className="text-white font-heading text-lg font-bold">Y</span>
            </div>
            <span className="font-heading text-2xl font-bold text-heading group-hover:text-button transition-colors">
              Prana Motion Yoga
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? "bg-primary/60 text-heading"
                    : "text-text hover:bg-primary/30 hover:text-heading"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === "ADMIN" && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm">
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/mon-espace">
                  <Button variant="secondary" size="sm">
                    <User className="w-4 h-4" />
                    Mon espace
                  </Button>
                </Link>
                <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="p-2 rounded-xl text-muted hover:text-heading hover:bg-primary/30 transition-colors cursor-pointer"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/connexion">
                  <Button variant="ghost" size="sm">
                    Se connecter
                  </Button>
                </Link>
                <Link href="/inscription">
                  <Button size="sm">Commencer</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-primary/30 transition-colors cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden pb-6 border-t border-border mt-2 pt-4 space-y-2">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/60 text-heading"
                    : "text-text hover:bg-primary/30"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-border space-y-2">
              {user ? (
                <>
                  {user.role === "ADMIN" && (
                    <Link href="/admin" onClick={() => setIsOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full">
                        Administration
                      </Button>
                    </Link>
                  )}
                  <Link href="/mon-espace" onClick={() => setIsOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      <User className="w-4 h-4" />
                      Mon espace
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/connexion" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full">
                      Se connecter
                    </Button>
                  </Link>
                  <Link href="/inscription" onClick={() => setIsOpen(false)}>
                    <Button size="sm" className="w-full">
                      Commencer
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

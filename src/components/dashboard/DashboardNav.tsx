"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, BookOpen, LayoutDashboard, Play } from "lucide-react";

const dashboardLinks = [
  { href: "/mon-espace", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/mon-espace/formations", label: "Formations", icon: BookOpen },
  { href: "/mon-espace/cours", label: "Cours vidéo", icon: Play },
  { href: "/mon-espace/parametres", label: "Paramètres", icon: Settings },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {dashboardLinks.map((link) => {
        const Icon = link.icon;
        const isActive =
          link.href === "/mon-espace"
            ? pathname === "/mon-espace"
            : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-button text-background"
                : "text-text hover:bg-primary/40 hover:text-heading"
            }`}
          >
            <Icon className="w-4 h-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

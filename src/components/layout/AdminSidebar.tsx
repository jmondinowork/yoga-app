"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  BookOpen,
  Users,
  CreditCard,
  FileText,
  ArrowLeft,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cours", label: "Cours", icon: Video },
  { href: "/admin/formations", label: "Formations", icon: BookOpen },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/abonnements", label: "Abonnements", icon: CreditCard },
  { href: "/admin/contenu", label: "Contenu", icon: FileText },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-card border-r border-border p-6 flex flex-col">
      <div className="mb-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted hover:text-heading transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au site
        </Link>
      </div>

      <div className="mb-6">
        <h2 className="font-heading text-xl font-bold text-heading">Administration</h2>
      </div>

      <nav className="flex-1 space-y-1">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-button text-white"
                  : "text-text hover:bg-primary/40 hover:text-heading"
              }`}
            >
              <Icon className="w-4 h-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

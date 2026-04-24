"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  BookOpen,
  Users,
  CreditCard,
  FileText,
  Settings,
  ArrowLeft,
  CalendarDays,
  Blocks,
  Menu,
  X,
} from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cours", label: "Cours", icon: Video },
  { href: "/admin/formations", label: "Formations", icon: BookOpen },
  { href: "/admin/cours-en-ligne", label: "Cours en ligne", icon: CalendarDays },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
  { href: "/admin/abonnements", label: "Revenus", icon: CreditCard },
  { href: "/admin/contenu", label: "Contenu", icon: FileText },
  { href: "/admin/services", label: "Services", icon: Blocks },
  { href: "/admin/parametres", label: "Paramètres", icon: Settings },
];

function SidebarContent({ pathname, onLinkClick }: { pathname: string; onLinkClick?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-8">
        <Link
          href="/"
          onClick={onLinkClick}
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
              prefetch={false}
              onClick={onLinkClick}
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
    </div>
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile header bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-bold text-heading">Administration</h2>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl hover:bg-primary/30 transition-colors cursor-pointer"
          aria-label="Menu"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay sidebar */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] bg-card border-r border-border p-6 flex flex-col overflow-y-auto">
            <SidebarContent pathname={pathname} onLinkClick={() => setIsOpen(false)} />
          </div>
          <div
            className="flex-1 bg-heading/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-card border-r border-border p-6 flex-col">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}

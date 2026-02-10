import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import { User, Settings, ShoppingBag, LayoutDashboard } from "lucide-react";

const dashboardLinks = [
  { href: "/mon-espace", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/mon-espace/mes-achats", label: "Mes achats", icon: ShoppingBag },
  { href: "/mon-espace/parametres", label: "Paramètres", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/connexion");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          role: session.user.role,
        }}
      />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-card rounded-2xl border border-border p-5 space-y-6">
              {/* User info */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-muted" />
                  )}
                </div>
                <div>
                  <p className="font-heading font-semibold text-heading">
                    {session.user.name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-muted">{session.user.email}</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {dashboardLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text hover:bg-primary/40 hover:text-heading transition-colors"
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

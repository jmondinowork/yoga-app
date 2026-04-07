import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import Navbar from "@/components/layout/Navbar";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { User } from "lucide-react";
import { getContent } from "@/lib/content";
import { getPresignedUrl } from "@/lib/r2";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, logoKey] = await Promise.all([
    auth(),
    getContent("site_logo"),
  ]);

  if (!session?.user) {
    redirect("/connexion");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const logoUrl = logoKey ? await getPresignedUrl(logoKey, 3600) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar
        logoUrl={logoUrl}
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
                    <Image
                      src={session.user.image}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
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
              <DashboardNav />
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

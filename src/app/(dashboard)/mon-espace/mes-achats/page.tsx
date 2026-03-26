import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCard, Calendar, ShoppingBag, TrendingUp } from "lucide-react";
import Badge from "@/components/ui/Badge";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Mes achats",
};

export default async function MesAchatsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const userId = session.user.id;

  // Récupérer tous les achats avec les détails
  const purchases = await prisma.purchase.findMany({
    where: { userId },
    include: {
      course: { select: { title: true, slug: true } },
      formation: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Récupérer l'abonnement actuel
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  // Calculs
  const totalSpent = purchases.reduce((sum, p) => sum + p.amount, 0);
  const courseCount = purchases.filter((p) => p.courseId).length;
  const formationCount = purchases.filter((p) => p.formationId).length;

  const hasAnyData = purchases.length > 0 || subscription;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Mes achats
        </h1>
        <p className="text-muted">Historique de vos transactions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <TrendingUp className="w-5 h-5 text-button mx-auto mb-1" />
          <p className="font-heading text-2xl font-bold text-heading">
            {totalSpent.toFixed(2)} €
          </p>
          <p className="text-xs text-muted">Total dépensé</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <ShoppingBag className="w-5 h-5 text-button mx-auto mb-1" />
          <p className="font-heading text-2xl font-bold text-heading">
            {courseCount}
          </p>
          <p className="text-xs text-muted">Cours achetés</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <CreditCard className="w-5 h-5 text-button mx-auto mb-1" />
          <p className="font-heading text-2xl font-bold text-heading">
            {formationCount}
          </p>
          <p className="text-xs text-muted">Formations achetées</p>
        </div>
      </div>

      {/* Abonnement actif */}
      {subscription && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-heading">
                Abonnement {subscription.plan === "ANNUAL" ? "annuel" : "mensuel"}
              </h2>
              <p className="text-sm text-muted mt-1">
                {subscription.status === "ACTIVE"
                  ? subscription.cancelAtPeriodEnd
                    ? `Actif jusqu'au ${subscription.currentPeriodEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                    : `Prochain renouvellement le ${subscription.currentPeriodEnd.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                  : `Statut : ${subscription.status}`}
              </p>
            </div>
            <Badge
              variant={
                subscription.status === "ACTIVE"
                  ? subscription.cancelAtPeriodEnd
                    ? "warning"
                    : "success"
                  : "default"
              }
            >
              {subscription.status === "ACTIVE"
                ? subscription.cancelAtPeriodEnd
                  ? "Résiliation programmée"
                  : "Actif"
                : subscription.status}
            </Badge>
          </div>
        </div>
      )}

      {/* Transactions */}
      {purchases.length > 0 ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading text-lg font-semibold text-heading">
              Transactions ({purchases.length})
            </h2>
          </div>
          <div className="divide-y divide-border">
            {purchases.map((purchase) => {
              const isCourse = !!purchase.courseId;
              const title = isCourse
                ? purchase.course?.title
                : purchase.formation?.title;

              return (
                <div
                  key={purchase.id}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-primary/10 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5 text-button" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-heading truncate">
                        {title || "Article supprimé"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={isCourse ? "default" : "premium"}>
                          {isCourse ? "Cours" : "Formation"}
                        </Badge>
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {purchase.createdAt.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="font-heading font-semibold text-heading shrink-0">
                    {purchase.amount.toFixed(2)} €
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ) : !subscription ? (
        <div className="bg-card rounded-2xl border border-border p-10 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-muted/30 mx-auto" />
          <h2 className="font-heading text-xl font-bold text-heading">
            Aucun achat pour le moment
          </h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            Parcourez notre catalogue de cours et de formations pour commencer
            votre pratique.
          </p>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { CreditCard, Users, ShoppingBag, TrendingUp } from "lucide-react";
import Badge from "@/components/ui/Badge";

interface Subscription {
  id: string;
  plan: "MONTHLY" | "ANNUAL";
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface Purchase {
  id: string;
  amount: number;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  course: { id: string; title: string; slug: string } | null;
  formation: { id: string; title: string; slug: string } | null;
}

interface Stats {
  monthlyActive: number;
  annualActive: number;
  totalPurchases: number;
  purchaseRevenue: number;
}

const planLabels: Record<string, string> = {
  MONTHLY: "Mensuel",
  ANNUAL: "Annuel",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "Actif",
  CANCELED: "Annulé",
  PAST_DUE: "Impayé",
  EXPIRED: "Expiré",
};

const statusVariants: Record<string, "success" | "warning" | "premium"> = {
  ACTIVE: "success",
  CANCELED: "warning",
  PAST_DUE: "premium",
  EXPIRED: "warning",
};

export default function AdminAbonnementsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<Stats>({ monthlyActive: 0, annualActive: 0, totalPurchases: 0, purchaseRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"subscriptions" | "purchases">("subscriptions");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/subscriptions");
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setPurchases(data.purchases || []);
        setStats(data.stats || stats);
      } catch {
        console.error("Erreur lors du chargement");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mrrMonthly = stats.monthlyActive * 19.99;
  const mrrAnnual = stats.annualActive * 14.99;
  const mrrTotal = mrrMonthly + mrrAnnual;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Abonnements & Achats
        </h1>
        <p className="text-muted">Suivez vos revenus et gérez les abonnements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-muted">Abonnés mensuels</span>
          </div>
          <p className="font-heading text-3xl font-bold text-heading">{stats.monthlyActive}</p>
          <p className="text-xs text-muted mt-1">{mrrMonthly.toFixed(2)} €/mois</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-muted">Abonnés annuels</span>
          </div>
          <p className="font-heading text-3xl font-bold text-heading">{stats.annualActive}</p>
          <p className="text-xs text-muted mt-1">{mrrAnnual.toFixed(2)} €/mois</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-muted">Achats unitaires</span>
          </div>
          <p className="font-heading text-3xl font-bold text-heading">{stats.totalPurchases}</p>
          <p className="text-xs text-muted mt-1">{stats.purchaseRevenue.toFixed(2)} € au total</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-muted">MRR total</span>
          </div>
          <p className="font-heading text-3xl font-bold text-heading">{mrrTotal.toFixed(2)} €</p>
          <p className="text-xs text-muted mt-1">estimé</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary/20 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("subscriptions")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            tab === "subscriptions"
              ? "bg-card text-heading shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          Abonnements ({subscriptions.length})
        </button>
        <button
          onClick={() => setTab("purchases")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
            tab === "purchases"
              ? "bg-card text-heading shadow-sm"
              : "text-muted hover:text-text"
          }`}
        >
          Achats ({purchases.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Chargement...</div>
      ) : tab === "subscriptions" ? (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {subscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted">Aucun abonnement</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-primary/20">
                    <th className="text-left p-4 text-sm font-medium text-heading">Utilisateur</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Plan</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Statut</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Fin de période</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-primary/10 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-heading">{sub.user.name || "—"}</p>
                        <p className="text-xs text-muted">{sub.user.email}</p>
                      </td>
                      <td className="p-4">
                        <Badge variant={sub.plan === "ANNUAL" ? "premium" : "default"}>
                          {planLabels[sub.plan]}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={statusVariants[sub.status] || "warning"}>
                          {statusLabels[sub.status] || sub.status}
                        </Badge>
                        {sub.cancelAtPeriodEnd && (
                          <span className="text-xs text-red-500 ml-2">Annulation prévue</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-text">
                        {new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4 text-sm text-muted">
                        {new Date(sub.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {purchases.length === 0 ? (
            <div className="text-center py-12 text-muted">Aucun achat</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-primary/20">
                    <th className="text-left p-4 text-sm font-medium text-heading">Utilisateur</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Article</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Montant</th>
                    <th className="text-left p-4 text-sm font-medium text-heading">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {purchases.map((purchase) => (
                    <tr key={purchase.id} className="hover:bg-primary/10 transition-colors">
                      <td className="p-4">
                        <p className="font-medium text-heading">{purchase.user.name || "—"}</p>
                        <p className="text-xs text-muted">{purchase.user.email}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-heading">
                          {purchase.course?.title || purchase.formation?.title || "—"}
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge variant={purchase.formation ? "premium" : "default"}>
                          {purchase.formation ? "Formation" : "Cours"}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm font-medium text-heading">
                        {purchase.amount.toFixed(2)} €
                      </td>
                      <td className="p-4 text-sm text-muted">
                        {new Date(purchase.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

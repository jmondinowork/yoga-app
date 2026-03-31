"use client";

import { useState, useEffect } from "react";
import { CreditCard, Users, ShoppingBag, TrendingUp, BookOpen, Video, Clock } from "lucide-react";
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
  expiresAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
  course: { id: string; title: string; slug: string } | null;
  formation: { id: string; title: string; slug: string } | null;
}

interface Stats {
  monthlyActive: number;
  annualActive: number;
  totalFormationPurchases: number;
  formationRevenue: number;
  totalCourseRentals: number;
  courseRentalRevenue: number;
  totalRevenue: number;
}

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

type Tab = "monthly" | "annual" | "formations" | "rentals";

export default function AdminRevenusPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [formationPurchases, setFormationPurchases] = useState<Purchase[]>([]);
  const [courseRentals, setCourseRentals] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<Stats>({
    monthlyActive: 0, annualActive: 0,
    totalFormationPurchases: 0, formationRevenue: 0,
    totalCourseRentals: 0, courseRentalRevenue: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("monthly");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/admin/subscriptions");
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setFormationPurchases(data.formationPurchases || []);
        setCourseRentals(data.courseRentals || []);
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

  const monthlySubs = subscriptions.filter(s => s.plan === "MONTHLY");
  const annualSubs = subscriptions.filter(s => s.plan === "ANNUAL");

  const mrrMonthly = stats.monthlyActive * 22;
  const mrrAnnual = stats.annualActive * (200 / 12);
  const mrrTotal = mrrMonthly + mrrAnnual;

  const isRentalActive = (rental: Purchase) => {
    if (!rental.expiresAt) return true;
    return new Date(rental.expiresAt) > new Date();
  };

  const tabItems: { key: Tab; label: string; count: number }[] = [
    { key: "monthly", label: "Mensuels", count: monthlySubs.length },
    { key: "annual", label: "Annuels", count: annualSubs.length },
    { key: "formations", label: "Formations", count: formationPurchases.length },
    { key: "rentals", label: "Locations", count: courseRentals.length },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Revenus
        </h1>
        <p className="text-muted">Abonnements, achats de formations et locations de cours</p>
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
              <BookOpen className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-muted">Achats formations</span>
          </div>
          <p className="font-heading text-3xl font-bold text-heading">{stats.totalFormationPurchases}</p>
          <p className="text-xs text-muted mt-1">{stats.formationRevenue.toFixed(2)} € au total</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm text-muted">MRR total</span>
          </div>
          <p className="font-heading text-3xl font-bold text-heading">{mrrTotal.toFixed(2)} €</p>
          <p className="text-xs text-muted mt-1">+ {stats.totalRevenue.toFixed(2)} € en achats/locations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-primary/20 rounded-xl p-1 w-fit">
        {tabItems.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              tab === t.key
                ? "bg-card text-heading shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted">Chargement...</div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {/* Tab: Abonnements mensuels */}
          {tab === "monthly" && (
            monthlySubs.length === 0 ? (
              <div className="text-center py-12 text-muted">Aucun abonnement mensuel</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-primary/20">
                      <th className="text-left p-4 text-sm font-medium text-heading">Utilisateur</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Statut</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Fin de période</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {monthlySubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-primary/10 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-heading">{sub.user.name || "—"}</p>
                          <p className="text-xs text-muted">{sub.user.email}</p>
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
            )
          )}

          {/* Tab: Abonnements annuels */}
          {tab === "annual" && (
            annualSubs.length === 0 ? (
              <div className="text-center py-12 text-muted">Aucun abonnement annuel</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-primary/20">
                      <th className="text-left p-4 text-sm font-medium text-heading">Utilisateur</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Statut</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Fin de période</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Inscrit le</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {annualSubs.map((sub) => (
                      <tr key={sub.id} className="hover:bg-primary/10 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-heading">{sub.user.name || "—"}</p>
                          <p className="text-xs text-muted">{sub.user.email}</p>
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
            )
          )}

          {/* Tab: Achats formations */}
          {tab === "formations" && (
            formationPurchases.length === 0 ? (
              <div className="text-center py-12 text-muted">Aucun achat de formation</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-primary/20">
                      <th className="text-left p-4 text-sm font-medium text-heading">Utilisateur</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Formation</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Montant</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Date d&apos;achat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {formationPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-primary/10 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-heading">{p.user.name || "—"}</p>
                          <p className="text-xs text-muted">{p.user.email}</p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-purple-500" />
                            <span className="font-medium text-heading">{p.formation?.title || "—"}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-heading">
                          {p.amount.toFixed(2)} €
                        </td>
                        <td className="p-4 text-sm text-muted">
                          {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* Tab: Locations cours */}
          {tab === "rentals" && (
            courseRentals.length === 0 ? (
              <div className="text-center py-12 text-muted">Aucune location de cours</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-primary/20">
                      <th className="text-left p-4 text-sm font-medium text-heading">Utilisateur</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Cours</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Montant</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Statut</th>
                      <th className="text-left p-4 text-sm font-medium text-heading">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courseRentals.map((r) => {
                      const active = isRentalActive(r);
                      return (
                        <tr key={r.id} className="hover:bg-primary/10 transition-colors">
                          <td className="p-4">
                            <p className="font-medium text-heading">{r.user.name || "—"}</p>
                            <p className="text-xs text-muted">{r.user.email}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Video className="w-4 h-4 text-amber-500" />
                              <span className="font-medium text-heading">{r.course?.title || "—"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm font-medium text-heading">
                            {r.amount.toFixed(2)} €
                          </td>
                          <td className="p-4">
                            {active ? (
                              <Badge variant="success">
                                <Clock className="w-3 h-3 mr-1" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="warning">Expiré</Badge>
                            )}
                            {r.expiresAt && active && (
                              <p className="text-xs text-muted mt-1">
                                Expire le {new Date(r.expiresAt).toLocaleDateString("fr-FR", {
                                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                })}
                              </p>
                            )}
                          </td>
                          <td className="p-4 text-sm text-muted">
                            {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

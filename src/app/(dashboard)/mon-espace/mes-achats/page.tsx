import type { Metadata } from "next";
import { CreditCard, Calendar, Download, ArrowRight } from "lucide-react";
import Badge from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "Mes achats",
};

// Données de démo
const purchases = [
  {
    id: "1",
    type: "course",
    title: "Yin Yoga — Relaxation profonde",
    amount: 9.99,
    date: "2026-01-15",
  },
  {
    id: "2",
    type: "formation",
    title: "Programme Débutant Complet",
    amount: 39.99,
    date: "2025-12-20",
  },
  {
    id: "3",
    type: "subscription",
    title: "Abonnement mensuel",
    amount: 19.99,
    date: "2026-02-01",
  },
  {
    id: "4",
    type: "course",
    title: "Hatha Yoga — Équilibre & Souplesse",
    amount: 12.99,
    date: "2025-11-10",
  },
];

const typeLabels = {
  course: "Cours",
  formation: "Formation",
  subscription: "Abonnement",
};

const typeVariants = {
  course: "default" as const,
  formation: "premium" as const,
  subscription: "success" as const,
};

export default function MesAchatsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Mes achats
        </h1>
        <p className="text-muted">Historique de vos transactions et factures</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="font-heading text-2xl font-bold text-heading">82,96 €</p>
          <p className="text-xs text-muted">Total dépensé</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="font-heading text-2xl font-bold text-heading">4</p>
          <p className="text-xs text-muted">Transactions</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5 text-center">
          <p className="font-heading text-2xl font-bold text-heading">2</p>
          <p className="text-xs text-muted">Cours achetés</p>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-heading text-lg font-semibold text-heading">
            Transactions
          </h2>
        </div>
        <div className="divide-y divide-border">
          {purchases.map((purchase) => (
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
                    {purchase.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={typeVariants[purchase.type as keyof typeof typeVariants]}>
                      {typeLabels[purchase.type as keyof typeof typeLabels]}
                    </Badge>
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(purchase.date).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <p className="font-heading font-semibold text-heading">
                  {purchase.amount.toFixed(2)} €
                </p>
                <button className="text-muted hover:text-button transition-colors cursor-pointer" title="Télécharger la facture">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

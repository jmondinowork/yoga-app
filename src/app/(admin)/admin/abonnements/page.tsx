"use client";

import { DollarSign, Edit } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

export default function AdminAbonnementsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Gestion des abonnements
        </h1>
        <p className="text-muted">Configurez les plans et tarifs de votre plateforme</p>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: "À l'unité",
            description: "Chaque cours peut être vendu individuellement",
            priceLabel: "Variable",
            details: "Prix défini par cours dans la gestion des cours",
            active: true,
          },
          {
            name: "Abonnement mensuel",
            description: "Accès illimité renouvelé chaque mois",
            priceLabel: "19,99 €/mois",
            details: "342 abonnés actifs",
            active: true,
            stripeId: "price_xxxxx_monthly",
          },
          {
            name: "Abonnement annuel",
            description: "Accès illimité avec 25% de réduction",
            priceLabel: "14,99 €/mois (179,88 €/an)",
            details: "128 abonnés actifs",
            active: true,
            badge: "Meilleure offre",
            stripeId: "price_xxxxx_annual",
          },
        ].map((plan) => (
          <div
            key={plan.name}
            className="bg-card rounded-2xl border border-border p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-semibold text-heading">
                  {plan.name}
                </h3>
                {plan.badge && <Badge variant="premium" className="mt-1">{plan.badge}</Badge>}
              </div>
              <Badge variant={plan.active ? "success" : "warning"}>
                {plan.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
            <p className="text-sm text-text">{plan.description}</p>
            <div>
              <p className="font-heading text-2xl font-bold text-heading">
                {plan.priceLabel}
              </p>
              <p className="text-xs text-muted mt-1">{plan.details}</p>
            </div>
            {plan.stripeId && (
              <p className="text-xs text-muted font-mono">Stripe: {plan.stripeId}</p>
            )}
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="w-4 h-4" />
              Modifier
            </Button>
          </div>
        ))}
      </div>

      {/* Stripe sync info */}
      <div className="bg-accent-light/20 rounded-2xl border border-button/20 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-button" />
          <h2 className="font-heading text-xl font-semibold text-heading">
            Intégration Stripe
          </h2>
        </div>
        <p className="text-sm text-text">
          Les modifications de prix doivent être synchronisées avec votre dashboard Stripe.
          Modifiez les prix dans Stripe, puis mettez à jour les Price IDs dans vos variables d&apos;environnement.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl">
          <Input
            id="monthlyPriceId"
            label="Stripe Monthly Price ID"
            placeholder="price_xxx"
            defaultValue="price_xxxxx_monthly"
          />
          <Input
            id="annualPriceId"
            label="Stripe Annual Price ID"
            placeholder="price_xxx"
            defaultValue="price_xxxxx_annual"
          />
        </div>
        <Button variant="outline" size="sm">
          Sauvegarder les modifications
        </Button>
      </div>

      {/* Revenue stats */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-heading text-xl font-semibold text-heading mb-4">
          Aperçu des revenus
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { label: "Mensuel actifs", value: "342", revenue: "6 838 €/mois" },
            { label: "Annuels actifs", value: "128", revenue: "23 025 €/an" },
            { label: "Achats uniques", value: "567", revenue: "5 670 €" },
            { label: "MRR total", value: "8 756 €", revenue: "estimé" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-primary/10 rounded-xl">
              <p className="font-heading text-2xl font-bold text-heading">{stat.value}</p>
              <p className="text-sm text-text font-medium">{stat.label}</p>
              <p className="text-xs text-muted">{stat.revenue}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

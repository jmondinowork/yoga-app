"use client";

import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import PurchaseButton from "@/components/courses/PurchaseButton";
import Link from "next/link";

interface PricingPlan {
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  badge?: string;
  planId?: string;
}

interface PricingTableProps {
  plans?: PricingPlan[];
}

const defaultPlans: PricingPlan[] = [
  {
    name: "Location 72h",
    price: 10,
    interval: "par cours",
    description: "Louez les cours qui vous intéressent",
    features: [
      "Accès 72h au cours loué",
      "Suivi de progression",
      "Accès depuis tous vos appareils",
      "Pas d'engagement",
    ],
  },
];

export default function PricingTable({ plans = defaultPlans }: PricingTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
      {plans.map((plan, index) => {
        const isPopular = !!plan.badge;

        return (
          <div
            key={index}
            className={`relative bg-card rounded-2xl border-2 p-6 sm:p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              isPopular
                ? "border-button shadow-md lg:scale-[1.02]"
                : "border-border"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="inline-block bg-heading text-background text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">
                  {plan.badge}
                </span>
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="font-heading text-2xl font-bold text-heading mb-2">
                {plan.name}
              </h3>
              <p className="text-sm text-muted mb-4">{plan.description}</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-heading text-5xl font-bold text-heading">
                  {plan.price}
                </span>
                <span className="text-lg text-muted">€</span>
                <span className="text-sm text-muted ml-1">/ {plan.interval}</span>
              </div>
              {plan.name === "Annuel" && (
                <p className="text-sm text-button mt-2 font-medium">
                  soit {((plan.price / 12)).toFixed(2).replace(".", ",")} €/mois
                </p>
              )}
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-button shrink-0 mt-0.5" />
                  <span className="text-sm text-text">{feature}</span>
                </li>
              ))}
            </ul>

            {plan.planId ? (
              <PurchaseButton
                type="subscription"
                planId={plan.planId}
                variant={isPopular ? "primary" : "outline"}
                className="w-full"
                size="lg"
              >
                Commencer
              </PurchaseButton>
            ) : (
              <Link href="/cours">
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  Parcourir les cours
                </Button>
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

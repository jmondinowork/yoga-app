import { Check } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Link from "next/link";

interface PricingPlan {
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  badge?: string;
  priceId?: string;
}

interface PricingTableProps {
  plans?: PricingPlan[];
}

const defaultPlans: PricingPlan[] = [
  {
    name: "À l'unité",
    price: 9.99,
    interval: "par cours",
    description: "Achetez les cours qui vous intéressent",
    features: [
      "Accès illimité au cours acheté",
      "Suivi de progression",
      "Accès depuis tous vos appareils",
      "Pas d'engagement",
    ],
  },
  {
    name: "Mensuel",
    price: 19.99,
    interval: "par mois",
    description: "Accès illimité à tous les cours",
    features: [
      "Accès à tous les cours",
      "Nouvelles vidéos chaque semaine",
      "Suivi de progression",
      "Annulation à tout moment",
    ],
  },
  {
    name: "Annuel",
    price: 14.99,
    interval: "par mois",
    description: "Le meilleur tarif — économisez 25%",
    features: [
      "Tout le plan mensuel",
      "Économisez 25%",
      "Accès prioritaire aux nouveautés",
      "Contenus exclusifs",
    ],
    badge: "Meilleure offre",
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
            className={`relative bg-card rounded-2xl border-2 p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
              isPopular
                ? "border-button shadow-md scale-[1.02]"
                : "border-border"
            }`}
          >
            {plan.badge && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <Badge variant="premium" className="px-4 py-1 text-sm font-semibold bg-button text-white">
                  {plan.badge}
                </Badge>
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
                  soit {(plan.price * 12).toFixed(0)} €/an
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

            <Link href="/inscription">
              <Button
                variant={isPopular ? "primary" : "outline"}
                className="w-full"
                size="lg"
              >
                {plan.name === "À l'unité" ? "Parcourir les cours" : "Commencer"}
              </Button>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

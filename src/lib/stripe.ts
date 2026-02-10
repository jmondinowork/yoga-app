import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Exporter aussi directement pour la compatibilité
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = [
  {
    id: "monthly",
    name: "Mensuel",
    price: 19.99,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    interval: "month" as const,
    description: "Accès illimité à tous les cours",
    features: [
      "Accès à tous les cours",
      "Nouvelles vidéos chaque semaine",
      "Suivi de progression",
      "Annulation à tout moment",
    ],
  },
  {
    id: "annual",
    name: "Annuel",
    price: 14.99,
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
    interval: "year" as const,
    description: "Le meilleur tarif — économisez 25%",
    features: [
      "Tout le plan mensuel",
      "Économisez 25%",
      "Accès prioritaire aux nouveautés",
      "Contenus exclusifs",
    ],
    badge: "Meilleure offre",
  },
] as const;

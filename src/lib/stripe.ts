import Stripe from "stripe";

// Mode simulation : actif quand la clé Stripe n'est pas configurée
export const SIMULATE_PAYMENTS =
  !process.env.STRIPE_SECRET_KEY || process.env.SIMULATE_PAYMENTS === "true";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (SIMULATE_PAYMENTS) {
    throw new Error("Stripe n'est pas configuré. Mode simulation actif.");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return _stripe;
}

// Proxy qui forward vers l'instance Stripe (uniquement en mode réel)
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
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
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
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || "",
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

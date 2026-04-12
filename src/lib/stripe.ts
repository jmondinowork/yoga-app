import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

// Mode démo : actif quand STRIPE_DEMO=true (simuler les paiements sans appeler Stripe)
if (process.env.NODE_ENV === "production" && process.env.STRIPE_DEMO === "true") {
  throw new Error("STRIPE_DEMO=true est interdit en production !");
}
export const SIMULATE_PAYMENTS = process.env.STRIPE_DEMO === "true";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (SIMULATE_PAYMENTS) {
    throw new Error("Stripe n'est pas configuré. Mode simulation actif (STRIPE_DEMO=true).");
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquante. Configurez la variable d'environnement ou activez STRIPE_DEMO=true.");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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

// Métadonnées statiques des plans (features, descriptions — ne changent pas avec le prix)
const PLAN_METADATA: Record<string, { description: string; features: string[]; badge?: string }> = {
  monthly: {
    description: "Accès illimité à tous les cours",
    features: [
      "Accès à tous les cours",
      "Nouvelles vidéos chaque semaine",
      "Suivi de progression",
      "Annulation à tout moment",
    ],
  },
  annual: {
    description: "Le meilleur tarif",
    features: [
      "Tout le plan mensuel",
      "Économisez 25%",
      "Accès prioritaire aux nouveautés",
      "Contenus exclusifs",
    ],
    badge: "Meilleure offre",
  },
};

// Fallback si la DB n'est pas accessible
export const PLANS_FALLBACK = [
  {
    id: "monthly",
    name: "Mensuel",
    price: 22,
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
    interval: "month" as const,
    ...PLAN_METADATA.monthly,
  },
  {
    id: "annual",
    name: "Annuel",
    price: 200,
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID || "",
    interval: "year" as const,
    ...PLAN_METADATA.annual,
  },
];

export type Plan = typeof PLANS_FALLBACK[number];

/** Récupère les plans tarifaires depuis la DB (avec fallback env vars) */
export async function getPlans(): Promise<Plan[]> {
  try {
    const dbPlans = await prisma.pricingPlan.findMany({
      orderBy: { slug: "asc" },
    });
    if (dbPlans.length > 0) {
      return dbPlans.map((p) => ({
        id: p.slug,
        name: p.name,
        price: p.price,
        priceId: p.stripePriceId,
        interval: p.slug === "annual" ? ("year" as const) : ("month" as const),
        ...(PLAN_METADATA[p.slug] || { description: "", features: [] }),
      }));
    }
  } catch {
    // DB pas accessible, fallback
  }
  return PLANS_FALLBACK;
}

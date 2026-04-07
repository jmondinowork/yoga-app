import type { Metadata } from "next";
import TarifsClient from "@/components/pricing/TarifsClient";
import Accordion from "@/components/ui/Accordion";
import { getContents, getContent } from "@/lib/content";

export const revalidate = 120;

const defaultPricingFaq = [
  {
    question: "Quelle est la différence entre les cours et les formations ?",
    answer: "Les cours vidéo sont des séances individuelles accessibles en location 72h ou en illimité via l'abonnement. Les formations sont des programmes complets avec vidéos exclusives, livret PDF et un accompagnement personnalisé d'un an avec Mathilde Torrez. Les formations sont disponibles uniquement à l'achat.",
  },
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Oui, vous pouvez passer d'un plan mensuel à annuel (ou inversement) à tout moment. Le changement prendra effet à la fin de votre période de facturation en cours.",
  },
  {
    question: "L'abonnement inclut-il les formations ?",
    answer: "Non, l'abonnement donne accès à l'ensemble des cours vidéo uniquement. Les formations, qui incluent un accompagnement personnalisé avec Mathilde Torrez, sont disponibles à l'achat séparément.",
  },
  {
    question: "Comment fonctionne l'annulation ?",
    answer: "Vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel. Vous conserverez l'accès jusqu'à la fin de votre période payée.",
  },
  {
    question: "Combien de temps dure l'accès à un cours loué ?",
    answer: "Chaque location vous donne accès au cours pendant 72h à compter du paiement. Vous pouvez le revoir autant de fois que vous le souhaitez pendant cette période. Pour un accès illimité, optez pour l'abonnement.",
  },
  {
    question: "Y a-t-il un engagement minimum ?",
    answer: "Non, aucun engagement. Le plan mensuel se renouvelle chaque mois et peut être annulé à tout moment. L'abonnement annuel est facturé en une fois pour l'année.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre partenaire de paiement sécurisé Stripe.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const c = await getContents(["seo_pricing_title", "seo_pricing_description", "seo_pricing_keywords", "seo_pricing_og_title", "seo_pricing_og_description"]);
  const title = c["seo_pricing_title"] ?? "Tarifs";
  const description = c["seo_pricing_description"] ?? "Découvrez nos formules d'abonnement et nos tarifs de location de cours. Trouvez le plan qui vous convient.";
  return {
    title,
    description,
    ...(c["seo_pricing_keywords"] ? { keywords: c["seo_pricing_keywords"].split(",").map((k: string) => k.trim()) } : {}),
    openGraph: { title: c["seo_pricing_og_title"] || title, description: c["seo_pricing_og_description"] || description },
  };
}

export default async function TarifsPage() {
  const c = await getContents(["pricing_heading", "pricing_description"]);
  const faqRaw = await getContent("faq_pricing", "[]");
  let pricingFaq: { question: string; answer: string }[];
  try {
    const parsed = JSON.parse(faqRaw);
    pricingFaq = Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultPricingFaq;
  } catch {
    pricingFaq = defaultPricingFaq;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
          {c["pricing_heading"] ?? "Nos Tarifs"}
        </h1>
        <p className="text-lg text-text max-w-2xl mx-auto">
          {c["pricing_description"] ?? "Choisissez la formule qui vous convient. Location à l\u2019unité ou abonnement illimité — à vous de décider."}
        </p>
      </div>

      {/* Tabs + contenu */}
      <TarifsClient />

      {/* FAQ */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="font-heading text-3xl font-bold text-heading text-center mb-10">
          Questions sur les tarifs
        </h2>
        <Accordion items={pricingFaq} />
      </div>
    </div>
  );
}

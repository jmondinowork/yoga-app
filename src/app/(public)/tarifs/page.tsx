import type { Metadata } from "next";
import PricingTable from "@/components/pricing/PricingTable";
import Accordion from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Découvrez nos formules d'abonnement et nos tarifs de cours à l'unité. Trouvez le plan qui vous convient.",
};

const pricingFaq = [
  {
    question: "Puis-je changer de plan à tout moment ?",
    answer: "Oui, vous pouvez passer d'un plan mensuel à annuel (ou inversement) à tout moment. Le changement prendra effet à la fin de votre période de facturation en cours.",
  },
  {
    question: "Comment fonctionne l'annulation ?",
    answer: "Vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel. Vous conserverez l'accès jusqu'à la fin de votre période payée.",
  },
  {
    question: "Les cours achetés à l'unité expirent-ils ?",
    answer: "Non ! Un cours acheté à l'unité vous appartient à vie. Vous pouvez le revoir autant de fois que vous le souhaitez.",
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

export default function TarifsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="font-heading text-4xl lg:text-5xl font-bold text-heading mb-4">
          Nos Tarifs
        </h1>
        <p className="text-lg text-text max-w-2xl mx-auto">
          Choisissez la formule qui vous convient. Cours à l&apos;unité ou
          abonnement illimité — à vous de décider.
        </p>
      </div>

      {/* Pricing Table */}
      <PricingTable />

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

// Usage: node --env-file=.env.local --experimental-strip-types seed-content.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const content: Record<string, string> = {
  // ─── Homepage Hero ───
  homepage_hero_badge: "Nouveaux cours chaque semaine",
  homepage_hero_title: "Trouvez votre équilibre intérieur",
  homepage_hero_subtitle:
    "Des cours de yoga en ligne pour tous les niveaux. Pratiquez à votre rythme, où que vous soyez, avec des séances guidées par des professionnels passionnés.",

  // ─── Homepage À propos ───
  homepage_about_label: "À propos",
  homepage_about_heading: "Passionnée de yoga, je partage ma pratique",
  homepage_about_text:
    "Depuis plus de 10 ans, le yoga a transformé ma vie. Formée auprès des plus grands maîtres, je vous propose des cours accessibles qui allient tradition et modernité.\n\nMon approche est bienveillante et adaptée à chaque niveau. Que vous soyez débutant ou pratiquant confirmé, vous trouverez des séances qui vous correspondent.",
  homepage_about_stat_1: "50+ Cours disponibles",
  homepage_about_stat_2: "2k+ Élèves actifs",
  homepage_about_stat_3: "4.9 Note moyenne",

  // ─── Homepage Comment ça marche ───
  homepage_how_label: "Simple & rapide",
  homepage_how_heading: "Comment ça marche ?",
  homepage_how_step_1_title: "Créez votre compte",
  homepage_how_step_1_desc:
    "Inscription gratuite en quelques secondes. Connectez-vous avec Google ou votre email.",
  homepage_how_step_2_title: "Choisissez votre cours",
  homepage_how_step_2_desc:
    "Parcourez notre catalogue, filtrez par niveau, thème ou durée. Trouvez le cours parfait pour vous.",
  homepage_how_step_3_title: "Pratiquez & progressez",
  homepage_how_step_3_desc:
    "Suivez vos cours à votre rythme, suivez votre progression et atteignez vos objectifs.",

  // ─── Homepage CTA ───
  homepage_cta_heading: "Prêt(e) à commencer votre voyage ?",
  homepage_cta_subtitle:
    "Rejoignez des milliers de pratiquants et commencez aujourd'hui votre transformation. Découvrez nos cours dès maintenant.",

  // ─── Pages headers ───
  courses_heading: "Nos Cours",
  courses_description: "Explorez notre catalogue complet de cours de yoga en ligne. Filtrez par thème et trouvez la séance qui vous convient.",
  formations_heading: "Formations",
  formations_description: "Des programmes exclusifs avec vidéos, livrets PDF et un suivi personnalisé.",
  pricing_heading: "Nos Tarifs",
  pricing_description: "Choisissez la formule qui vous convient. Location à l\u2019unité ou abonnement illimité — à vous de décider.",

  // ─── FAQ Homepage ───
  faq_homepage: JSON.stringify([
    {
      question: "Ai-je besoin d'expérience pour commencer ?",
      answer:
        "Absolument pas ! Nos cours sont adaptés à tous les niveaux. Chaque vidéo indique clairement le niveau requis et vous guide pas à pas. Commencez par les cours « Débutant » et progressez à votre rythme.",
    },
    {
      question: "Comment fonctionne l'abonnement ?",
      answer:
        "L'abonnement vous donne un accès illimité à tous les cours vidéo (hors formations). Vous pouvez choisir un abonnement mensuel ou annuel (avec 24% de réduction). Vous pouvez annuler à tout moment.",
    },
    {
      question: "Puis-je accéder à un cours sans m'abonner ?",
      answer:
        "Oui ! Chaque cours peut être loué individuellement pour 72h. C'est idéal si vous ne souhaitez suivre que quelques cours spécifiques sans engagement.",
    },
    {
      question: "Sur quels appareils puis-je regarder les cours ?",
      answer:
        "Vous pouvez accéder aux cours depuis n'importe quel appareil : ordinateur, tablette ou smartphone. Le site est entièrement responsive.",
    },
    {
      question: "Y a-t-il une période d'essai ?",
      answer:
        "Nous proposons un large catalogue de cours que vous pouvez découvrir sur la page cours. Pour accéder aux contenus, créez un compte et découvrez nos offres d'abonnement ou louez un cours à l'unité (72h d'accès).",
    },
  ]),

  // ─── FAQ Tarifs ───
  faq_pricing: JSON.stringify([
    {
      question: "Quelle est la différence entre les cours et les formations ?",
      answer:
        "Les cours vidéo sont des séances individuelles accessibles en location 72h ou en illimité via l'abonnement. Les formations sont des programmes complets avec vidéos exclusives, livret PDF et un suivi personnalisé d'un an avec Mathilde Torrez. Les formations sont disponibles uniquement à l'achat.",
    },
    {
      question: "Puis-je changer de plan à tout moment ?",
      answer:
        "Oui, vous pouvez passer d'un plan mensuel à annuel (ou inversement) à tout moment. Le changement prendra effet à la fin de votre période de facturation en cours.",
    },
    {
      question: "L'abonnement inclut-il les formations ?",
      answer:
        "Non, l'abonnement donne accès à l'ensemble des cours vidéo uniquement. Les formations, qui incluent un suivi personnalisé avec Mathilde Torrez, sont disponibles à l'achat séparément.",
    },
    {
      question: "Comment fonctionne l'annulation ?",
      answer:
        "Vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel. Vous conserverez l'accès jusqu'à la fin de votre période payée.",
    },
    {
      question: "Combien de temps dure l'accès à un cours loué ?",
      answer:
        "Chaque location vous donne accès au cours pendant 72h à compter du paiement. Vous pouvez le revoir autant de fois que vous le souhaitez pendant cette période. Pour un accès illimité, optez pour l'abonnement.",
    },
    {
      question: "Y a-t-il un engagement minimum ?",
      answer:
        "Non, aucun engagement. Le plan mensuel se renouvelle chaque mois et peut être annulé à tout moment. L'abonnement annuel est facturé en une fois pour l'année.",
    },
    {
      question: "Quels moyens de paiement acceptez-vous ?",
      answer:
        "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre partenaire de paiement sécurisé Stripe.",
    },
  ]),

  // ─── SEO ───
  seo_homepage_title: "Prana Motion Yoga — Cours de yoga en ligne",
  seo_homepage_description:
    "Découvrez le yoga à votre rythme. Des cours en ligne pour tous les niveaux : Vinyasa, Hatha, Yin, Méditation. Abonnement illimité ou location à l'unité.",
  seo_site_name: "Prana Motion Yoga",
  seo_site_url: "https://www.pranamotion.fr",
  seo_site_description: "Cours de yoga en ligne pour tous les niveaux. Vinyasa, Hatha, Yin, Méditation et plus.",
  seo_keywords: "yoga, cours en ligne, vinyasa, hatha, yin yoga, méditation, bien-être, relaxation, prana motion",
  seo_locale: "fr_FR",
  seo_robots_index: "true",
  seo_robots_follow: "true",
  seo_courses_title: "Tous les cours de yoga en ligne",
  seo_courses_description: "Explorez notre catalogue complet de cours de yoga en ligne.",
  seo_formations_title: "Formations yoga",
  seo_formations_description: "Des programmes exclusifs avec vidéos, livrets PDF et un suivi personnalisé.",
  seo_pricing_title: "Tarifs — Prana Motion Yoga",
  seo_pricing_description:
    "Découvrez nos formules d'abonnement et nos tarifs de location de cours. Trouvez le plan qui vous convient.",
  seo_about_title: "À propos — Prana Motion Yoga",
  seo_about_description: "Découvrez l'histoire et les valeurs de Prana Motion Yoga.",

  // ─── Couleurs (valeurs par défaut) ───
  color_primary: "#F8E8C3",
  color_background: "#FFF9EE",
  color_heading: "#2B2A28",
  color_text: "#4B463A",
  color_button: "#0E7C78",
  color_button_text: "#FFFFFF",
  color_border: "#E8DCC8",
  color_card: "#FFFFFF",
  color_muted: "#8A8279",
  color_accent_light: "#E6F5F4",

  // ─── Typographie ───
  font_heading: "Cormorant Garamond",
  font_body: "DM Sans",
};

// Testimonials
const testimonials = [
  {
    name: "Sophie M.",
    content:
      "Je pratique le yoga depuis 6 mois avec Prana Motion Yoga et les résultats sont incroyables. Les cours sont parfaitement structurés et le suivi de progression me motive à continuer.",
    rating: 5,
    isVisible: true,
  },
  {
    name: "Thomas L.",
    content:
      "En tant que débutant, j'avais peur de ne pas comprendre les postures. Les cours sont très bien expliqués, avec un rythme adapté. Je recommande vivement !",
    rating: 5,
    isVisible: true,
  },
  {
    name: "Marie-Claire D.",
    content:
      "L'abonnement annuel est un excellent investissement. La variété des cours permet de ne jamais s'ennuyer et de progresser à son rythme.",
    rating: 5,
    isVisible: true,
  },
  {
    name: "Pierre R.",
    content:
      "Des séances de méditation exceptionnelles qui m'aident à gérer mon stress au quotidien. L'interface est belle et intuitive.",
    rating: 4,
    isVisible: true,
  },
];

async function main() {
  console.log("Seeding site content...\n");

  // Upsert all content entries
  let count = 0;
  for (const [key, value] of Object.entries(content)) {
    await prisma.siteContent.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    count++;
  }
  console.log(`  ✓ ${count} content entries seeded\n`);

  // Seed testimonials (only if none exist)
  const existingTestimonials = await prisma.testimonial.count();
  if (existingTestimonials === 0) {
    for (const t of testimonials) {
      await prisma.testimonial.create({ data: t });
    }
    console.log(`  ✓ ${testimonials.length} testimonials created\n`);
  } else {
    console.log(`  → ${existingTestimonials} testimonials already exist, skipping\n`);
  }

  console.log("Done!");
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

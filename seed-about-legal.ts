import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const content: Record<string, string> = {
  // About page
  about_hero_label: "À propos",
  about_hero_heading: "Bonjour, je suis votre professeure",
  about_hero_intro: "Passionnée de yoga depuis plus de 10 ans, j'ai dédié ma vie à cette pratique qui m'a transformée en profondeur. Aujourd'hui, je souhaite partager cette passion avec vous à travers des cours accessibles et bienveillants.",
  about_story_heading: "Mon histoire",
  about_story_text_1: "Tout a commencé lors d'un voyage en Inde, où j'ai découvert le yoga sous sa forme la plus authentique. Ce qui n'était au départ qu'une simple curiosité est devenu une véritable vocation.",
  about_story_text_2: "Après avoir obtenu ma certification RYT 500, j'ai enseigné dans plusieurs studios avant de créer cette plateforme en ligne. Mon objectif : rendre le yoga accessible à tous, partout, à tout moment.",
  about_story_text_3: "Ma philosophie d'enseignement repose sur la bienveillance, la progression naturelle et le respect du corps de chacun. Je crois que le yoga n'est pas une performance, mais un chemin personnel vers le bien-être.",
  about_values_heading: "Mes valeurs",
  about_value_1_title: "Bienveillance",
  about_value_1_desc: "Un espace sans jugement où chacun progresse à son rythme.",
  about_value_2_title: "Accessibilité",
  about_value_2_desc: "Des cours pour tous les niveaux, du débutant à l'avancé.",
  about_value_3_title: "Expertise",
  about_value_3_desc: "10+ ans d'expérience et une certification RYT 500.",
  about_value_4_title: "Authenticité",
  about_value_4_desc: "Un enseignement fidèle aux traditions yogiques.",

  // Legal templates
  legal_mentions: `## Éditeur du site

Prana Motion Yoga
[Nom et prénom ou raison sociale]
[Adresse postale]
[Numéro de téléphone]
[Adresse email]
[Numéro SIRET / SIREN]

## Hébergeur

Vercel Inc.
440 N Barranca Ave #4133
Covina, CA 91723, USA

## Propriété intellectuelle

L'ensemble du contenu de ce site (textes, images, vidéos, logos, etc.) est protégé par le droit d'auteur. Toute reproduction, représentation ou diffusion, en tout ou partie, du contenu de ce site sur quelque support ou par tout procédé que ce soit est interdite sans l'autorisation préalable écrite de l'éditeur.

## Données personnelles

Les informations recueillies sur ce site sont nécessaires pour le traitement de votre commande et la gestion de votre compte. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ce droit, contactez-nous à l'adresse email ci-dessus.

## Cookies

Ce site utilise des cookies techniques nécessaires au bon fonctionnement du site et à la gestion de votre session. Aucun cookie publicitaire ou de tracking n'est utilisé.`,

  legal_cgv: `## Article 1 — Objet

Les présentes Conditions Générales de Vente (CGV) régissent les ventes de cours de yoga en ligne, formations et abonnements proposés sur le site Prana Motion Yoga.

## Article 2 — Prix

Les prix sont indiqués en euros TTC. L'éditeur se réserve le droit de modifier ses prix à tout moment, les cours et formations étant facturés au prix en vigueur au moment de la commande.

## Article 3 — Abonnements

### 3.1 Abonnement mensuel
L'abonnement mensuel donne accès à l'ensemble des cours vidéo. Il est renouvelé automatiquement chaque mois et peut être résilié à tout moment depuis l'espace personnel.

### 3.2 Abonnement annuel
L'abonnement annuel donne accès à l'ensemble des cours vidéo pour une durée de 12 mois. Il est facturé en une seule fois.

## Article 4 — Location de cours

Chaque location donne accès au cours pendant 72 heures à compter du paiement. Le cours peut être visionné autant de fois que souhaité pendant cette période.

## Article 5 — Formations

Les formations sont vendues à l'unité et donnent accès au contenu (vidéos, livret PDF) pendant une durée d'un an à compter de l'achat.

## Article 6 — Droit de rétractation

Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contenus numériques fournis sur un support immatériel dont l'exécution a commencé avec votre accord.

## Article 7 — Paiement

Les paiements sont sécurisés par Stripe. Les moyens de paiement acceptés sont : Visa, Mastercard, American Express.

## Article 8 — Responsabilité

L'éditeur ne saurait être tenu responsable en cas de blessure survenue lors de la pratique du yoga. Il est recommandé de consulter un médecin avant de commencer toute activité physique.

## Article 9 — Droit applicable

Les présentes CGV sont soumises au droit français. En cas de litige, les tribunaux français seront compétents.`,

  legal_privacy: `## Collecte des données

Nous collectons les données suivantes lors de votre inscription et utilisation du site :
- Nom et prénom
- Adresse email
- Données de paiement (traitées par Stripe, non stockées sur nos serveurs)
- Données de progression (cours visionnés, temps de visionnage)

## Finalité du traitement

Vos données sont utilisées pour :
- La gestion de votre compte utilisateur
- Le traitement de vos commandes et abonnements
- L'envoi de notifications liées à votre compte
- L'amélioration de nos services

## Base légale

Le traitement de vos données repose sur :
- L'exécution du contrat (gestion du compte, commandes)
- Votre consentement (notifications marketing)

## Durée de conservation

Vos données sont conservées pendant toute la durée de votre compte. En cas de suppression de compte, vos données sont supprimées sous 30 jours, à l'exception des données nécessaires au respect de nos obligations légales (facturation).

## Vos droits

Conformément au RGPD, vous disposez des droits suivants :
- Droit d'accès à vos données
- Droit de rectification
- Droit à l'effacement
- Droit à la portabilité
- Droit d'opposition

Pour exercer ces droits, contactez-nous à [adresse email].

## Sous-traitants

Nous faisons appel aux sous-traitants suivants :
- **Stripe** : traitement des paiements (USA, certifié Privacy Shield)
- **Vercel** : hébergement du site (USA)
- **Neon** : base de données (EU)
- **Cloudflare R2** : stockage des vidéos (EU)
- **Resend** : envoi d'emails transactionnels

## Cookies

Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement du site (session d'authentification). Aucun cookie de tracking ou publicitaire n'est utilisé.

## Contact

Pour toute question relative à vos données personnelles, vous pouvez nous contacter à [adresse email].`,
};

async function main() {
  let count = 0;
  for (const [key, value] of Object.entries(content)) {
    await prisma.siteContent.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
    count++;
  }
  console.log(`✓ ${count} entries seeded`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

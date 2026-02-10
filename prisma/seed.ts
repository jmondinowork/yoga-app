import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // ─── Admin User ───
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yogaflow.fr' },
    update: {},
    create: {
      name: 'Sophie Martin',
      email: 'admin@yogaflow.fr',
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Admin créé:', admin.email);

  // ─── Demo User ───
  const user = await prisma.user.upsert({
    where: { email: 'demo@yogaflow.fr' },
    update: {},
    create: {
      name: 'Marie Dupont',
      email: 'demo@yogaflow.fr',
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Utilisateur démo créé:', user.email);

  // ─── Cours ───
  const coursesData = [
    {
      title: 'Salutation au Soleil – Flow Matinal',
      slug: 'salutation-au-soleil-flow-matinal',
      description:
        'Commencez votre journée avec cette séquence énergisante de Salutations au Soleil. Ce flow matinal de 20 minutes éveille le corps en douceur, stimule la circulation et prépare l\'esprit pour la journée. Idéal pour les débutants souhaitant établir une routine quotidienne.',
      duration: 20,
      level: 'BEGINNER' as const,
      theme: 'Vinyasa',
      isFree: true,
      isPublished: true,
      sortOrder: 1,
    },
    {
      title: 'Yoga Doux pour le Dos',
      slug: 'yoga-doux-pour-le-dos',
      description:
        'Soulagez les tensions dorsales avec cette séance de yoga thérapeutique. Des postures ciblées pour renforcer et assouplir la colonne vertébrale, soulager les douleurs lombaires et améliorer votre posture au quotidien.',
      duration: 30,
      level: 'BEGINNER' as const,
      theme: 'Hatha',
      price: 9.99,
      isFree: false,
      isPublished: true,
      sortOrder: 2,
    },
    {
      title: 'Vinyasa Flow Intermédiaire',
      slug: 'vinyasa-flow-intermediaire',
      description:
        'Un flow dynamique qui enchaîne les postures avec fluidité et synchronisation respiratoire. Ce cours développe force, souplesse et endurance tout en cultivant la conscience corporelle. Transitions créatives et variations pour progresser.',
      duration: 45,
      level: 'INTERMEDIATE' as const,
      theme: 'Vinyasa',
      price: 12.99,
      isFree: false,
      isPublished: true,
      sortOrder: 3,
    },
    {
      title: 'Yin Yoga – Lâcher Prise Profond',
      slug: 'yin-yoga-lacher-prise-profond',
      description:
        'Plongez dans la détente avec ce cours de Yin Yoga. Des postures tenues 3 à 5 minutes pour étirer les tissus conjonctifs en profondeur. Parfait pour compléter une pratique dynamique et relâcher le stress accumulé.',
      duration: 60,
      level: 'BEGINNER' as const,
      theme: 'Yin',
      price: 9.99,
      isFree: false,
      isPublished: true,
      sortOrder: 4,
    },
    {
      title: 'Power Yoga – Force & Équilibre',
      slug: 'power-yoga-force-equilibre',
      description:
        'Un cours intense axé sur les postures de force et d\'équilibre. Développez votre puissance musculaire, améliorez votre stabilité et dépassez vos limites dans cette séance exigeante mais accessible.',
      duration: 50,
      level: 'ADVANCED' as const,
      theme: 'Power Yoga',
      price: 14.99,
      isFree: false,
      isPublished: true,
      sortOrder: 5,
    },
    {
      title: 'Méditation Guidée – Pleine Conscience',
      slug: 'meditation-guidee-pleine-conscience',
      description:
        'Apprenez les fondamentaux de la méditation de pleine conscience. Cette séance guidée vous accompagne pas à pas dans l\'observation du souffle, des sensations corporelles et des pensées, pour cultiver calme et clarté intérieure.',
      duration: 15,
      level: 'BEGINNER' as const,
      theme: 'Méditation',
      isFree: true,
      isPublished: true,
      sortOrder: 6,
    },
    {
      title: 'Yoga Prénatal – Douceur & Soutien',
      slug: 'yoga-prenatal-douceur-soutien',
      description:
        'Séance adaptée pour les futures mamans à tous les trimestres. Renforcez le plancher pelvien, soulagez les inconforts de la grossesse et préparez-vous à l\'accouchement dans un espace bienveillant.',
      duration: 35,
      level: 'BEGINNER' as const,
      theme: 'Prénatal',
      price: 9.99,
      isFree: false,
      isPublished: true,
      sortOrder: 7,
    },
    {
      title: 'Ashtanga – Première Série',
      slug: 'ashtanga-premiere-serie',
      description:
        'Découvrez la première série d\'Ashtanga (Yoga Chikitsa). Ce cours traditionnel guide chaque posture avec les vinyasa correspondants, les drishtis et les bandhas. Un défi physique et mental pour les pratiquants engagés.',
      duration: 75,
      level: 'ADVANCED' as const,
      theme: 'Ashtanga',
      price: 14.99,
      isFree: false,
      isPublished: true,
      sortOrder: 8,
    },
    {
      title: 'Yoga du Soir – Relaxation Totale',
      slug: 'yoga-du-soir-relaxation-totale',
      description:
        'Libérez les tensions de la journée avec cette séance de yoga restauratif. Des postures douces soutenues par des accessoires, suivies d\'un yoga nidra (sommeil yogique) pour un endormissement facilité.',
      duration: 40,
      level: 'BEGINNER' as const,
      theme: 'Restauratif',
      price: 9.99,
      isFree: false,
      isPublished: true,
      sortOrder: 9,
    },
    {
      title: 'Inversions & Équilibres sur les Mains',
      slug: 'inversions-equilibres-mains',
      description:
        'Maîtrisez les postures inversées : Sirsasana, Pincha Mayurasana, Adho Mukha Vrksasana. Progressions détaillées, exercices préparatoires et techniques de sécurité pour pratiquer les inversions en toute confiance.',
      duration: 55,
      level: 'ADVANCED' as const,
      theme: 'Vinyasa',
      price: 14.99,
      isFree: false,
      isPublished: true,
      sortOrder: 10,
    },
    {
      title: 'Pranayama – L\'Art du Souffle',
      slug: 'pranayama-art-du-souffle',
      description:
        'Explorez les techniques respiratoires du yoga : Ujjayi, Nadi Shodhana, Kapalabhati, Bhramari. Apprenez à utiliser le souffle comme outil de régulation du système nerveux et de préparation à la méditation.',
      duration: 25,
      level: 'INTERMEDIATE' as const,
      theme: 'Pranayama',
      isFree: true,
      isPublished: true,
      sortOrder: 11,
    },
    {
      title: 'Yoga Flow pour les Hanches',
      slug: 'yoga-flow-hanches',
      description:
        'Libérez les tensions accumulées dans les hanches avec cette séquence ciblée. Ouvertures de hanches progressives, postures de pigeon et étirements profonds pour retrouver mobilité et légèreté.',
      duration: 35,
      level: 'INTERMEDIATE' as const,
      theme: 'Vinyasa',
      price: 12.99,
      isFree: false,
      isPublished: true,
      sortOrder: 12,
    },
  ];

  const courses = [];
  for (const data of coursesData) {
    const course = await prisma.course.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
    courses.push(course);
  }

  console.log(`✅ ${courses.length} cours créés`);

  // ─── Formations ───
  const formationsData = [
    {
      title: 'Fondamentaux du Yoga – Programme 30 Jours',
      slug: 'fondamentaux-yoga-30-jours',
      description:
        'Un programme complet de 30 jours pour construire des bases solides en yoga. De la respiration aux postures fondamentales, en passant par la méditation, ce parcours progressif vous accompagne pas à pas vers une pratique autonome et épanouissante.',
      price: 49.99,
      isPublished: true,
    },
    {
      title: 'Yoga Avancé – Maîtrise des Inversions',
      slug: 'yoga-avance-maitrise-inversions',
      description:
        'Perfectionnez votre pratique avec ce programme intensif dédié aux postures avancées. Inversions, équilibres, flexions arrière profondes : développez force, souplesse et confiance à travers des séquences progressives encadrées.',
      price: 69.99,
      isPublished: true,
    },
    {
      title: 'Yoga & Bien-être au Quotidien',
      slug: 'yoga-bien-etre-quotidien',
      description:
        'Intégrez le yoga dans votre vie de tous les jours avec ce programme pratique. Des séances courtes adaptées à chaque moment de la journée : énergie du matin, pause bureau, détente du soir. Inclut des conseils nutrition et lifestyle.',
      price: 39.99,
      isPublished: true,
    },
    {
      title: 'Formation Professeur de Yoga – Module 1',
      slug: 'formation-professeur-yoga-module-1',
      description:
        'Premier module de la formation certifiante pour devenir professeur de yoga. Anatomie, philosophie, pédagogie et méthodologie de l\'enseignement. 50 heures de contenu vidéo, supports PDF et examens pratiques inclus.',
      price: 299.99,
      isPublished: true,
    },
  ];

  const formations = [];
  for (const data of formationsData) {
    const formation = await prisma.formation.upsert({
      where: { slug: data.slug },
      update: data,
      create: data,
    });
    formations.push(formation);
  }

  console.log(`✅ ${formations.length} formations créées`);

  // ─── Associer les cours aux formations ───
  // Formation 1 : Fondamentaux (cours débutants)
  const fondamentauxCourses = courses.filter(
    (c) =>
      c.slug === 'salutation-au-soleil-flow-matinal' ||
      c.slug === 'yoga-doux-pour-le-dos' ||
      c.slug === 'meditation-guidee-pleine-conscience' ||
      c.slug === 'pranayama-art-du-souffle' ||
      c.slug === 'yoga-du-soir-relaxation-totale'
  );

  for (let i = 0; i < fondamentauxCourses.length; i++) {
    await prisma.formationCourse.upsert({
      where: {
        formationId_courseId: {
          formationId: formations[0].id,
          courseId: fondamentauxCourses[i].id,
        },
      },
      update: { sortOrder: i + 1 },
      create: {
        formationId: formations[0].id,
        courseId: fondamentauxCourses[i].id,
        sortOrder: i + 1,
      },
    });
  }

  // Formation 2 : Avancé (cours avancés + intermédiaires)
  const avanceCourses = courses.filter(
    (c) =>
      c.slug === 'vinyasa-flow-intermediaire' ||
      c.slug === 'power-yoga-force-equilibre' ||
      c.slug === 'ashtanga-premiere-serie' ||
      c.slug === 'inversions-equilibres-mains' ||
      c.slug === 'yoga-flow-hanches'
  );

  for (let i = 0; i < avanceCourses.length; i++) {
    await prisma.formationCourse.upsert({
      where: {
        formationId_courseId: {
          formationId: formations[1].id,
          courseId: avanceCourses[i].id,
        },
      },
      update: { sortOrder: i + 1 },
      create: {
        formationId: formations[1].id,
        courseId: avanceCourses[i].id,
        sortOrder: i + 1,
      },
    });
  }

  // Formation 3 : Bien-être (mix de cours doux)
  const bienEtreCourses = courses.filter(
    (c) =>
      c.slug === 'salutation-au-soleil-flow-matinal' ||
      c.slug === 'yin-yoga-lacher-prise-profond' ||
      c.slug === 'meditation-guidee-pleine-conscience' ||
      c.slug === 'yoga-du-soir-relaxation-totale' ||
      c.slug === 'pranayama-art-du-souffle' ||
      c.slug === 'yoga-prenatal-douceur-soutien'
  );

  for (let i = 0; i < bienEtreCourses.length; i++) {
    await prisma.formationCourse.upsert({
      where: {
        formationId_courseId: {
          formationId: formations[2].id,
          courseId: bienEtreCourses[i].id,
        },
      },
      update: { sortOrder: i + 1 },
      create: {
        formationId: formations[2].id,
        courseId: bienEtreCourses[i].id,
        sortOrder: i + 1,
      },
    });
  }

  // Formation 4 : Professeur (tous les cours)
  for (let i = 0; i < courses.length; i++) {
    await prisma.formationCourse.upsert({
      where: {
        formationId_courseId: {
          formationId: formations[3].id,
          courseId: courses[i].id,
        },
      },
      update: { sortOrder: i + 1 },
      create: {
        formationId: formations[3].id,
        courseId: courses[i].id,
        sortOrder: i + 1,
      },
    });
  }

  console.log('✅ Associations formations-cours créées');

  // ─── Témoignages ───
  const testimonialsData = [
    {
      name: 'Isabelle R.',
      content:
        'Yoga Flow a transformé ma pratique ! Les cours sont clairs, progressifs et la qualité vidéo est exceptionnelle. Je me sens accompagnée à chaque étape.',
      rating: 5,
    },
    {
      name: 'Thomas L.',
      content:
        'En tant que débutant, j\'avais peur de ne pas être à la hauteur. La formation 30 jours m\'a permis d\'avancer à mon rythme et aujourd\'hui le yoga fait partie de mon quotidien.',
      rating: 5,
    },
    {
      name: 'Camille D.',
      content:
        'Les cours de Yin Yoga sont une pure merveille. Après des journées stressantes au bureau, c\'est mon rituel bien-être. L\'abonnement annuel est vraiment avantageux.',
      rating: 5,
    },
    {
      name: 'Nicolas M.',
      content:
        'Le Power Yoga et le programme Inversions m\'ont permis de franchir un cap dans ma pratique. Des cours exigeants mais très bien expliqués. Je recommande !',
      rating: 4,
    },
    {
      name: 'Émilie P.',
      content:
        'J\'ai suivi les cours prénataux pendant toute ma grossesse. Sophie est bienveillante et attentive, ses cours m\'ont beaucoup aidée à me préparer à l\'accouchement.',
      rating: 5,
    },
    {
      name: 'Laurent B.',
      content:
        'Enfin une plateforme de yoga en français de qualité ! Les vidéos sont magnifiques et les explications très pédagogiques. Le rapport qualité-prix est imbattable.',
      rating: 5,
    },
  ];

  for (const data of testimonialsData) {
    await prisma.testimonial.create({ data });
  }

  console.log(`✅ ${testimonialsData.length} témoignages créés`);

  // ─── FAQ ───
  const faqData = [
    {
      question: 'Ai-je besoin d\'expérience préalable en yoga ?',
      answer:
        'Non, pas du tout ! Nos cours sont adaptés à tous les niveaux, du débutant complet au pratiquant avancé. Chaque cours indique clairement son niveau de difficulté. Nous recommandons la formation « Fondamentaux du Yoga – 30 Jours » pour bien démarrer.',
      sortOrder: 1,
    },
    {
      question: 'De quel matériel ai-je besoin ?',
      answer:
        'Un tapis de yoga suffit pour la plupart des cours. Pour le Yin Yoga et le yoga restauratif, des briques, une sangle et un bolster sont recommandés mais pas indispensables – des coussins et serviettes peuvent les remplacer.',
      sortOrder: 2,
    },
    {
      question: 'Puis-je annuler mon abonnement à tout moment ?',
      answer:
        'Oui, votre abonnement est sans engagement. Vous pouvez l\'annuler à tout moment depuis votre espace personnel. Votre accès reste actif jusqu\'à la fin de la période en cours.',
      sortOrder: 3,
    },
    {
      question: 'Les cours achetés à l\'unité sont-ils accessibles à vie ?',
      answer:
        'Oui ! Tout cours ou formation acheté à l\'unité vous appartient définitivement. Vous pouvez y accéder autant de fois que vous le souhaitez, à votre rythme.',
      sortOrder: 4,
    },
    {
      question: 'Comment fonctionne l\'abonnement ?',
      answer:
        'L\'abonnement vous donne un accès illimité à l\'ensemble de notre catalogue de cours et formations. Deux formules sont disponibles : mensuelle (19,99€/mois) ou annuelle (14,99€/mois, soit 179,88€/an). Vous pouvez changer de formule ou annuler à tout moment.',
      sortOrder: 5,
    },
    {
      question: 'Les cours sont-ils disponibles hors ligne ?',
      answer:
        'Pour le moment, les cours sont accessibles uniquement en streaming. Nous travaillons sur une fonctionnalité de téléchargement pour une utilisation hors ligne, qui sera disponible prochainement.',
      sortOrder: 6,
    },
    {
      question: 'Proposez-vous des cours en direct ?',
      answer:
        'Actuellement, tous nos cours sont pré-enregistrés pour vous offrir une flexibilité maximale. Des sessions live mensuelles avec questions/réponses sont prévues pour le futur.',
      sortOrder: 7,
    },
    {
      question: 'Comment contacter le support ?',
      answer:
        'Vous pouvez nous écrire à contact@yogaflow.fr ou utiliser le formulaire de contact sur notre site. Nous répondons sous 24 à 48 heures ouvrées.',
      sortOrder: 8,
    },
  ];

  for (const data of faqData) {
    await prisma.fAQ.create({ data });
  }

  console.log(`✅ ${faqData.length} FAQ créées`);

  // ─── Contenu du site ───
  const siteContentData = [
    {
      key: 'hero_title',
      value: 'Trouvez votre équilibre intérieur',
    },
    {
      key: 'hero_subtitle',
      value:
        'Découvrez des cours de yoga en ligne adaptés à tous les niveaux. Pratiquez où vous voulez, quand vous voulez.',
    },
    {
      key: 'about_title',
      value: 'Le yoga accessible à tous',
    },
    {
      key: 'about_text',
      value:
        'Yoga Flow est née de la passion de Sophie Martin, professeure certifiée depuis 15 ans. Notre mission : rendre le yoga accessible, authentique et transformateur, dans le confort de votre foyer.',
    },
    {
      key: 'footer_text',
      value:
        'Yoga Flow – Votre studio de yoga en ligne. Des cours de qualité pour une pratique authentique et bienveillante.',
    },
  ];

  for (const data of siteContentData) {
    await prisma.siteContent.upsert({
      where: { key: data.key },
      update: { value: data.value },
      create: data,
    });
  }

  console.log(`✅ ${siteContentData.length} contenus de site créés`);

  // ─── Progrès vidéo pour l'utilisateur démo ───
  const freeCourses = courses.filter((c) => c.isFree);
  for (const course of freeCourses) {
    await prisma.videoProgress.upsert({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId: course.id,
        },
      },
      update: {
        progress: Math.random() * 100,
        completed: Math.random() > 0.5,
      },
      create: {
        userId: user.id,
        courseId: course.id,
        progress: Math.random() * 100,
        completed: Math.random() > 0.5,
      },
    });
  }

  console.log('✅ Progrès vidéo démo créés');

  console.log('\n🎉 Seeding terminé avec succès !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

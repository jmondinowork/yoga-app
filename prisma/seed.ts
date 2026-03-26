import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  // ─── Admin User ───
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yogaflow.fr' },
    update: { password: hashedPassword },
    create: {
      name: 'Sophie Martin',
      email: 'admin@yogaflow.fr',
      password: hashedPassword,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Admin créé:', admin.email);

  // ─── Demo User ───
  const user = await prisma.user.upsert({
    where: { email: 'demo@yogaflow.fr' },
    update: { password: hashedPassword },
    create: {
      name: 'Marie Dupont',
      email: 'demo@yogaflow.fr',
      password: hashedPassword,
      role: 'USER',
      emailVerified: new Date(),
    },
  });

  console.log('✅ Utilisateur démo créé:', user.email);

  // ─── Nettoyage des anciennes données ───
  await prisma.formationVideoProgress.deleteMany();
  await prisma.videoProgress.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.formationVideo.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.course.deleteMany();
  await prisma.testimonial.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.siteContent.deleteMany();
  console.log('🗑️  Anciennes données nettoyées');

  // ─── Cours ───
  const coursesData = [
    {
      title: 'Morning Activation 1',
      slug: 'morning-activation-1',
      description: 'Réveillez votre corps et votre esprit avec cette séance matinale dynamique. Des mouvements fluides pour stimuler la circulation, éveiller les muscles et préparer une journée pleine d\'énergie.',
      duration: 20,
      level: 'BEGINNER' as const,
      theme: 'Vinyasa',
      price: 7.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 1,
      videoUrl: 'cours/morning-activation-1/video.mp4',
      thumbnail: 'cours/morning-activation-1/thumbnail.jpg',
    },
    {
      title: 'Morning Activation 2',
      slug: 'morning-activation-2',
      description: 'La suite de notre séance matinale best-seller. Des enchaînements plus variés pour approfondir votre routine du matin et cultiver une énergie durable.',
      duration: 25,
      level: 'BEGINNER' as const,
      theme: 'Vinyasa',
      price: 7.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 2,
      videoUrl: 'cours/morning-activation-2/video.mp4',
      thumbnail: 'cours/morning-activation-2/thumbnail.jpg',
    },
    {
      title: 'Abdos Profonds',
      slug: 'abdos-profonds',
      description: 'Séance ciblée pour renforcer la sangle abdominale en profondeur. Exercices de gainage, Navasana et variations de planche intégrés dans un flow dynamique.',
      duration: 30,
      level: 'INTERMEDIATE' as const,
      theme: 'Power Yoga',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 3,
      videoUrl: 'cours/abdos-profonds/video.mp4',
      thumbnail: 'cours/abdos-profonds/thumbnail.jpg',
    },
    {
      title: 'Postures Debout',
      slug: 'debouts',
      description: 'Maîtrisez les postures debout fondamentales du yoga. Virabhadrasana, Trikonasana, Parsvakonasana et leurs variations pour construire force et stabilité.',
      duration: 45,
      level: 'BEGINNER' as const,
      theme: 'Hatha',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 4,
      videoUrl: 'cours/debouts/video.mp4',
      thumbnail: 'cours/debouts/thumbnail.jpg',
    },
    {
      title: 'Postures Debout – Séance Courte',
      slug: 'debouts-court',
      description: 'Une version condensée de notre cours de postures debout. Idéal quand vous manquez de temps mais souhaitez travailler l\'ancrage et l\'équilibre.',
      duration: 25,
      level: 'BEGINNER' as const,
      theme: 'Hatha',
      price: 7.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 5,
      videoUrl: 'cours/debouts-court/video.mp4',
      thumbnail: 'cours/debouts-court/thumbnail.jpg',
    },
    {
      title: 'Postures Debout – Séance Longue',
      slug: 'debouts-long',
      description: 'Séance approfondie de postures debout avec des tenues prolongées et des variations avancées. Développez endurance, force et conscience corporelle.',
      duration: 60,
      level: 'INTERMEDIATE' as const,
      theme: 'Hatha',
      price: 12.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 6,
      videoUrl: 'cours/debouts-long/video.mp4',
      thumbnail: 'cours/debouts-long/thumbnail.jpg',
    },
    {
      title: 'Équilibre Émotionnel',
      slug: 'equilibre-emotionnel',
      description: 'Une séance thérapeutique alliant postures douces, respiration et méditation pour retrouver l\'équilibre émotionnel et apaiser le mental agité.',
      duration: 35,
      level: 'BEGINNER' as const,
      theme: 'Hatha',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 7,
      videoUrl: 'cours/equilibre-emotionnel/video.mp4',
      thumbnail: 'cours/equilibre-emotionnel/thumbnail.jpg',
    },
    {
      title: 'Integral Practice',
      slug: 'integral-practice',
      description: 'Pratique intégrale combinant asanas, pranayama et méditation dans une séance complète et équilibrée. L\'essence du yoga traditionnel en une session.',
      duration: 50,
      level: 'INTERMEDIATE' as const,
      theme: 'Hatha',
      price: 12.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 8,
      videoUrl: 'cours/integral-practice/video.mp4',
      thumbnail: 'cours/integral-practice/thumbnail.jpg',
    },
    {
      title: 'Lumière sur Laura',
      slug: 'lumiere-sur-laura',
      description: 'Séance spéciale avec Laura, notre professeure invitée. Découvrez son approche unique mêlant yoga dynamique et relaxation profonde.',
      duration: 15,
      level: 'BEGINNER' as const,
      theme: 'Vinyasa',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 9,
      videoUrl: 'cours/lumiere-sur-laura/video.mp4',
      thumbnail: 'cours/lumiere-sur-laura/thumbnail.jpg',
    },
    {
      title: 'Méditation des Souffles',
      slug: 'meditation-des-souffles',
      description: 'Méditation guidée centrée sur l\'observation et la maîtrise du souffle. Techniques de Pranayama doux intégrées à une pratique méditative profonde.',
      duration: 15,
      level: 'BEGINNER' as const,
      theme: 'Méditation',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 10,
      videoUrl: 'cours/meditation-des-souffles/video.mp4',
      thumbnail: 'cours/meditation-des-souffles/thumbnail.jpg',
    },
    {
      title: 'Méditation des Sourires',
      slug: 'meditation-des-sourires',
      description: 'Méditation de bienveillance et de joie utilisant la technique du sourire intérieur. Cultivez la gratitude et la douceur envers vous-même.',
      duration: 10,
      level: 'BEGINNER' as const,
      theme: 'Méditation',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 11,
      videoUrl: 'cours/meditation-des-sourires/video.mp4',
      thumbnail: 'cours/meditation-des-sourires/thumbnail.jpg',
    },
    {
      title: 'Ouverture des Hanches',
      slug: 'ouverture-des-hanches',
      description: 'Libérez les tensions accumulées dans les hanches avec cette séquence ciblée. Ouvertures progressives, postures de pigeon et étirements profonds pour retrouver mobilité et légèreté.',
      duration: 40,
      level: 'INTERMEDIATE' as const,
      theme: 'Hatha',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 12,
      videoUrl: 'cours/ouverture-des-hanches/video.mp4',
      thumbnail: 'cours/ouverture-des-hanches/thumbnail.jpg',
    },
    {
      title: 'Ouverture du Cœur',
      slug: 'ouverture-du-coeur',
      description: 'Séance centrée sur les backbends et l\'ouverture de la cage thoracique. Postures progressives pour ouvrir le cœur, libérer les émotions et améliorer la posture.',
      duration: 45,
      level: 'INTERMEDIATE' as const,
      theme: 'Hatha',
      price: 12.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 13,
      videoUrl: 'cours/ouverture-du-coeur/video.mp4',
      thumbnail: 'cours/ouverture-du-coeur/thumbnail.jpg',
    },
    {
      title: 'Postures Arrière 1',
      slug: 'postures-arrieres-1',
      description: 'Explorez les flexions arrière en toute sécurité. Bhujangasana, Shalabhasana et Dhanurasana avec un travail préparatoire complet pour protéger le dos.',
      duration: 50,
      level: 'INTERMEDIATE' as const,
      theme: 'Hatha',
      price: 12.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 14,
      videoUrl: 'cours/postures-arrieres-1/video.mp4',
      thumbnail: 'cours/postures-arrieres-1/thumbnail.jpg',
    },
    {
      title: 'Postures Arrière 2',
      slug: 'postures-arrieres-2',
      description: 'Approfondissez les backbends avec des postures plus avancées. Ustrasana, Urdhva Dhanurasana et Kapotasana avec des progressions détaillées.',
      duration: 45,
      level: 'ADVANCED' as const,
      theme: 'Hatha',
      price: 14.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 15,
      videoUrl: 'cours/postures-arrieres-2/video.mp4',
      thumbnail: 'cours/postures-arrieres-2/thumbnail.jpg',
    },
    {
      title: 'Postures Arrière & Cuisses',
      slug: 'postures-arrieres-cuisses',
      description: 'Séance combinant backbends et renforcement des cuisses. Un travail complet qui associe ouverture de la chaîne antérieure et puissance des jambes.',
      duration: 50,
      level: 'INTERMEDIATE' as const,
      theme: 'Hatha',
      price: 12.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 16,
      videoUrl: 'cours/postures-arrieres-cuisses/video.mp4',
      thumbnail: 'cours/postures-arrieres-cuisses/thumbnail.jpg',
    },
    {
      title: 'Postures Avant',
      slug: 'postures-avant',
      description: 'Explorez les flexions avant : Paschimottanasana, Janu Sirsasana, Upavista Konasana. Étirements profonds des ischio-jambiers et du bas du dos.',
      duration: 40,
      level: 'BEGINNER' as const,
      theme: 'Hatha',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 17,
      videoUrl: 'cours/postures-avant/video.mp4',
      thumbnail: 'cours/postures-avant/thumbnail.jpg',
    },
    {
      title: 'Postures Avant – Détente',
      slug: 'postures-avant-detente',
      description: 'Version douce et restaurative des flexions avant. Postures tenues plus longtemps avec supports pour un lâcher-prise profond et un étirement en douceur.',
      duration: 45,
      level: 'BEGINNER' as const,
      theme: 'Restauratif',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 18,
      videoUrl: 'cours/postures-avant-detente/video.mp4',
      thumbnail: 'cours/postures-avant-detente/thumbnail.jpg',
    },
    {
      title: 'Postures Avant – Séance du Soir',
      slug: 'postures-avant-soir',
      description: 'Flexions avant apaisantes pour le soir. Séance lente et méditative pour libérer les tensions de la journée et préparer un sommeil réparateur.',
      duration: 40,
      level: 'BEGINNER' as const,
      theme: 'Restauratif',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 19,
      videoUrl: 'cours/postures-avant-soir/video.mp4',
      thumbnail: 'cours/postures-avant-soir/thumbnail.jpg',
    },
    {
      title: 'Pranayama du Soir',
      slug: 'pranayama-du-soir',
      description: 'Séance de Pranayama apaisante pour le coucher. Techniques respiratoires calmantes pour ralentir le rythme cardiaque et faciliter l\'endormissement.',
      duration: 20,
      level: 'BEGINNER' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 20,
      videoUrl: 'cours/pranayama-du-soir/video.mp4',
      thumbnail: 'cours/pranayama-du-soir/thumbnail.jpg',
    },
    {
      title: 'Pranayama Intégral',
      slug: 'pranayama-integral',
      description: 'Séance complète de Pranayama combinant toutes les techniques : Ujjayi, Nadi Shodhana, Kapalabhati, Bhastrika. Pour pratiquants ayant déjà les bases.',
      duration: 45,
      level: 'INTERMEDIATE' as const,
      theme: 'Pranayama',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 21,
      videoUrl: 'cours/pranayama-integral/video.mp4',
      thumbnail: 'cours/pranayama-integral/thumbnail.jpg',
    },
    {
      title: 'Printemps Hatha',
      slug: 'printemps-hatha',
      description: 'Séance de Hatha Yoga aux énergies printanières. Postures revitalisantes, torsions purifiantes et respirations énergisantes pour accueillir le renouveau.',
      duration: 50,
      level: 'BEGINNER' as const,
      theme: 'Hatha',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 22,
      videoUrl: 'cours/printemps-hatha/video.mp4',
      thumbnail: 'cours/printemps-hatha/thumbnail.jpg',
    },
    {
      title: 'Renforcer les Bras',
      slug: 'renforcer-les-bras',
      description: 'Séance ciblée pour développer la force des bras et des épaules. Chaturanga, planches, équilibres sur les mains adaptés à votre niveau.',
      duration: 30,
      level: 'INTERMEDIATE' as const,
      theme: 'Power Yoga',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 23,
      videoUrl: 'cours/renforcer-les-bras/video.mp4',
      thumbnail: 'cours/renforcer-les-bras/thumbnail.jpg',
    },
    {
      title: 'Surya Namaskara 1',
      slug: 'surya-namaskara-1',
      description: 'Apprenez la Salutation au Soleil A pas à pas. Chaque posture est détaillée avec les alignements et la synchronisation respiratoire.',
      duration: 25,
      level: 'BEGINNER' as const,
      theme: 'Vinyasa',
      price: 7.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 24,
      videoUrl: 'cours/surya-namaskara-1/video.mp4',
      thumbnail: 'cours/surya-namaskara-1/thumbnail.jpg',
    },
    {
      title: 'Surya Namaskara 2',
      slug: 'surya-namaskara-2',
      description: 'La Salutation au Soleil B avec Virabhadrasana I. Progression naturelle après le module 1, enchaînements plus dynamiques.',
      duration: 30,
      level: 'BEGINNER' as const,
      theme: 'Vinyasa',
      price: 7.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 25,
      videoUrl: 'cours/surya-namaskara-2/video.mp4',
      thumbnail: 'cours/surya-namaskara-2/thumbnail.jpg',
    },
    {
      title: 'Surya Namaskara 3',
      slug: 'surya-namaskara-3',
      description: 'Variations créatives de Salutations au Soleil. Ajout de postures d\'équilibre, de torsions et de flexions latérales dans le flow.',
      duration: 25,
      level: 'INTERMEDIATE' as const,
      theme: 'Vinyasa',
      price: 9.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 26,
      videoUrl: 'cours/surya-namaskara-3/video.mp4',
      thumbnail: 'cours/surya-namaskara-3/thumbnail.jpg',
    },
    {
      title: 'Surya Namaskara 4',
      slug: 'surya-namaskara-4',
      description: 'Salutations au Soleil avancées avec des transitions fluides, des arm balances et des sauts. Pour pratiquants confirmés en quête de challenge.',
      duration: 30,
      level: 'ADVANCED' as const,
      theme: 'Vinyasa',
      price: 12.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 27,
      videoUrl: 'cours/surya-namaskara-4/video.mp4',
      thumbnail: 'cours/surya-namaskara-4/thumbnail.jpg',
    },
    {
      title: 'Surya Namaskara 5',
      slug: 'surya-namaskara-5',
      description: 'La session ultime de Salutations au Soleil. Flow intense intégrant toutes les variations apprises pour une pratique dynamique et méditative.',
      duration: 25,
      level: 'ADVANCED' as const,
      theme: 'Vinyasa',
      price: 12.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 28,
      videoUrl: 'cours/surya-namaskara-5/video.mp4',
      thumbnail: 'cours/surya-namaskara-5/thumbnail.jpg',
    },
    {
      title: 'Tutoriel Anuloma Viloma',
      slug: 'tutoriel-anuloma-viloma',
      description: 'Apprenez la respiration alternée Anuloma Viloma. Technique détaillée, placement des doigts, rythmes progressifs et bienfaits pour l\'équilibre nerveux.',
      duration: 15,
      level: 'BEGINNER' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 29,
      videoUrl: 'cours/tutoriel-anuloma-viloma/video.mp4',
      thumbnail: 'cours/tutoriel-anuloma-viloma/thumbnail.jpg',
    },
    {
      title: 'Tutoriel Bhramari',
      slug: 'tutoriel-bhramari',
      description: 'Découvrez Bhramari, le souffle de l\'abeille. Technique de vibration sonore, bienfaits sur le système nerveux et pratique guidée pas à pas.',
      duration: 12,
      level: 'BEGINNER' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 30,
      videoUrl: 'cours/tutoriel-bhramari/video.mp4',
      thumbnail: 'cours/tutoriel-bhramari/thumbnail.jpg',
    },
    {
      title: 'Tutoriel Chandra & Surya',
      slug: 'tutoriel-chandra-surya',
      description: 'Maîtrisez les souffles Chandra (lunaire) et Surya (solaire). Techniques de respiration par narine unique pour équilibrer vos énergies.',
      duration: 20,
      level: 'INTERMEDIATE' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 31,
      videoUrl: 'cours/tutoriel-chandra-surya/video.mp4',
      thumbnail: 'cours/tutoriel-chandra-surya/thumbnail.jpg',
    },
    {
      title: 'Tutoriel Kapalabhati',
      slug: 'tutoriel-kapalabhati',
      description: 'Le souffle de feu purifiant Kapalabhati. Technique, précautions, contre-indications et progressions pour une pratique sûre et efficace.',
      duration: 15,
      level: 'INTERMEDIATE' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 32,
      videoUrl: 'cours/tutoriel-kapalabhati/video.mp4',
      thumbnail: 'cours/tutoriel-kapalabhati/thumbnail.jpg',
    },
    {
      title: 'Tutoriel L\'Assise',
      slug: 'tutoriel-lassise',
      description: 'Guide complet des postures assises pour la méditation et le Pranayama. Sukhasana, Siddhasana, Padmasana et alternatives avec chaise.',
      duration: 12,
      level: 'BEGINNER' as const,
      theme: 'Tutoriel',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 33,
      videoUrl: 'cours/tutoriel-lassise/video.mp4',
      thumbnail: 'cours/tutoriel-lassise/thumbnail.jpg',
    },
    {
      title: 'Tutoriel Sitali',
      slug: 'tutoriel-sitali',
      description: 'Apprenez Sitali, la respiration rafraîchissante. Technique de la langue enroulée, variante Sitkari, et bienfaits pour le refroidissement du corps.',
      duration: 10,
      level: 'BEGINNER' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 34,
      videoUrl: 'cours/tutoriel-sitali/video.mp4',
      thumbnail: 'cours/tutoriel-sitali/thumbnail.jpg',
    },
    {
      title: 'Tutoriel Viloma Kumbhaka',
      slug: 'tutoriel-viloma-kumbhaka',
      description: 'Pranayama Viloma avec rétentions (Kumbhaka). Technique avancée de respiration fractionnée avec pauses inspiratoires et expiratoires.',
      duration: 15,
      level: 'ADVANCED' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 35,
      videoUrl: 'cours/tutoriel-viloma-kumbhaka/video.mp4',
      thumbnail: 'cours/tutoriel-viloma-kumbhaka/thumbnail.jpg',
    },
    {
      title: 'Tutoriel Viloma',
      slug: 'tutoriel-viloma',
      description: 'Apprenez la respiration Viloma (à contre-courant). Technique d\'inspiration et d\'expiration fractionnées pour développer le contrôle du souffle.',
      duration: 20,
      level: 'INTERMEDIATE' as const,
      theme: 'Pranayama',
      price: 5.99,
      includedInSubscription: true,
      isPublished: true,
      sortOrder: 36,
      videoUrl: 'cours/tutoriel-viloma/video.mp4',
      thumbnail: 'cours/tutoriel-viloma/thumbnail.jpg',
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
      title: 'Formation Pranayama',
      slug: 'formation-pranayama',
      description:
        'Formation complète dédiée à l\'art du Pranayama. Explorez les techniques respiratoires ancestrales du yoga : Nadi Shodhana, Kapalabhati, Bhastrika, Ujjayi et bien d\'autres. De la théorie à la pratique, ce parcours progressif vous guide vers une maîtrise profonde du souffle comme outil de transformation physique et mentale.',
      price: 49.99,
      bookletUrl: 'formations/formation-pranayama/guide.pdf',
      thumbnail: 'formations/formation-pranayama/thumbnail.jpg',
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

  // ─── Vidéos des formations ───

  // Formation Pranayama – 12 vidéos
  const pranayamaVideos = [
    { title: 'Bienvenue dans la Formation', description: 'Introduction à la formation : objectifs, structure du programme et conseils pour tirer le meilleur de votre apprentissage du Pranayama.', videoUrl: '01-bienvenue.mp4', duration: 10, sortOrder: 1 },
    { title: 'Annexe – Posture Assise', description: 'Guide complet des postures assises pour le Pranayama : Sukhasana, Padmasana, posture sur chaise. Trouvez l\'assise qui vous convient.', videoUrl: '02-annexe-assise.mp4', duration: 15, sortOrder: 2 },
    { title: 'Vidéo 1 – Les Fondamentaux du Souffle', description: 'Découvrez la respiration abdominale, thoracique et complète. Les bases indispensables avant d\'aborder les techniques avancées.', videoUrl: '03-video1.mp4', duration: 25, sortOrder: 3 },
    { title: 'Vidéo 2 – Ujjayi, le Souffle Victorieux', description: 'Maîtrisez Ujjayi Pranayama, la respiration océanique utilisée dans le Vinyasa. Technique, bienfaits et intégration dans la pratique.', videoUrl: '04-video2.mp4', duration: 20, sortOrder: 4 },
    { title: 'Vidéo 3 – Nadi Shodhana', description: 'La respiration alternée pour équilibrer le système nerveux. Technique détaillée avec rythmes progressifs et variations.', videoUrl: '05-video3.mp4', duration: 25, sortOrder: 5 },
    { title: 'Vidéo 4 – Kapalabhati', description: 'Le souffle de feu purifiant. Technique, précautions, contre-indications et progressions pour une pratique sûre et efficace.', videoUrl: '06-video4.mp4', duration: 20, sortOrder: 6 },
    { title: 'Vidéo 5 – Bhastrika', description: 'Le souffle du soufflet pour dynamiser le corps et l\'esprit. Technique énergisante avec ses variations et précautions.', videoUrl: '07-video5.mp4', duration: 20, sortOrder: 7 },
    { title: 'Vidéo 6 – Bhramari', description: 'Le souffle de l\'abeille pour calmer le mental. Technique de vibration sonore, effets sur le système nerveux et pratique guidée.', videoUrl: '08-video6.mp4', duration: 15, sortOrder: 8 },
    { title: 'Vidéo 7 – Rétentions (Kumbhaka)', description: 'Introduction aux rétentions du souffle : Antara et Bahya Kumbhaka. Progressions sûres et ratios respiratoires.', videoUrl: '09-video7.mp4', duration: 25, sortOrder: 9 },
    { title: 'Vidéo 8 – Séance Complète Guidée', description: 'Une séance de Pranayama complète combinant toutes les techniques apprises. Pratique guidée de 30 minutes.', videoUrl: '10-video8.mp4', duration: 30, sortOrder: 10 },
    { title: 'Vidéo 9 – Pranayama et Méditation', description: 'Le Pranayama comme porte d\'entrée vers la méditation. Transition du souffle au silence intérieur.', videoUrl: '11-video9.mp4', duration: 25, sortOrder: 11 },
    { title: 'Vidéo 10 – Conclusion et Pratique Autonome', description: 'Bilan de la formation, conseils pour créer votre routine de Pranayama et continuer votre progression en autonomie.', videoUrl: '12-video10.mp4', duration: 15, sortOrder: 12 },
  ];

  for (const video of pranayamaVideos) {
    await prisma.formationVideo.create({
      data: { formationId: formations[0].id, ...video },
    });
  }

  console.log('✅ Vidéos des formations créées');

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

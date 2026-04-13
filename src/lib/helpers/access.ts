import { prisma } from "@/lib/prisma";

/** Slug de la formation Pranayama (cas spécial : donne accès aux cours du thème Pranayama) */
const PRANAYAMA_FORMATION_SLUG = "formation-pranayama";
const PRANAYAMA_THEME = "Pranayama";

/**
 * Vérifie si un utilisateur peut accéder à un cours donné.
 * Retourne true si :
 * - L'utilisateur a un abonnement actif ET le cours est inclus dans l'abonnement
 * - L'utilisateur a loué ce cours et la location n'est pas expirée
 * - Le cours est du thème Pranayama ET l'utilisateur possède la formation Pranayama
 */
export async function canAccessCourse(
  userId: string | undefined,
  courseId: string
): Promise<boolean> {
  if (!userId) return false;

  // Parallel: fetch user role, course details, and rental
  const [user, course, rental] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { includedInSubscription: true, theme: true } }),
    prisma.purchase.findFirst({ where: { userId, courseId }, orderBy: { createdAt: "desc" } }),
  ]);

  if (user?.role === "ADMIN") return true;
  if (!course) return false;

  // Check subscription if course is included
  if (course.includedInSubscription) {
    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    if (subscription?.status === "ACTIVE") return true;
  }

  // Check rental
  if (rental) {
    if (!rental.expiresAt) return true;
    if (rental.expiresAt > new Date()) return true;
  }

  // Cas spécial : les propriétaires de la formation Pranayama ont accès aux cours Pranayama
  if (course.theme === PRANAYAMA_THEME) {
    const hasFormation = await hasPranayamaFormation(userId);
    if (hasFormation) return true;
  }

  return false;
}

/**
 * Vérifie si un utilisateur possède la formation Pranayama
 */
export async function hasPranayamaFormation(userId: string): Promise<boolean> {
  const formation = await prisma.formation.findUnique({
    where: { slug: PRANAYAMA_FORMATION_SLUG },
    select: { id: true },
  });
  if (!formation) return false;

  const purchase = await prisma.purchase.findFirst({
    where: { userId, formationId: formation.id },
  });
  return !!purchase;
}

/**
 * Retourne la date d'expiration de la location d'un cours pour un utilisateur.
 */
export async function getCourseRentalExpiry(
  userId: string,
  courseId: string
): Promise<Date | null> {
  const rental = await prisma.purchase.findFirst({
    where: { userId, courseId },
    orderBy: { createdAt: "desc" },
    select: { expiresAt: true },
  });
  return rental?.expiresAt ?? null;
}

/**
 * Vérifie si un utilisateur peut accéder à une formation donnée.
 */
export async function canAccessFormation(
  userId: string | undefined,
  formationId: string
): Promise<boolean> {
  if (!userId) return false;

  // Parallel: check role and purchase
  const [user, purchase] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.purchase.findFirst({ where: { userId, formationId } }),
  ]);

  if (user?.role === "ADMIN") return true;
  return !!purchase;
}

/**
 * Vérifie si un utilisateur a un abonnement actif
 */
export async function hasActiveSubscription(
  userId: string
): Promise<boolean> {
  // Parallel: check role and subscription
  const [user, subscription] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.subscription.findUnique({ where: { userId } }),
  ]);

  if (user?.role === "ADMIN") return true;
  return subscription?.status === "ACTIVE";
}

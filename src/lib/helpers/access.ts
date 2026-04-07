import { prisma } from "@/lib/prisma";

/**
 * Vérifie si un utilisateur peut accéder à un cours donné.
 * Retourne true si :
 * - L'utilisateur a un abonnement actif ET le cours est inclus dans l'abonnement
 * - L'utilisateur a loué ce cours et la location n'est pas expirée
 */
export async function canAccessCourse(
  userId: string | undefined,
  courseId: string
): Promise<boolean> {
  if (!userId) return false;

  // Parallel: fetch user role, course subscription status, and rental
  const [user, course, rental] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
    prisma.course.findUnique({ where: { id: courseId }, select: { includedInSubscription: true } }),
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
  if (!rental) return false;
  if (!rental.expiresAt) return true;
  return rental.expiresAt > new Date();
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

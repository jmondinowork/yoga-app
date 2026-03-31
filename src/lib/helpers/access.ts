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
  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role === "ADMIN") return true;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { includedInSubscription: true },
  });

  if (!course) return false;
  if (!userId) return false;

  // Vérifier l'abonnement actif (si le cours est inclus dans l'abonnement)
  if (course.includedInSubscription) {
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (subscription?.status === "ACTIVE") return true;
  }

  // Vérifier la location du cours (non expirée)
  const rental = await prisma.purchase.findFirst({
    where: { userId, courseId },
    orderBy: { createdAt: "desc" },
  });

  if (!rental) return false;

  // Si pas de date d'expiration, accès permanent (ancien achat)
  if (!rental.expiresAt) return true;

  return rental.expiresAt > new Date();
}

/**
 * Retourne la date d'expiration de la location d'un cours pour un utilisateur.
 * Retourne null si pas de location ou accès via abonnement.
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
 * Les formations sont disponibles uniquement à l'achat unique.
 */
export async function canAccessFormation(
  userId: string | undefined,
  formationId: string
): Promise<boolean> {
  if (!userId) return false;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === "ADMIN") return true;

  const purchase = await prisma.purchase.findFirst({
    where: { userId, formationId },
  });

  return !!purchase;
}

/**
 * Vérifie si un utilisateur a un abonnement actif
 */
export async function hasActiveSubscription(
  userId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role === "ADMIN") return true;

  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  return subscription?.status === "ACTIVE";
}

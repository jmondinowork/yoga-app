import { prisma } from "@/lib/prisma";

/**
 * Vérifie si un utilisateur peut accéder à un cours donné.
 * Retourne true si :
 * - L'utilisateur a un abonnement actif ET le cours est inclus dans l'abonnement
 * - L'utilisateur a acheté ce cours
 */
export async function canAccessCourse(
  userId: string | undefined,
  courseId: string
): Promise<boolean> {
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

  // Vérifier l'achat direct du cours
  const directPurchase = await prisma.purchase.findFirst({
    where: { userId, courseId },
  });

  return !!directPurchase;
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
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  return subscription?.status === "ACTIVE";
}

import { prisma } from "@/lib/prisma";

/**
 * Vérifie si un utilisateur peut accéder à un cours donné.
 * Retourne true si :
 * - Le cours est gratuit
 * - L'utilisateur a un abonnement actif
 * - L'utilisateur a acheté ce cours
 * - L'utilisateur a acheté une formation contenant ce cours
 */
export async function canAccessCourse(
  userId: string | undefined,
  courseId: string
): Promise<boolean> {
  // Vérifier d'abord si le cours est gratuit
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { isFree: true },
  });

  if (!course) return false;
  if (course.isFree) return true;
  if (!userId) return false;

  // Vérifier l'abonnement actif
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  if (subscription?.status === "ACTIVE") return true;

  // Vérifier l'achat direct du cours
  const directPurchase = await prisma.purchase.findFirst({
    where: { userId, courseId },
  });

  if (directPurchase) return true;

  // Vérifier l'achat d'une formation contenant ce cours
  const formationPurchase = await prisma.purchase.findFirst({
    where: {
      userId,
      formation: {
        courses: {
          some: { courseId },
        },
      },
    },
  });

  return !!formationPurchase;
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

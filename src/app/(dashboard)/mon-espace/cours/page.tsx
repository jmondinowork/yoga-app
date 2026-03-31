import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import MesCoursClient from "@/components/dashboard/MesCoursClient";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPresignedUrl } from "@/lib/r2";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mes cours vidéo",
};

export default async function MesCoursPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const userId = session.user.id;

  // Vérifier l'abonnement
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  const hasActiveSubscription = subscription?.status === "ACTIVE";

  // Cours loués individuellement
  const coursePurchases = await prisma.purchase.findMany({
    where: { userId, courseId: { not: null } },
    select: { courseId: true, expiresAt: true },
  });
  const purchasedCourseIds = coursePurchases
    .filter((p) => !p.expiresAt || p.expiresAt > new Date())
    .map((p) => p.courseId)
    .filter(Boolean) as string[];

  // Cours accessibles
  const allPublished = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  let accessibleCourses = allPublished;
  if (hasActiveSubscription) {
    accessibleCourses = allPublished.filter(
      (c) => c.includedInSubscription || purchasedCourseIds.includes(c.id)
    );
  } else if (purchasedCourseIds.length > 0) {
    accessibleCourses = allPublished.filter((c) =>
      purchasedCourseIds.includes(c.id)
    );
  } else {
    accessibleCourses = [];
  }

  // Progrès des cours
  const videoProgress = await prisma.videoProgress.findMany({
    where: { userId },
    select: { courseId: true, progress: true },
  });
  const progressByCourse = Object.fromEntries(
    videoProgress.map((p) => [p.courseId, p.progress])
  );

  const hasContent = accessibleCourses.length > 0;
  const otherCoursesCount = allPublished.length - accessibleCourses.length;

  // Générer les presigned URLs pour les thumbnails
  const coursesWithThumbnails = await Promise.all(
    accessibleCourses.map(async (c) => {
      let thumbnail: string | null = null;
      if (c.thumbnail && !c.thumbnail.startsWith("http")) {
        try {
          thumbnail = await getPresignedUrl(c.thumbnail, 7200);
        } catch {
          thumbnail = null;
        }
      } else {
        thumbnail = c.thumbnail ?? null;
      }
      return { ...c, thumbnail };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Mes cours vidéo
        </h1>
        <p className="text-muted">
          {hasActiveSubscription
            ? "Accès illimité à tous les cours grâce à votre abonnement."
            : hasContent
              ? "Vos cours vidéo disponibles."
              : "Découvrez notre catalogue de cours pour tous les niveaux."}
        </p>
      </div>

      {hasContent ? (
        <MesCoursClient
          courses={coursesWithThumbnails.map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            thumbnail: c.thumbnail,
            duration: c.duration,
            theme: c.theme,
            price: c.price ?? null,
            includedInSubscription: c.includedInSubscription,
          }))}
          progressByCourse={progressByCourse}
          hasActiveSubscription={hasActiveSubscription}
          otherCoursesCount={otherCoursesCount}
        />
      ) : (
        <div className="bg-linear-to-r from-accent-light/50 to-primary/30 rounded-2xl p-10 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-button mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-heading">
            Découvrez nos cours vidéo
          </h2>
          <p className="text-text max-w-lg mx-auto">
            Explorez notre catalogue de cours pour tous les niveaux : vinyasa,
            hatha, yin yoga et bien plus. Disponibles en location 72h ou via
            l&apos;abonnement.
          </p>
          <Link href="/cours">
            <Button size="lg">
              Voir les cours
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import CourseCard from "@/components/courses/CourseCard";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
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

  // Cours achetés individuellement
  const coursePurchases = await prisma.purchase.findMany({
    where: { userId, courseId: { not: null } },
    select: { courseId: true },
  });
  const purchasedCourseIds = coursePurchases
    .map((p) => p.courseId)
    .filter(Boolean) as string[];

  // Cours accessibles
  // Cours accessibles
  const allPublished = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { sortOrder: "asc" },
  });

  let accessibleCourses = allPublished;
  if (hasActiveSubscription) {
    // Abonné : tous les cours inclus dans l'abonnement + achetés
    accessibleCourses = allPublished.filter(
      (c) => c.includedInSubscription || purchasedCourseIds.includes(c.id)
    );
  } else if (purchasedCourseIds.length > 0) {
    // Cours achetés uniquement
    accessibleCourses = allPublished.filter((c) =>
      purchasedCourseIds.includes(c.id)
    );
  } else {
    // Aucun cours accessible
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
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {accessibleCourses.map((course) => (
              <CourseCard
                key={course.id}
                slug={course.slug}
                title={course.title}
                thumbnail={course.thumbnail}
                duration={course.duration}
                level={course.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED"}
                theme={course.theme}
                price={course.price}
                includedInSubscription={course.includedInSubscription}
                progress={progressByCourse[course.id]}
              />
            ))}
          </div>

          {!hasActiveSubscription && (
            <div className="bg-gradient-to-r from-accent-light/50 to-primary/30 rounded-2xl p-8 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-button mx-auto" />
              <h2 className="font-heading text-xl font-bold text-heading">
                Accédez à tous les cours
              </h2>
              <p className="text-sm text-text max-w-md mx-auto">
                Avec un abonnement, profitez de l&apos;ensemble du catalogue
                de cours vidéo en illimité.
              </p>
              <Link href="/tarifs">
                <Button>
                  Voir les abonnements
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gradient-to-r from-accent-light/50 to-primary/30 rounded-2xl p-10 text-center space-y-4">
          <Sparkles className="w-12 h-12 text-button mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-heading">
            Découvrez nos cours vidéo
          </h2>
          <p className="text-text max-w-lg mx-auto">
            Explorez notre catalogue de cours pour tous les niveaux : vinyasa,
            hatha, yin yoga et bien plus. Disponibles à l&apos;unité ou via
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

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Clock, Tag, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import CourseCard from "@/components/courses/CourseCard";
import PurchaseButton from "@/components/courses/PurchaseButton";
import VideoPlayer from "@/components/courses/VideoPlayer";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessCourse, getCourseRentalExpiry, hasActiveSubscription, hasPranayamaFormation } from "@/lib/helpers/access";
import { getPresignedUrl } from "@/lib/r2";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, description: true },
  });

  if (!course) return { title: "Cours introuvable" };

  return {
    title: course.title,
    description: course.description?.substring(0, 160) ?? "",
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  // Fetch course and session in parallel
  const [course, session] = await Promise.all([
    prisma.course.findUnique({ where: { slug, isPublished: true } }),
    auth(),
  ]);

  if (!course) notFound();

  // Parallel: access check, progress, related courses, thumbnail
  const userId = session?.user?.id;
  const [accessResult, vp, relatedCourses, thumbnailUrl] = await Promise.all([
    userId
      ? canAccessCourse(userId, course.id).then(async (hasAccess) => {
          if (!hasAccess) return { hasAccess: false, isSubscriber: false, rentalExpiry: null, viaPranayama: false };
          const [isSubscriber, rentalExpiry, ownsPranayama] = await Promise.all([
            hasActiveSubscription(userId),
            getCourseRentalExpiry(userId, course.id),
            course.theme === "Pranayama" ? hasPranayamaFormation(userId) : Promise.resolve(false),
          ]);
          return { hasAccess, isSubscriber, rentalExpiry, viaPranayama: ownsPranayama && !isSubscriber && !rentalExpiry };
        })
      : Promise.resolve({ hasAccess: false, isSubscriber: false, rentalExpiry: null as Date | null, viaPranayama: false }),
    userId
      ? prisma.videoProgress.findUnique({
          where: { userId_courseId: { userId, courseId: course.id } },
        })
      : null,
    prisma.course.findMany({
      where: { isPublished: true, theme: course.theme, id: { not: course.id } },
      take: 3,
      orderBy: { sortOrder: "asc" },
    }),
    course.thumbnail && !course.thumbnail.startsWith("http")
      ? getPresignedUrl(course.thumbnail, 7200).catch(() => null)
      : Promise.resolve(course.thumbnail),
  ]);

  const { hasAccess, isSubscriber, rentalExpiry, viaPranayama } = accessResult;
  const progress = vp?.progress ?? 0;
  const hoursLeft = rentalExpiry
    ? Math.max(0, Math.ceil((rentalExpiry.getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  // Presigned URLs for related courses (already parallel)
  const relatedCoursesWithThumbnails = await Promise.all(
    relatedCourses.map(async (c) => {
      if (c.thumbnail && !c.thumbnail.startsWith("http")) {
        const url = await getPresignedUrl(c.thumbnail, 7200).catch(() => null);
        return { ...c, thumbnail: url };
      }
      return c;
    })
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back */}
      <Link
        href="/cours"
        className="inline-flex items-center gap-2 text-muted hover:text-heading transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux cours
      </Link>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main content */}
        <div className={`lg:col-span-2 space-y-8 ${hasAccess ? 'order-1' : 'order-2 lg:order-1'}`}>
          <VideoPlayer
            apiUrl={`/api/cours/${course.slug}/video-url`}
            thumbnail={thumbnailUrl}
            title={course.title}
            isLocked={!hasAccess}
            courseId={hasAccess ? course.id : undefined}
          />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{course.theme}</Badge>
              {hasAccess && isSubscriber && (
                <Badge variant="success">✓ Accès illimité — abonnement</Badge>
              )}
              {hasAccess && !isSubscriber && rentalExpiry && (
                <Badge variant="success">✓ Location active — {hoursLeft}h restantes</Badge>
              )}
              {hasAccess && viaPranayama && (
                <Badge variant="success">✓ Accès inclus — Formation Pranayama</Badge>
              )}
            </div>

            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-heading">
              {course.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.duration} minutes
              </span>
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                {course.theme}
              </span>
            </div>

            {hasAccess && progress > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1 h-2 bg-primary/30 rounded-full overflow-hidden max-w-xs">
                  <div
                    className="h-full bg-button rounded-full transition-all"
                    style={{ width: `${Math.round(progress)}%` }}
                  />
                </div>
                <span className="text-muted">{Math.round(progress)}%</span>
              </div>
            )}
          </div>

          {course.description && (
            <div className="prose prose-lg max-w-none">
              <h2 className="font-heading text-2xl font-semibold text-heading">
                Description
              </h2>
              {course.description.split("\n\n").map((paragraph, i) => (
                <p key={i} className="text-text leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={`space-y-6 ${hasAccess ? 'order-2' : 'order-1 lg:order-2'}`}>
          <div className="bg-card rounded-2xl border border-border overflow-hidden sticky top-24">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gradient-to-br from-button/10 to-primary/40 flex items-center justify-center overflow-hidden">
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={course.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover"
                />
              ) : (
                <span className="text-5xl opacity-30">🧘</span>
              )}
            </div>

            <div className="p-5 space-y-5">
              {hasAccess ? (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <p className="font-medium text-green-800 text-sm">
                    ✓ Vous avez accès à ce cours
                  </p>
                  {isSubscriber && (
                    <p className="text-xs text-green-600 mt-1">
                      Accès illimité avec votre abonnement
                    </p>
                  )}
                  {!isSubscriber && rentalExpiry && (
                    <p className="text-xs text-green-600 mt-1">
                      Location 72h — {hoursLeft}h restantes
                      <br />
                      Expire le{" "}
                      {rentalExpiry.toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                  {viaPranayama && (
                    <p className="text-xs text-green-600 mt-1">
                      Inclus avec votre Formation Pranayama
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Abonnement — CTA principal */}
                  <div className="bg-gradient-to-br from-button/5 to-primary/20 border border-button/20 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-button">
                      Recommandé
                    </p>
                    <p className="font-heading text-lg font-bold text-heading">
                      Accès illimité
                    </p>
                    <p className="text-sm text-text leading-relaxed">
                      Accédez à tous les cours avec un abonnement mensuel ou annuel.
                    </p>
                    <Link href="/tarifs">
                      <Button className="w-full mt-1">
                        Voir les abonnements
                      </Button>
                    </Link>
                  </div>

                  {/* Location — option secondaire */}
                  {course.availableForRental && course.price && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted font-medium">ou bien</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                  )}

                  {course.availableForRental && course.price && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-heading">Location 72h</p>
                        <p className="text-xs text-muted">Accès temporaire</p>
                      </div>
                      <PurchaseButton
                        type="course"
                        itemId={course.id}
                        variant="outline"
                      >
                        {course.price} €
                      </PurchaseButton>
                    </div>
                  )}
                </>
              )}

              <div className="border-t border-border pt-4">
                <p className="text-xs text-muted">
                  {isSubscriber
                    ? <><span>✓ Accès illimité avec votre abonnement</span><br /></>
                    : viaPranayama
                    ? <><span>✓ Inclus avec votre Formation Pranayama</span><br /></>
                    : <>
                        <span>✓ Accès illimité avec l&apos;abonnement</span><br />
                        <span>✓ Accès pendant 72h après location</span><br />
                      </>}
                  ✓ Disponible sur tous vos appareils<br />
                  ✓ Suivi de progression inclus
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cours similaires */}
      {relatedCourses.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading text-2xl font-bold text-heading mb-8">
            Cours similaires
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedCoursesWithThumbnails.map((c) => (
              <CourseCard
                key={c.slug}
                slug={c.slug}
                title={c.title}
                thumbnail={c.thumbnail}
                duration={c.duration}
                theme={c.theme}
                price={c.price}
                includedInSubscription={c.includedInSubscription}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

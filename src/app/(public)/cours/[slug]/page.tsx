import type { Metadata } from "next";
import Link from "next/link";
import { Clock, BarChart3, Tag, ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import VideoPlayer from "@/components/courses/VideoPlayer";
import CourseCard from "@/components/courses/CourseCard";
import PurchaseButton from "@/components/courses/PurchaseButton";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canAccessCourse } from "@/lib/helpers/access";
import { getPresignedUrl } from "@/lib/r2";

const levelLabels = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

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

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
  });

  if (!course) notFound();

  const session = await auth();

  // Vérifier l'accès
  let hasAccess = false;
  if (session?.user?.id) {
    hasAccess = await canAccessCourse(session.user.id, course.id);
  }

  // Progrès vidéo
  let progress = 0;
  if (session?.user?.id) {
    const vp = await prisma.videoProgress.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    });
    if (vp) progress = vp.progress;
  }

  // Cours similaires (même thème, hors cours actuel)
  const relatedCourses = await prisma.course.findMany({
    where: {
      isPublished: true,
      theme: course.theme,
      id: { not: course.id },
    },
    take: 3,
    orderBy: { sortOrder: "asc" },
  });

  // Presigned URL pour la thumbnail
  let thumbnailUrl: string | null = null;
  if (course.thumbnail && !course.thumbnail.startsWith("http")) {
    try {
      thumbnailUrl = await getPresignedUrl(course.thumbnail, 7200);
    } catch {
      thumbnailUrl = null;
    }
  } else {
    thumbnailUrl = course.thumbnail;
  }

  // Presigned URLs pour les thumbnails des cours similaires
  const relatedCoursesWithThumbnails = await Promise.all(
    relatedCourses.map(async (c) => {
      if (c.thumbnail && !c.thumbnail.startsWith("http")) {
        try {
          const url = await getPresignedUrl(c.thumbnail, 7200);
          return { ...c, thumbnail: url };
        } catch {
          return { ...c, thumbnail: null };
        }
      }
      return c;
    })
  );

  const level = course.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

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
        <div className="lg:col-span-2 space-y-8">
          <VideoPlayer
            apiUrl={`/api/cours/${course.slug}/video-url`}
            thumbnail={thumbnailUrl}
            title={course.title}
            isLocked={!hasAccess}
          />

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={level === "BEGINNER" ? "success" : level === "INTERMEDIATE" ? "warning" : "premium"}>
                {levelLabels[level]}
              </Badge>
              <Badge>{course.theme}</Badge>
              {hasAccess && (
                <Badge variant="success">✓ Accès débloqué</Badge>
              )}
            </div>

            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-heading">
              {course.title}
            </h1>

            <div className="flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {course.duration} minutes
              </span>
              <span className="flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" />
                {levelLabels[level]}
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
        <div className="space-y-6">
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6 sticky top-24">
            {/* Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-button/10 to-primary/40 rounded-xl flex items-center justify-center overflow-hidden">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-5xl opacity-30">🧘</span>
              )}
            </div>

            {hasAccess ? (
              <Badge variant="success" className="text-base px-4 py-1 w-full justify-center">
                ✓ Vous avez accès à ce cours
              </Badge>
            ) : course.price ? (
              <div>
                <p className="text-sm text-muted">Prix à l&apos;unité</p>
                <p className="font-heading text-4xl font-bold text-heading">
                  {course.price} <span className="text-lg text-muted">€</span>
                </p>
              </div>
            ) : null}

            {!hasAccess && course.price && (
              <PurchaseButton
                type="course"
                itemId={course.id}
                className="w-full"
                size="lg"
              >
                Acheter — {course.price} €
              </PurchaseButton>
            )}

            {!hasAccess && (
              <div className="text-center">
                <p className="text-sm text-muted">ou</p>
                <Link href="/tarifs" className="text-sm text-button hover:underline">
                  Voir les abonnements
                </Link>
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-xs text-muted">
                ✓ Accès illimité une fois acheté<br />
                ✓ Disponible sur tous vos appareils<br />
                ✓ Suivi de progression inclus
              </p>
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
                level={c.level as "BEGINNER" | "INTERMEDIATE" | "ADVANCED"}
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

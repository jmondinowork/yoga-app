import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, FileText, Video } from "lucide-react";
import { notFound } from "next/navigation";
import Badge from "@/components/ui/Badge";
import PurchaseButton from "@/components/courses/PurchaseButton";
import FormationVideoList from "@/components/courses/FormationVideoList";
import FormationPdfButton from "@/components/courses/FormationPdfButton";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getPresignedUrl } from "@/lib/r2";
import { canAccessFormation } from "@/lib/helpers/access";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const formation = await prisma.formation.findUnique({
    where: { slug, isPublished: true },
    select: { title: true, description: true },
  });

  if (!formation) return { title: "Formation introuvable" };

  return {
    title: formation.title,
    description: formation.description.substring(0, 160),
  };
}

export default async function FormationDetailPage({ params }: Props) {
  const { slug } = await params;

  const formation = await prisma.formation.findUnique({
    where: { slug, isPublished: true },
    include: {
      videos: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!formation) notFound();

  const session = await auth();

  // Vérifier si l'utilisateur a accès (achat ou admin)
  const hasAccess = await canAccessFormation(session?.user?.id, formation.id);

  // Progrès des vidéos si l'utilisateur est connecté
  let videoProgressMap: Record<string, { progress: number; completed: boolean }> = {};
  if (session?.user?.id && hasAccess) {
    const progress = await prisma.formationVideoProgress.findMany({
      where: {
        userId: session.user.id,
        formationVideoId: { in: formation.videos.map((v) => v.id) },
      },
    });
    videoProgressMap = Object.fromEntries(
      progress.map((p) => [p.formationVideoId, { progress: p.progress, completed: p.completed }])
    );
  }

  const totalDuration = formation.videos.reduce((acc, v) => acc + v.duration, 0);
  const completedCount = Object.values(videoProgressMap).filter((p) => p.completed).length;

  // Presigned URL pour la thumbnail
  let thumbnailUrl: string | null = null;
  if (formation.thumbnail && !formation.thumbnail.startsWith("http")) {
    try {
      thumbnailUrl = await getPresignedUrl(formation.thumbnail, 7200);
    } catch {
      thumbnailUrl = null;
    }
  } else {
    thumbnailUrl = formation.thumbnail;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/formations"
        className="inline-flex items-center gap-2 text-muted hover:text-heading transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux formations
      </Link>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Badge variant="premium">Formation</Badge>
            <h1 className="font-heading text-3xl lg:text-4xl font-bold text-heading">
              {formation.title}
            </h1>
            <div className="flex items-center gap-6 text-sm text-muted">
              <span className="flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                {formation.videos.length} vidéo{formation.videos.length > 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {Math.floor(totalDuration / 60) > 0
                  ? `${Math.floor(totalDuration / 60)}h${totalDuration % 60 > 0 ? `${totalDuration % 60}min` : ""}`
                  : `${totalDuration}min`}
              </span>
              {formation.bookletUrl && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Livret PDF inclus
                </span>
              )}
            </div>
            {hasAccess && completedCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex-1 h-2 bg-primary/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-button rounded-full transition-all"
                    style={{
                      width: `${Math.round((completedCount / formation.videos.length) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-muted">
                  {completedCount}/{formation.videos.length} complétées
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="font-heading text-2xl font-semibold text-heading mb-4">
              Description
            </h2>
            {formation.description.split("\n\n").map((p, i) => (
              <p key={i} className="text-text leading-relaxed mb-4">
                {p}
              </p>
            ))}
          </div>

          {/* Livret PDF */}
          {formation.bookletUrl && (
            <div className="bg-gradient-to-r from-accent-light/50 to-primary/30 rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-button/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-button" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-heading">
                  Livret de formation (PDF)
                </h3>
                <p className="text-sm text-muted">
                  Support complémentaire inclus pour accompagner votre progression
                </p>
              </div>
              {hasAccess ? (
                <FormationPdfButton slug={formation.slug} />
              ) : (
                <span className="text-xs text-muted/50 shrink-0">🔒</span>
              )}
            </div>
          )}

          {/* Video list */}
          <FormationVideoList
            slug={formation.slug}
            videos={formation.videos.map((v) => ({
              id: v.id,
              title: v.title,
              description: v.description,
              duration: v.duration,
              sortOrder: v.sortOrder,
              videoUrl: v.videoUrl,
            }))}
            hasAccess={hasAccess}
            videoProgressMap={videoProgressMap}
          />
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-card rounded-2xl border border-border p-6 space-y-6 sticky top-24">
            {/* Thumbnail placeholder */}
            <div className="aspect-video bg-gradient-to-br from-button/10 to-primary/40 rounded-xl flex items-center justify-center overflow-hidden">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={formation.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="w-12 h-12 text-button/30" />
              )}
            </div>

            {hasAccess ? (
              <Badge variant="success" className="text-base px-4 py-1 w-full justify-center">
                ✓ Vous avez accès à cette formation
              </Badge>
            ) : formation.price ? (
              <div>
                <p className="text-sm text-muted">Prix de la formation</p>
                <p className="font-heading text-4xl font-bold text-heading">
                  {formation.price} <span className="text-lg text-muted">€</span>
                </p>
              </div>
            ) : null}

            {!hasAccess && formation.price && (
              <PurchaseButton
                type="formation"
                itemId={formation.id}
                className="w-full"
                size="lg"
              >
                Acheter — {formation.price} €
              </PurchaseButton>
            )}

            <div className="border-t border-border pt-4 space-y-2 text-xs text-muted">
              <p>✓ {formation.videos.length} vidéo{formation.videos.length > 1 ? "s" : ""} exclusives</p>
              {formation.bookletUrl && <p>✓ Livret PDF inclus</p>}
              <p>✓ Accompagnement personnalisé d&apos;un an avec Mathilde Torrez</p>
              <p>✓ Accès illimité une fois acheté</p>
              <p>✓ Suivi de progression</p>
              <p>✓ Disponible sur tous vos appareils</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

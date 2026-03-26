import type { Metadata } from "next";
import Link from "next/link";
import { Play, BookOpen, ArrowRight, Clock, Video, FileText, Sparkles, Crown } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import CourseCard from "@/components/courses/CourseCard";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mon espace",
};

export default async function MonEspacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const userId = session.user.id;

  // Récupérer les formations achetées par l'utilisateur
  const formationPurchases = await prisma.purchase.findMany({
    where: { userId, formationId: { not: null } },
    include: {
      formation: {
        include: {
          videos: {
            orderBy: { sortOrder: "asc" },
            select: { id: true, duration: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Abonnement (pour les cours vidéo uniquement)
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });
  const hasActiveSubscription = subscription?.status === "ACTIVE";

  // Formations accessibles (achat unique seulement, pas dans l'abonnement)
  const accessibleFormations = formationPurchases
    .map((p) => p.formation)
    .filter(Boolean) as NonNullable<typeof formationPurchases[0]["formation"]>[];

  // Progrès des vidéos de formation pour cet utilisateur
  const allVideoIds = accessibleFormations.flatMap((f) => f.videos.map((v) => v.id));
  const formationProgress = allVideoIds.length > 0
    ? await prisma.formationVideoProgress.findMany({
        where: { userId, formationVideoId: { in: allVideoIds } },
      })
    : [];

  const progressMap = Object.fromEntries(
    formationProgress.map((p) => [p.formationVideoId, p])
  );

  // Stats
  const courseProgress = await prisma.videoProgress.count({ where: { userId } });
  const totalPracticeMinutes = await prisma.videoProgress.findMany({
    where: { userId },
    include: { course: { select: { duration: true } } },
  });
  const totalMinutes = totalPracticeMinutes.reduce((acc, p) => acc + p.course.duration, 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Tableau de bord
        </h1>
        <p className="text-muted">Bienvenue dans votre espace personnel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Play className="w-5 h-5 text-button" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-heading">{courseProgress}</p>
              <p className="text-xs text-muted">Cours suivis</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <Clock className="w-5 h-5 text-button" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-heading">
                {hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
              </p>
              <p className="text-xs text-muted">Temps de pratique</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-button" />
            </div>
            <div>
              <p className="text-2xl font-heading font-bold text-heading">{accessibleFormations.length}</p>
              <p className="text-xs text-muted">Formation{accessibleFormations.length > 1 ? "s" : ""} accessibles</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incitation abonnement (si pas abonné) */}
      {!hasActiveSubscription && (
        <div className="bg-gradient-to-br from-button/5 via-accent-light/40 to-button/10 rounded-2xl border border-button/20 p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-button/15 flex items-center justify-center">
              <Crown className="w-6 h-6 text-button" />
            </div>
            <div>
              <h2 className="font-heading text-xl font-bold text-heading">
                Passez à l&apos;illimité
              </h2>
              <p className="text-sm text-muted">Accédez à tous les cours vidéo sans restriction</p>
            </div>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-text">
            {[
              "Accès illimité à tous les cours vidéo",
              "Nouveaux cours ajoutés chaque semaine",
              "Tous les niveaux : débutant à avancé",
              "Annulez à tout moment",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-button shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <Link href="/tarifs">
            <Button className="mt-2">
              Voir les offres
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Statut abonnement (si abonné) */}
      {subscription && hasActiveSubscription && (
        <div className="bg-gradient-to-r from-button/10 to-accent-light/30 rounded-2xl border border-button/20 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="premium">
                Abonnement {subscription.plan === "MONTHLY" ? "mensuel" : "annuel"}
              </Badge>
              <Badge variant="success">Actif</Badge>
            </div>
            <p className="text-sm text-text">
              Accès illimité à tous les cours vidéo — Prochain renouvellement :{" "}
              {subscription.currentPeriodEnd.toLocaleDateString("fr-FR")}
            </p>
          </div>
          <Link href="/mon-espace/parametres">
            <Button variant="outline" size="sm">
              Gérer
            </Button>
          </Link>
        </div>
      )}

      {/* Mes formations */}
      {accessibleFormations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-heading">
              Mes formations
            </h2>
            <Link href="/formations" className="text-sm text-button hover:underline flex items-center gap-1">
              Toutes les formations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {accessibleFormations.map((formation) => {
              const totalVideos = formation.videos.length;
              const completedVideos = formation.videos.filter(
                (v) => progressMap[v.id]?.completed
              ).length;
              const progressPercent = totalVideos > 0
                ? Math.round((completedVideos / totalVideos) * 100)
                : 0;
              const totalDuration = formation.videos.reduce(
                (acc, v) => acc + v.duration,
                0
              );

              return (
                <Link
                  key={formation.id}
                  href={`/formations/${formation.slug}`}
                  className="group block"
                >
                  <div className="bg-card rounded-2xl border border-border p-5 hover:border-button/30 hover:shadow-md transition-all space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                          <BookOpen className="w-5 h-5 text-button" />
                        </div>
                        <h3 className="font-heading font-semibold text-heading group-hover:text-button transition-colors">
                          {formation.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {totalVideos} vidéo{totalVideos > 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.floor(totalDuration / 60) > 0
                          ? `${Math.floor(totalDuration / 60)}h${totalDuration % 60 > 0 ? `${totalDuration % 60}` : ""}`
                          : `${totalDuration}min`}
                      </span>
                      {formation.bookletUrl && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5" />
                          Livret
                        </span>
                      )}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted">
                        <span>{completedVideos}/{totalVideos} vidéos complétées</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div className="h-2 bg-primary/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-button rounded-full transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA si pas de formations */}
      {accessibleFormations.length === 0 && (
        <div className="bg-gradient-to-r from-accent-light/50 to-primary/30 rounded-2xl p-8 text-center space-y-3">
          <BookOpen className="w-10 h-10 text-button mx-auto" />
          <h2 className="font-heading text-xl font-bold text-heading">
            Découvrez nos formations
          </h2>
          <p className="text-sm text-text max-w-md mx-auto">
            Des programmes exclusifs avec vidéos, livret PDF et un accompagnement personnalisé d&apos;un an avec Mathilde Torrez.
          </p>
          <Link href="/formations">
            <Button>
              Voir les formations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Découvrir les cours vidéo */}
      <div className="bg-gradient-to-r from-accent-light/50 to-primary/30 rounded-2xl p-8 text-center space-y-3">
        <Sparkles className="w-10 h-10 text-button mx-auto" />
        <h2 className="font-heading text-xl font-bold text-heading">
          Découvrez nos cours vidéo
        </h2>
        <p className="text-sm text-text max-w-md mx-auto">
          Explorez notre catalogue de cours pour tous les niveaux : vinyasa, hatha, yin yoga et bien plus. Disponibles à l&apos;unité ou inclus dans l&apos;abonnement.
        </p>
        <Link href="/cours">
          <Button>
            Voir les cours
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

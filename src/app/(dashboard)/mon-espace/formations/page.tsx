import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight, Clock, Video, FileText } from "lucide-react";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Mes formations",
};

export default async function MesFormationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const userId = session.user.id;

  // Formations achetées (achat unique seulement)
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

  const accessibleFormations = formationPurchases
    .map((p) => p.formation)
    .filter(Boolean) as NonNullable<(typeof formationPurchases)[0]["formation"]>[];

  // Progrès des vidéos
  const allVideoIds = accessibleFormations.flatMap((f) =>
    f.videos.map((v) => v.id)
  );
  const formationProgress =
    allVideoIds.length > 0
      ? await prisma.formationVideoProgress.findMany({
          where: { userId, formationVideoId: { in: allVideoIds } },
        })
      : [];

  const progressMap = Object.fromEntries(
    formationProgress.map((p) => [p.formationVideoId, p])
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Mes formations
        </h1>
        <p className="text-muted">
          {accessibleFormations.length > 0
            ? "Vos formations avec vidéos exclusives, livret et accompagnement personnalisé."
            : "Découvrez nos formations pour transformer votre pratique."}
        </p>
      </div>

      {accessibleFormations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {accessibleFormations.map((formation) => {
            const totalVideos = formation.videos.length;
            const completedVideos = formation.videos.filter(
              (v) => progressMap[v.id]?.completed
            ).length;
            const progressPercent =
              totalVideos > 0
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
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5 text-button" />
                    </div>
                    <h3 className="font-heading font-semibold text-heading group-hover:text-button transition-colors">
                      {formation.title}
                    </h3>
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

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted">
                      <span>
                        {completedVideos}/{totalVideos} vidéos complétées
                      </span>
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
      ) : (
        <div className="bg-gradient-to-r from-accent-light/50 to-primary/30 rounded-2xl p-10 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-button mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-heading">
            Découvrez nos formations
          </h2>
          <p className="text-text max-w-lg mx-auto">
            Des programmes exclusifs avec vidéos, livret PDF et un
            accompagnement personnalisé d&apos;un an avec Mathilde Torrez pour
            transformer votre pratique.
          </p>
          <Link href="/formations">
            <Button size="lg">
              Voir les formations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

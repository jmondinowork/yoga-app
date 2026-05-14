import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import MesFormationsClient, {
  type FormationCardData,
} from "@/components/dashboard/MesFormationsClient";
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

  const accessibleFormationIds = accessibleFormations.map((f) => f.id);
  const otherFormationsCount = await prisma.formation.count({
    where: {
      isPublished: true,
      id: { notIn: accessibleFormationIds },
    },
  });

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

  // Préparer les données sérialisables pour le composant client
  const formationCards: FormationCardData[] = accessibleFormations.map(
    (formation) => {
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
      const durationLabel =
        Math.floor(totalDuration / 60) > 0
          ? `${Math.floor(totalDuration / 60)}h${totalDuration % 60 > 0 ? totalDuration % 60 : ""}`
          : `${totalDuration}min`;

      return {
        id: formation.id,
        slug: formation.slug,
        title: formation.title,
        bookletUrl: formation.bookletUrl ?? null,
        totalVideos,
        completedVideos,
        progressPercent,
        durationLabel,
      };
    }
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-heading mb-2">
          Mes formations
        </h1>
        <p className="text-muted">
          {accessibleFormations.length > 0
            ? "Vos formations avec vidéos exclusives, livret et suivi personnalisé."
            : "Découvrez nos formations pour transformer votre pratique."}
        </p>
      </div>

      {accessibleFormations.length > 0 ? (
        <MesFormationsClient
          formations={formationCards}
          otherFormationsCount={otherFormationsCount}
        />
      ) : (
        <div className="bg-linear-to-r from-accent-light/50 to-primary/30 rounded-2xl p-10 text-center space-y-4">
          <BookOpen className="w-12 h-12 text-button mx-auto" />
          <h2 className="font-heading text-2xl font-bold text-heading">
            Découvrez nos formations
          </h2>
          <p className="text-text max-w-lg mx-auto">
            Des programmes exclusifs avec vidéos, livret PDF et un
            suivi personnalisé d&apos;un an avec Mathilde Torrez pour
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

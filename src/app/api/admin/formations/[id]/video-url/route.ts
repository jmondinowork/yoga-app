import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPresignedUrl } from "@/lib/r2";

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const { id } = await params;

  const formation = await prisma.formation.findUnique({
    where: { id },
    include: {
      videos: {
        where: { videoUrl: { not: null } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { videoUrl: true },
      },
    },
  });

  const firstVideoKey = formation?.videos[0]?.videoUrl;
  if (!firstVideoKey) {
    return NextResponse.json({ error: "Pas de vidéo associée" }, { status: 404 });
  }

  const url = await getPresignedUrl(firstVideoKey, 3600);
  return NextResponse.json({ url });
}

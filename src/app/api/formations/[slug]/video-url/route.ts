import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessFormation } from "@/lib/helpers/access";
import { getPresignedUrl } from "@/lib/r2";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function POST(request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { slug } = await params;

  const formation = await prisma.formation.findUnique({
    where: { slug, isPublished: true },
    select: { id: true, slug: true },
  });

  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
  }

  const hasAccess = await canAccessFormation(session.user.id, formation.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = await request.json();
  const filename = body?.filename;

  if (!filename || typeof filename !== "string") {
    return NextResponse.json({ error: "Paramètre 'filename' requis" }, { status: 400 });
  }

  // Sécurité : empêcher la traversée de répertoire
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return NextResponse.json({ error: "Nom de fichier invalide" }, { status: 400 });
  }

  const key = `formations/${formation.slug}/videos/${filename}`;
  const url = await getPresignedUrl(key);

  return NextResponse.json({ url });
}

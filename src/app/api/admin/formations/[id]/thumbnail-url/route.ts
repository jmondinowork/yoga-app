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
    select: { thumbnail: true },
  });

  if (!formation?.thumbnail) {
    return NextResponse.json({ error: "Pas de miniature associée" }, { status: 404 });
  }

  if (formation.thumbnail.startsWith("http")) {
    return NextResponse.json({ url: formation.thumbnail });
  }

  const url = await getPresignedUrl(formation.thumbnail, 3600);
  return NextResponse.json({ url });
}

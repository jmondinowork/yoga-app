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

  const course = await prisma.course.findUnique({
    where: { id },
    select: { slug: true, videoUrl: true },
  });

  if (!course?.videoUrl) {
    return NextResponse.json({ error: "Pas de vidéo associée" }, { status: 404 });
  }

  const key = `cours/${course.slug}/video.mp4`;
  const url = await getPresignedUrl(key, 3600);

  return NextResponse.json({ url });
}

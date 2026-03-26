import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/helpers/access";
import { getPresignedUrl } from "@/lib/r2";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function POST(_request: Request, { params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    select: { id: true, slug: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Cours introuvable" }, { status: 404 });
  }

  const hasAccess = await canAccessCourse(session.user.id, course.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const key = `cours/${course.slug}/video.mp4`;
  const url = await getPresignedUrl(key);

  return NextResponse.json({ url });
}

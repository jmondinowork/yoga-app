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
    select: { thumbnail: true },
  });

  if (!course?.thumbnail) {
    return NextResponse.json({ error: "Pas de miniature associée" }, { status: 404 });
  }

  // Si c'est déjà une URL publique, on la retourne directement
  if (course.thumbnail.startsWith("http")) {
    return NextResponse.json({ url: course.thumbnail });
  }

  const url = await getPresignedUrl(course.thumbnail, 3600);
  return NextResponse.json({ url });
}

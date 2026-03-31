import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { notifNewCourses } = body;

  if (typeof notifNewCourses !== "boolean") {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { notifNewCourses },
  });

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canAccessFormation } from '@/lib/helpers/access';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Vous devez être connecté.' }, { status: 401 });
  }

  try {
    const { formationVideoId, progress, completed } = await req.json();

    if (!formationVideoId || typeof progress !== 'number') {
      return NextResponse.json({ error: 'Données manquantes.' }, { status: 400 });
    }

    // Vérifier que l'utilisateur a accès à la formation de cette vidéo
    const video = await prisma.formationVideo.findUnique({
      where: { id: formationVideoId },
      select: { formationId: true },
    });

    if (!video) {
      return NextResponse.json({ error: 'Vidéo introuvable.' }, { status: 404 });
    }

    const hasAccess = await canAccessFormation(session.user.id, video.formationId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Vous n\'avez pas accès à cette formation.' }, { status: 403 });
    }

    const result = await prisma.formationVideoProgress.upsert({
      where: {
        userId_formationVideoId: {
          userId: session.user.id,
          formationVideoId,
        },
      },
      update: {
        progress: Math.min(100, Math.max(0, progress)),
        completed: completed ?? progress >= 95,
        lastWatchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        formationVideoId,
        progress: Math.min(100, Math.max(0, progress)),
        completed: completed ?? progress >= 95,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[FORMATION_PROGRESS_ERROR]', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

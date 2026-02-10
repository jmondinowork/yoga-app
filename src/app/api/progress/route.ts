import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Mettre à jour la progression vidéo
export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Vous devez être connecté.' },
      { status: 401 }
    );
  }

  try {
    const { courseId, progress, completed } = await req.json();

    if (!courseId || typeof progress !== 'number') {
      return NextResponse.json(
        { error: 'Données manquantes.' },
        { status: 400 }
      );
    }

    const videoProgress = await prisma.videoProgress.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
      update: {
        progress: Math.min(100, Math.max(0, progress)),
        completed: completed ?? progress >= 95,
        lastWatchedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        courseId,
        progress: Math.min(100, Math.max(0, progress)),
        completed: completed ?? progress >= 95,
      },
    });

    return NextResponse.json(videoProgress);
  } catch (error) {
    console.error('[VIDEO_PROGRESS_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// GET - Récupérer la progression de l'utilisateur
export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Vous devez être connecté.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (courseId) {
    const progress = await prisma.videoProgress.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId,
        },
      },
    });

    return NextResponse.json(progress || { progress: 0, completed: false });
  }

  // Toute la progression de l'utilisateur
  const allProgress = await prisma.videoProgress.findMany({
    where: { userId: session.user.id },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          thumbnail: true,
          duration: true,
          level: true,
          theme: true,
        },
      },
    },
    orderBy: { lastWatchedAt: 'desc' },
  });

  return NextResponse.json(allProgress);
}

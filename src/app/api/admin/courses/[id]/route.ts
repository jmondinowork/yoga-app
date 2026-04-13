import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteR2Folder } from '@/lib/r2';
import { z } from 'zod/v4';
import { sendNewCourseNotification } from '@/lib/email';
import { generateThumbnailFromVideo } from '@/lib/thumbnail';

const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).optional(),
  thumbnail: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.number().int().positive().optional(),
  theme: z.string().min(2).optional(),
  price: z.number().min(0).optional().nullable(),
  includedInSubscription: z.boolean().optional(),
  availableForRental: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

// GET - Détail d'un cours
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      _count: {
        select: { purchases: true, progress: true },
      },
    },
  });

  if (!course) {
    return NextResponse.json({ error: 'Cours introuvable' }, { status: 404 });
  }

  return NextResponse.json(course);
}

// PATCH - Modifier un cours
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const data = updateCourseSchema.parse(body);

    // Vérifier que le cours existe
    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Cours introuvable' },
        { status: 404 }
      );
    }

    // Vérifier l'unicité du slug si modifié
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.course.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Ce slug est déjà utilisé.' },
          { status: 409 }
        );
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data,
    });

    // Auto-generate thumbnail from video first frame if no thumbnail
    const finalThumbnail = data.thumbnail ?? existing.thumbnail;
    const finalVideoUrl = data.videoUrl ?? existing.videoUrl;
    if (!finalThumbnail && finalVideoUrl) {
      const slug = data.slug ?? existing.slug;
      const thumbKey = `cours/${slug}/thumbnail.jpg`;
      generateThumbnailFromVideo(finalVideoUrl, thumbKey).then(async (key) => {
        if (key) {
          await prisma.course.update({ where: { id }, data: { thumbnail: key } });
        }
      }).catch((err) => console.error('[AUTO_THUMBNAIL_ERROR]', err));
    }

    // Envoyer email de notification si le cours vient d'être publié
    if (data.isPublished === true && !existing.isPublished) {
      const recipients = await prisma.user.findMany({
        where: { notifNewCourses: true },
        select: { email: true, name: true },
      });
      sendNewCourseNotification({
        courseTitle: course.title,
        courseSlug: course.slug,
        courseDuration: course.duration,
        courseTheme: course.theme,
        courseThumbnail: course.thumbnail,
        recipients,
      }).catch((err) => console.error('[EMAIL_NOTIF_ERROR]', err));
    }

    revalidateTag('admin-dashboard', 'max');
    return NextResponse.json(course);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[ADMIN_COURSE_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un cours
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.course.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json(
      { error: 'Cours introuvable' },
      { status: 404 }
    );
  }

  await prisma.course.delete({ where: { id } });
  revalidateTag('admin-dashboard', 'max');

  // Nettoyage des fichiers R2 associés
  try {
    await deleteR2Folder(`cours/${existing.slug}/`);
  } catch (err) {
    console.error('[R2_CLEANUP_ERROR]', err);
  }

  return NextResponse.json({ success: true });
}

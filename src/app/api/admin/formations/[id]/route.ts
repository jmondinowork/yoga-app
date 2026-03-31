import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteR2Folder } from '@/lib/r2';
import { z } from 'zod/v4';
import { sendNewFormationNotification } from '@/lib/email';
import { generateThumbnailFromVideo } from '@/lib/thumbnail';

const videoSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnail: z.string().optional(),
  duration: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

const updateFormationSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).optional(),
  thumbnail: z.string().optional().nullable(),
  bookletUrl: z.string().optional().nullable(),
  price: z.number().min(0).optional().nullable(),
  isPublished: z.boolean().optional(),
  videos: z.array(videoSchema).optional(),
});

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

// GET - Détail d'une formation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;

  const formation = await prisma.formation.findUnique({
    where: { id },
    include: {
      videos: {
        orderBy: { sortOrder: 'asc' },
      },
      _count: {
        select: { purchases: true, videos: true },
      },
    },
  });

  if (!formation) {
    return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 });
  }

  return NextResponse.json(formation);
}

// PATCH - Modifier une formation
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
    const { videos, ...data } = updateFormationSchema.parse(body);

    const existing = await prisma.formation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 });
    }

    // Vérifier l'unicité du slug si modifié
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.formation.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: 'Ce slug est déjà utilisé.' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour la formation et gérer les vidéos
    const formation = await prisma.$transaction(async (tx) => {
      // Mettre à jour les infos de la formation
      await tx.formation.update({
        where: { id },
        data,
      });

      // Gérer les vidéos si fournies
      if (videos) {
        // Récupérer les vidéos existantes
        const existingVideos = await tx.formationVideo.findMany({
          where: { formationId: id },
        });
        const existingIds = existingVideos.map((v) => v.id);
        const incomingIds = videos.filter((v) => v.id).map((v) => v.id!);

        // Supprimer les vidéos qui ne sont plus dans la liste
        const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.formationVideo.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Mettre à jour ou créer les vidéos
        for (const video of videos) {
          if (video.id && existingIds.includes(video.id)) {
            const { id: videoId, ...videoData } = video;
            await tx.formationVideo.update({
              where: { id: videoId },
              data: videoData,
            });
          } else {
            const { id: _videoId, ...videoData } = video; // eslint-disable-line @typescript-eslint/no-unused-vars
            await tx.formationVideo.create({
              data: { formationId: id, ...videoData },
            });
          }
        }
      }

      // Retourner la formation mise à jour
      return tx.formation.findUnique({
        where: { id },
        include: {
          videos: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { purchases: true, videos: true } },
        },
      });
    });

    // Auto-generate thumbnail from first video if no thumbnail
    const finalThumbnail = data.thumbnail ?? existing.thumbnail;
    if (!finalThumbnail && formation) {
      const formationVideos = formation.videos;
      const firstVideo = formationVideos?.[0];
      if (firstVideo?.videoUrl) {
        const slug = data.slug ?? existing.slug;
        const videoKey = firstVideo.videoUrl.includes("/")
          ? firstVideo.videoUrl
          : `formations/${slug}/videos/${firstVideo.videoUrl}`;
        const thumbKey = `formations/${slug}/thumbnail.jpg`;
        generateThumbnailFromVideo(videoKey, thumbKey).then(async (key) => {
          if (key) {
            await prisma.formation.update({ where: { id }, data: { thumbnail: key } });
          }
        }).catch((err) => console.error('[AUTO_THUMBNAIL_ERROR]', err));
      }
    }

    // Envoyer email de notification si la formation vient d'être publiée
    if (data.isPublished === true && !existing.isPublished) {
      const recipients = await prisma.user.findMany({
        where: { notifNewCourses: true },
        select: { email: true, name: true },
      });
      const slug = (formation as NonNullable<typeof formation>)?.slug ?? existing.slug;
      const title = (formation as NonNullable<typeof formation>)?.title ?? existing.title;
      const thumbnail = (formation as NonNullable<typeof formation>)?.thumbnail ?? existing.thumbnail;
      const price = (formation as NonNullable<typeof formation>)?.price ?? existing.price;
      sendNewFormationNotification({
        formationTitle: title,
        formationSlug: slug,
        formationThumbnail: thumbnail,
        formationPrice: price,
        recipients,
      }).catch((err) => console.error('[EMAIL_NOTIF_ERROR]', err));
    }

    return NextResponse.json(formation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[ADMIN_FORMATION_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une formation
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { id } = await params;

  const existing = await prisma.formation.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: 'Formation introuvable' }, { status: 404 });
  }

  await prisma.formation.delete({ where: { id } });

  // Nettoyage des fichiers R2 associés
  try {
    await deleteR2Folder(`formations/${existing.slug}/`);
  } catch (err) {
    console.error('[R2_CLEANUP_ERROR]', err);
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';
import { generateThumbnailFromVideo } from '@/lib/thumbnail';

// Schéma de validation
const courseSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  description: z.string().min(10, 'La description est trop courte'),
  thumbnail: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.number().int().positive('La durée doit être positive'),
  theme: z.string().min(2),
  price: z.number().min(0).optional(),
  includedInSubscription: z.boolean().default(true),
  availableForRental: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

// Vérification admin
async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

// GET - Liste des cours
export async function GET(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: 'insensitive' as const } },
          { theme: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        thumbnail: true,
        videoUrl: true,
        duration: true,
        theme: true,
        price: true,
        includedInSubscription: true,
        availableForRental: true,
        isPublished: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { purchases: true, progress: true },
        },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json(
    {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      headers: {
        'Cache-Control': 'private, s-maxage=30, stale-while-revalidate=60',
      },
    }
  );
}

// POST - Créer un cours
export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = courseSchema.parse(body);

    // Vérifier l'unicité du slug
    const existing = await prisma.course.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé.' },
        { status: 409 }
      );
    }

    const course = await prisma.course.create({ data });

    // Auto-generate thumbnail from video first frame if no thumbnail provided
    if (!data.thumbnail && data.videoUrl) {
      const thumbKey = `cours/${data.slug}/thumbnail.jpg`;
      generateThumbnailFromVideo(data.videoUrl, thumbKey).then(async (key) => {
        if (key) {
          await prisma.course.update({ where: { id: course.id }, data: { thumbnail: key } });
        }
      }).catch((err) => console.error('[AUTO_THUMBNAIL_ERROR]', err));
    }

    revalidateTag('admin-dashboard', 'max');
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[ADMIN_COURSE_CREATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour en lot (multi-select)
const bulkUpdateSchema = z.object({
  ids: z.array(z.string()).min(1),
  data: z.object({
    price: z.number().min(0).optional().nullable(),
    includedInSubscription: z.boolean().optional(),
    availableForRental: z.boolean().optional(),
    isPublished: z.boolean().optional(),
  }),
});

export async function PATCH(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { ids, data } = bulkUpdateSchema.parse(body);

    await prisma.course.updateMany({
      where: { id: { in: ids } },
      data,
    });

    revalidateTag('admin-dashboard', 'max');
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[ADMIN_COURSES_BULK_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

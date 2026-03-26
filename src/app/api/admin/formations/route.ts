import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';

const videoSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  thumbnail: z.string().optional(),
  duration: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

const formationSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/, 'Slug invalide'),
  description: z.string().min(10, 'La description est trop courte'),
  thumbnail: z.string().optional(),
  bookletUrl: z.string().optional(),
  price: z.number().min(0).optional(),
  isPublished: z.boolean().default(false),
  videos: z.array(videoSchema).optional(),
});

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return null;
  }
  return session;
}

// GET - Liste des formations
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
          { slug: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [formations, total] = await Promise.all([
    prisma.formation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        videos: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { purchases: true, videos: true },
        },
      },
    }),
    prisma.formation.count({ where }),
  ]);

  return NextResponse.json({
    formations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST - Créer une formation
export async function POST(req: NextRequest) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { videos, ...data } = formationSchema.parse(body);

    // Vérifier l'unicité du slug
    const existing = await prisma.formation.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Ce slug est déjà utilisé.' },
        { status: 409 }
      );
    }

    const formation = await prisma.formation.create({
      data: {
        ...data,
        videos: videos?.length
          ? {
              create: videos.map((v, i) => ({
                ...v,
                sortOrder: v.sortOrder || i + 1,
              })),
            }
          : undefined,
      },
      include: {
        videos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    return NextResponse.json(formation, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[ADMIN_FORMATION_CREATE_ERROR]', error);
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

    await prisma.formation.updateMany({
      where: { id: { in: ids } },
      data,
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }
    console.error('[ADMIN_FORMATIONS_BULK_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod/v4';

const updateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().min(10).optional(),
  thumbnail: z.string().optional(),
  videoUrl: z.string().optional(),
  duration: z.number().int().positive().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  theme: z.string().min(2).optional(),
  price: z.number().min(0).optional().nullable(),
  isFree: z.boolean().optional(),
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
      formations: {
        include: { formation: true },
      },
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

  return NextResponse.json({ success: true });
}

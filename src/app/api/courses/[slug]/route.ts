import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Détail d'un cours public (par slug)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const course = await prisma.course.findUnique({
    where: { slug, isPublished: true },
    include: {
      formations: {
        include: {
          formation: {
            select: {
              id: true,
              title: true,
              slug: true,
              description: true,
              price: true,
            },
          },
        },
      },
    },
  });

  if (!course) {
    return NextResponse.json(
      { error: 'Cours introuvable' },
      { status: 404 }
    );
  }

  return NextResponse.json(course);
}

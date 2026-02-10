import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Liste des cours publics
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const theme = searchParams.get('theme');
  const level = searchParams.get('level');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {
    isPublished: true,
  };

  if (theme) {
    where.theme = theme;
  }

  if (level && ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(level)) {
    where.level = level;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { theme: { contains: search, mode: 'insensitive' } },
    ];
  }

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
        duration: true,
        level: true,
        theme: true,
        price: true,
        isFree: true,
      },
    }),
    prisma.course.count({ where }),
  ]);

  return NextResponse.json({
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPresignedUrl } from '@/lib/r2';

// GET - Liste des cours publics
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const theme = searchParams.get('theme');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {
    isPublished: true,
  };

  if (theme) {
    where.theme = theme;
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
        theme: true,
        price: true,
        includedInSubscription: true,
        availableForRental: true,
      },
    }),
    prisma.course.count({ where }),
  ]);

  // Générer les presigned URLs pour les thumbnails R2
  const coursesWithThumbnails = await Promise.all(
    courses.map(async (course) => {
      if (course.thumbnail && !course.thumbnail.startsWith('http')) {
        try {
          const thumbnailUrl = await getPresignedUrl(course.thumbnail, 7200);
          return { ...course, thumbnail: thumbnailUrl };
        } catch {
          return { ...course, thumbnail: null };
        }
      }
      return course;
    })
  );

  const response = NextResponse.json({
    courses: coursesWithThumbnails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return response;
}

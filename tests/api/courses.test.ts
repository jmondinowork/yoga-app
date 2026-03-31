import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import { NextRequest } from 'next/server';

// Must import mock before the module under test
import '../mocks/prisma';

// Mock R2 presigned URLs
vi.mock('@/lib/r2', () => ({
  getPresignedUrl: vi.fn((key: string) => Promise.resolve(`https://r2.example.com/${key}`)),
}));

function createGetRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('GET /api/courses', () => {
  beforeEach(() => resetPrismaMock());

  it('retourne les cours publiés paginés', async () => {
    const mockCourses = [
      { id: '1', title: 'Yoga doux', slug: 'yoga-doux', isPublished: true, thumbnail: null },
      { id: '2', title: 'Power Yoga', slug: 'power-yoga', isPublished: true, thumbnail: null },
    ];

    prismaMock.course.findMany.mockResolvedValue(mockCourses);
    prismaMock.course.count.mockResolvedValue(2);

    const { GET } = await import('@/app/api/courses/route');
    const res = await GET(createGetRequest('http://localhost:3000/api/courses'));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.courses).toHaveLength(2);
    expect(json.pagination.total).toBe(2);
    expect(json.pagination.page).toBe(1);
  });

  it('filtre par thème', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.course.count.mockResolvedValue(0);

    const { GET } = await import('@/app/api/courses/route');
    await GET(createGetRequest('http://localhost:3000/api/courses?theme=Hatha'));

    expect(prismaMock.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ theme: 'Hatha', isPublished: true }),
      })
    );
  });

  it('effectue une recherche textuelle', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.course.count.mockResolvedValue(0);

    const { GET } = await import('@/app/api/courses/route');
    await GET(createGetRequest('http://localhost:3000/api/courses?search=vinyasa'));

    expect(prismaMock.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: { contains: 'vinyasa', mode: 'insensitive' } }),
          ]),
        }),
      })
    );
  });

  it('respecte la pagination', async () => {
    prismaMock.course.findMany.mockResolvedValue([]);
    prismaMock.course.count.mockResolvedValue(50);

    const { GET } = await import('@/app/api/courses/route');
    const res = await GET(createGetRequest('http://localhost:3000/api/courses?page=3&limit=10'));
    const json = await res.json();

    expect(json.pagination.page).toBe(3);
    expect(json.pagination.limit).toBe(10);
    expect(json.pagination.totalPages).toBe(5);
    expect(prismaMock.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 })
    );
  });
});

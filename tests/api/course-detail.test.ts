import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { NextRequest } from 'next/server';

import '../mocks/prisma';

const routeParams = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe('GET /api/courses/[slug]', () => {
  beforeEach(() => {
    resetPrismaMock();
  });

  it('retourne 404 si cours introuvable', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/courses/[slug]/route');
    const res = await GET(
      new NextRequest(new URL('http://localhost:3000/api/courses/nonexistent')),
      routeParams('nonexistent')
    );
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain('introuvable');
  });

  it('retourne 404 si cours non publié', async () => {
    // findUnique with isPublished: true will return null for unpublished courses
    prismaMock.course.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/courses/[slug]/route');
    const res = await GET(
      new NextRequest(new URL('http://localhost:3000/api/courses/draft-course')),
      routeParams('draft-course')
    );
    expect(res.status).toBe(404);
  });

  it('retourne le détail d\'un cours publié', async () => {
    const mockCourse = {
      id: 'c-1',
      title: 'Yoga Vinyasa',
      slug: 'yoga-vinyasa',
      description: 'Un cours de yoga vinyasa',
      duration: 45,
      theme: 'Vinyasa',
      price: 5.99,
      isPublished: true,
    };
    prismaMock.course.findUnique.mockResolvedValue(mockCourse);

    const { GET } = await import('@/app/api/courses/[slug]/route');
    const res = await GET(
      new NextRequest(new URL('http://localhost:3000/api/courses/yoga-vinyasa')),
      routeParams('yoga-vinyasa')
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.title).toBe('Yoga Vinyasa');
    expect(json.slug).toBe('yoga-vinyasa');
    expect(json.price).toBe(5.99);
  });

  it('filtre par slug ET isPublished', async () => {
    prismaMock.course.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/courses/[slug]/route');
    await GET(
      new NextRequest(new URL('http://localhost:3000/api/courses/test')),
      routeParams('test')
    );

    expect(prismaMock.course.findUnique).toHaveBeenCalledWith({
      where: { slug: 'test', isPublished: true },
    });
  });

  it('est accessible sans authentification (route publique)', async () => {
    prismaMock.course.findUnique.mockResolvedValue({
      id: 'c-1', title: 'Public Course', slug: 'public-course', isPublished: true,
    });

    const { GET } = await import('@/app/api/courses/[slug]/route');
    const res = await GET(
      new NextRequest(new URL('http://localhost:3000/api/courses/public-course')),
      routeParams('public-course')
    );

    expect(res.status).toBe(200);
  });
});

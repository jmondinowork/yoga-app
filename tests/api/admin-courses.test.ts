import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { authMock, mockAdminSession, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

function createRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('Admin API /api/admin/courses', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  describe('GET', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession); // user normal

      const { GET } = await import('@/app/api/admin/courses/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/courses'));
      expect(res.status).toBe(403);
    });

    it('retourne 403 si non connecté', async () => {
      setSession(null);

      const { GET } = await import('@/app/api/admin/courses/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/courses'));
      expect(res.status).toBe(403);
    });

    it('retourne les cours pour un admin', async () => {
      prismaMock.course.findMany.mockResolvedValue([
        { id: '1', title: 'Yoga Doux', _count: { purchases: 3, progress: 10 } },
      ]);
      prismaMock.course.count.mockResolvedValue(1);

      const { GET } = await import('@/app/api/admin/courses/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/courses'));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.courses).toHaveLength(1);
      expect(json.courses[0]._count.purchases).toBe(3);
    });

    it('effectue une recherche admin', async () => {
      prismaMock.course.findMany.mockResolvedValue([]);
      prismaMock.course.count.mockResolvedValue(0);

      const { GET } = await import('@/app/api/admin/courses/route');
      await GET(createRequest('http://localhost:3000/api/admin/courses?search=yoga'));

      expect(prismaMock.course.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'yoga', mode: 'insensitive' } }),
            ]),
          }),
        })
      );
    });
  });

  describe('POST', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);

      const { POST } = await import('@/app/api/admin/courses/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      }));
      expect(res.status).toBe(403);
    });

    it('valide les données avec Zod et rejette les données invalides', async () => {
      const { POST } = await import('@/app/api/admin/courses/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({ title: 'T' }), // trop court
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBe('Données invalides');
    });

    it('rejette un slug dupliqué', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: 'existing' });

      const { POST } = await import('@/app/api/admin/courses/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Yoga Matinal',
          slug: 'yoga-matinal',
          description: 'Un cours de yoga du matin pour bien commencer la journée.',
          duration: 30,
          level: 'BEGINNER',
          theme: 'Hatha',
        }),
      }));
      expect(res.status).toBe(409);
    });

    it('crée un cours avec des données valides', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);
      const newCourse = {
        id: 'new-1',
        title: 'Yoga Matinal',
        slug: 'yoga-matinal',
        description: 'Un cours de yoga du matin pour bien commencer la journée.',
        duration: 30,
        level: 'BEGINNER',
        theme: 'Hatha',
      };
      prismaMock.course.create.mockResolvedValue(newCourse);

      const { POST } = await import('@/app/api/admin/courses/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/courses', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Yoga Matinal',
          slug: 'yoga-matinal',
          description: 'Un cours de yoga du matin pour bien commencer la journée.',
          duration: 30,
          level: 'BEGINNER',
          theme: 'Hatha',
        }),
      }));

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.title).toBe('Yoga Matinal');
    });
  });

  describe('PATCH (bulk)', () => {
    it('met à jour en lots', async () => {
      prismaMock.course.updateMany.mockResolvedValue({ count: 3 });

      const { PATCH } = await import('@/app/api/admin/courses/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/courses', {
        method: 'PATCH',
        body: JSON.stringify({
          ids: ['a', 'b', 'c'],
          data: { price: 29.99, isPublished: true },
        }),
      }));

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.count).toBe(3);
    });

    it('met à jour le prix à null (suppression du prix)', async () => {
      prismaMock.course.updateMany.mockResolvedValue({ count: 1 });

      const { PATCH } = await import('@/app/api/admin/courses/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/courses', {
        method: 'PATCH',
        body: JSON.stringify({
          ids: ['a'],
          data: { price: null },
        }),
      }));

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(prismaMock.course.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ price: null }),
        })
      );
    });

    it('met à jour l\'inclusion dans l\'abonnement', async () => {
      prismaMock.course.updateMany.mockResolvedValue({ count: 2 });

      const { PATCH } = await import('@/app/api/admin/courses/route');
      const res = await PATCH(createRequest('http://localhost:3000/api/admin/courses', {
        method: 'PATCH',
        body: JSON.stringify({
          ids: ['a', 'b'],
          data: { includedInSubscription: false },
        }),
      }));

      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});

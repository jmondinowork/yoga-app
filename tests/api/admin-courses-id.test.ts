import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { authMock, mockAdminSession, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

function createRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const routeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe('Admin API /api/admin/courses/[id]', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  describe('GET', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);

      const { GET } = await import('@/app/api/admin/courses/[id]/route');
      const res = await GET(
        createRequest('http://localhost:3000/api/admin/courses/abc'),
        routeParams('abc')
      );
      expect(res.status).toBe(403);
    });

    it('retourne 404 si cours introuvable', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/admin/courses/[id]/route');
      const res = await GET(
        createRequest('http://localhost:3000/api/admin/courses/abc'),
        routeParams('abc')
      );
      expect(res.status).toBe(404);
    });

    it('retourne le cours avec les counts', async () => {
      prismaMock.course.findUnique.mockResolvedValue({
        id: 'abc',
        title: 'Yoga',
        _count: { purchases: 5, progress: 20 },
      });

      const { GET } = await import('@/app/api/admin/courses/[id]/route');
      const res = await GET(
        createRequest('http://localhost:3000/api/admin/courses/abc'),
        routeParams('abc')
      );
      const json = await res.json();
      expect(json._count.purchases).toBe(5);
    });
  });

  describe('PATCH', () => {
    it('retourne 404 si cours introuvable', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      const { PATCH } = await import('@/app/api/admin/courses/[id]/route');
      const res = await PATCH(
        createRequest('http://localhost:3000/api/admin/courses/abc', {
          method: 'PATCH',
          body: JSON.stringify({ title: 'New Title' }),
        }),
        routeParams('abc')
      );
      expect(res.status).toBe(404);
    });

    it('rejette un slug dupliqué', async () => {
      prismaMock.course.findUnique
        .mockResolvedValueOnce({ id: 'abc', slug: 'old-slug' }) // existing course
        .mockResolvedValueOnce({ id: 'other', slug: 'new-slug' }); // slug clash

      const { PATCH } = await import('@/app/api/admin/courses/[id]/route');
      const res = await PATCH(
        createRequest('http://localhost:3000/api/admin/courses/abc', {
          method: 'PATCH',
          body: JSON.stringify({ slug: 'new-slug' }),
        }),
        routeParams('abc')
      );
      expect(res.status).toBe(409);
    });

    it('met à jour le cours', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: 'abc', slug: 'yoga' });
      prismaMock.course.update.mockResolvedValue({ id: 'abc', title: 'Updated', slug: 'yoga' });

      const { PATCH } = await import('@/app/api/admin/courses/[id]/route');
      const res = await PATCH(
        createRequest('http://localhost:3000/api/admin/courses/abc', {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated' }),
        }),
        routeParams('abc')
      );
      const json = await res.json();
      expect(json.title).toBe('Updated');
    });
  });

  describe('DELETE', () => {
    it('retourne 404 si cours introuvable', async () => {
      prismaMock.course.findUnique.mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/admin/courses/[id]/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/admin/courses/abc', { method: 'DELETE' }),
        routeParams('abc')
      );
      expect(res.status).toBe(404);
    });

    it('supprime le cours', async () => {
      prismaMock.course.findUnique.mockResolvedValue({ id: 'abc' });
      prismaMock.course.delete.mockResolvedValue({ id: 'abc' });

      const { DELETE } = await import('@/app/api/admin/courses/[id]/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/admin/courses/abc', { method: 'DELETE' }),
        routeParams('abc')
      );
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockAdminSession, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

function createRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

const validEventPayload = {
  title: 'Yoga Matinal',
  description: 'Un cours de yoga doux pour bien commencer la journée',
  meetingLink: 'https://meet.example.com/yoga',
  startTime: '2026-04-07T09:00:00.000Z',
  duration: 60,
  recurrence: 'NONE',
  recurrenceEnd: null,
  maxParticipants: 20,
  theme: 'Général',
  isPublished: true,
};

describe('Admin API /api/admin/events', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  describe('GET', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);

      const { GET } = await import('@/app/api/admin/events/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/events'));
      expect(res.status).toBe(403);
    });

    it('retourne 403 si non connecté', async () => {
      setSession(null);

      const { GET } = await import('@/app/api/admin/events/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/events'));
      expect(res.status).toBe(403);
    });

    it('retourne la liste des événements pour un admin', async () => {
      prismaMock.liveEvent.findMany.mockResolvedValue([
        { id: 'ev-1', title: 'Yoga Doux', _count: { registrations: 3 } },
      ]);
      prismaMock.liveEvent.count.mockResolvedValue(1);

      const { GET } = await import('@/app/api/admin/events/route');
      const res = await GET(createRequest('http://localhost:3000/api/admin/events'));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.events).toHaveLength(1);
      expect(json.events[0].title).toBe('Yoga Doux');
      expect(json.pagination.total).toBe(1);
    });

    it('effectue une recherche par titre ou thème', async () => {
      prismaMock.liveEvent.findMany.mockResolvedValue([]);
      prismaMock.liveEvent.count.mockResolvedValue(0);

      const { GET } = await import('@/app/api/admin/events/route');
      await GET(createRequest('http://localhost:3000/api/admin/events?search=yoga'));

      expect(prismaMock.liveEvent.findMany).toHaveBeenCalledWith(
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

      const { POST } = await import('@/app/api/admin/events/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(validEventPayload),
      }));
      expect(res.status).toBe(403);
    });

    it('crée un événement avec slug auto-généré', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue(null); // pas de slug existant
      prismaMock.liveEvent.create.mockResolvedValue({
        id: 'ev-new',
        ...validEventPayload,
        slug: 'yoga-matinal',
      });

      const { POST } = await import('@/app/api/admin/events/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(validEventPayload),
      }));
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.slug).toBe('yoga-matinal');
      expect(prismaMock.liveEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'Yoga Matinal',
            slug: 'yoga-matinal',
          }),
        })
      );
    });

    it('ajoute un suffixe au slug si un slug existe déjà', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue({ id: 'existing' }); // slug collision
      prismaMock.liveEvent.create.mockResolvedValue({
        id: 'ev-new',
        ...validEventPayload,
        slug: 'yoga-matinal-abc123',
      });

      const { POST } = await import('@/app/api/admin/events/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/events', {
        method: 'POST',
        body: JSON.stringify(validEventPayload),
      }));

      expect(res.status).toBe(201);
      // Le slug passé à create doit contenir un suffixe
      const createCall = prismaMock.liveEvent.create.mock.calls[0][0];
      expect(createCall.data.slug).toMatch(/^yoga-matinal-/);
    });

    it('retourne 400 pour des données invalides', async () => {
      const { POST } = await import('@/app/api/admin/events/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/events', {
        method: 'POST',
        body: JSON.stringify({ title: 'ab', description: 'court' }),
      }));
      const json = await res.json();

      expect(res.status).toBe(400);
      expect(json.error).toBe('Données invalides');
      expect(json.details).toBeDefined();
    });

    it('valide que meetingLink est une URL', async () => {
      const { POST } = await import('@/app/api/admin/events/route');
      const res = await POST(createRequest('http://localhost:3000/api/admin/events', {
        method: 'POST',
        body: JSON.stringify({
          ...validEventPayload,
          meetingLink: 'pas-une-url',
        }),
      }));

      expect(res.status).toBe(400);
    });
  });
});

describe('Admin API /api/admin/events/[id]', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockAdminSession);
  });

  const paramsPromise = Promise.resolve({ id: 'ev-1' });

  describe('GET', () => {
    it('retourne 403 si non admin', async () => {
      setSession(null);

      const { GET } = await import('@/app/api/admin/events/[id]/route');
      const res = await GET(
        createRequest('http://localhost:3000/api/admin/events/ev-1'),
        { params: paramsPromise }
      );
      expect(res.status).toBe(403);
    });

    it('retourne 404 si événement introuvable', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue(null);

      const { GET } = await import('@/app/api/admin/events/[id]/route');
      const res = await GET(
        createRequest('http://localhost:3000/api/admin/events/ev-1'),
        { params: paramsPromise }
      );
      expect(res.status).toBe(404);
    });

    it('retourne le détail d\'un événement', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue({
        id: 'ev-1',
        title: 'Yoga Doux',
        registrations: [],
        _count: { registrations: 5 },
      });

      const { GET } = await import('@/app/api/admin/events/[id]/route');
      const res = await GET(
        createRequest('http://localhost:3000/api/admin/events/ev-1'),
        { params: paramsPromise }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.title).toBe('Yoga Doux');
      expect(json._count.registrations).toBe(5);
    });
  });

  describe('PATCH', () => {
    it('retourne 403 si non admin', async () => {
      setSession(mockSession);

      const { PATCH } = await import('@/app/api/admin/events/[id]/route');
      const res = await PATCH(
        createRequest('http://localhost:3000/api/admin/events/ev-1', {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Nouveau titre' }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(403);
    });

    it('met à jour un événement', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue({
        id: 'ev-1',
        title: 'Ancien titre',
        slug: 'ancien-titre',
      });
      prismaMock.liveEvent.update.mockResolvedValue({
        id: 'ev-1',
        title: 'Nouveau titre',
        slug: 'nouveau-titre',
      });

      const { PATCH } = await import('@/app/api/admin/events/[id]/route');
      const res = await PATCH(
        createRequest('http://localhost:3000/api/admin/events/ev-1', {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Nouveau titre' }),
        }),
        { params: paramsPromise }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.title).toBe('Nouveau titre');
    });

    it('retourne 404 si événement introuvable', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue(null);

      const { PATCH } = await import('@/app/api/admin/events/[id]/route');
      const res = await PATCH(
        createRequest('http://localhost:3000/api/admin/events/ev-1', {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Nouveau titre' }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(404);
    });

    it('régénère le slug quand le titre change', async () => {
      prismaMock.liveEvent.findUnique
        .mockResolvedValueOnce({ id: 'ev-1', title: 'Ancien titre', slug: 'ancien-titre' }) // existing
        .mockResolvedValueOnce(null); // slug lookup
      prismaMock.liveEvent.update.mockResolvedValue({
        id: 'ev-1',
        title: 'Nouveau Titre',
        slug: 'nouveau-titre',
      });

      const { PATCH } = await import('@/app/api/admin/events/[id]/route');
      await PATCH(
        createRequest('http://localhost:3000/api/admin/events/ev-1', {
          method: 'PATCH',
          body: JSON.stringify({ title: 'Nouveau Titre' }),
        }),
        { params: paramsPromise }
      );

      expect(prismaMock.liveEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'nouveau-titre',
          }),
        })
      );
    });

    it('ne change pas le slug si le titre ne change pas', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue({
        id: 'ev-1',
        title: 'Yoga Doux',
        slug: 'yoga-doux',
        isPublished: true,
      });
      prismaMock.liveEvent.update.mockResolvedValue({
        id: 'ev-1',
        isPublished: false,
      });

      const { PATCH } = await import('@/app/api/admin/events/[id]/route');
      await PATCH(
        createRequest('http://localhost:3000/api/admin/events/ev-1', {
          method: 'PATCH',
          body: JSON.stringify({ isPublished: false }),
        }),
        { params: paramsPromise }
      );

      const updateCall = prismaMock.liveEvent.update.mock.calls[0][0];
      expect(updateCall.data.slug).toBeUndefined();
    });

    it('retourne 400 pour des données invalides', async () => {
      const { PATCH } = await import('@/app/api/admin/events/[id]/route');
      const res = await PATCH(
        createRequest('http://localhost:3000/api/admin/events/ev-1', {
          method: 'PATCH',
          body: JSON.stringify({ duration: -5 }),
        }),
        { params: paramsPromise }
      );

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE', () => {
    it('retourne 403 si non admin', async () => {
      setSession(null);

      const { DELETE } = await import('@/app/api/admin/events/[id]/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/admin/events/ev-1', { method: 'DELETE' }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(403);
    });

    it('supprime un événement existant', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue({ id: 'ev-1' });
      prismaMock.liveEvent.delete.mockResolvedValue({ id: 'ev-1' });

      const { DELETE } = await import('@/app/api/admin/events/[id]/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/admin/events/ev-1', { method: 'DELETE' }),
        { params: paramsPromise }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(prismaMock.liveEvent.delete).toHaveBeenCalledWith({ where: { id: 'ev-1' } });
    });

    it('retourne 404 si événement introuvable', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue(null);

      const { DELETE } = await import('@/app/api/admin/events/[id]/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/admin/events/ev-1', { method: 'DELETE' }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(404);
    });
  });
});

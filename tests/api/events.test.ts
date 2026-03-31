import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock calendar lib pour le test de la route publique events
vi.mock('@/lib/calendar', () => ({
  generateOccurrences: vi.fn().mockReturnValue([]),
  isValidOccurrence: vi.fn().mockReturnValue(true),
}));

function createRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('Public API /api/events', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(null); // public par défaut
  });

  describe('GET /api/events', () => {
    it('retourne les événements pour un mois donné', async () => {
      prismaMock.liveEvent.findMany.mockResolvedValue([]);

      const { generateOccurrences } = await import('@/lib/calendar');
      (generateOccurrences as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const { GET } = await import('@/app/api/events/route');
      const res = await GET(createRequest('http://localhost:3000/api/events?month=2026-04'));
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.events).toEqual([]);
      expect(prismaMock.liveEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublished: true }),
        })
      );
    });

    it('ne retourne que les événements publiés', async () => {
      prismaMock.liveEvent.findMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/events/route');
      await GET(createRequest('http://localhost:3000/api/events?month=2026-04'));

      expect(prismaMock.liveEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublished: true }),
        })
      );
    });

    it('n\'expose pas le meetingLink dans la liste', async () => {
      const { generateOccurrences } = await import('@/lib/calendar');
      (generateOccurrences as ReturnType<typeof vi.fn>).mockReturnValue([
        {
          event: {
            id: 'ev-1',
            title: 'Yoga',
            slug: 'yoga',
            description: 'Desc',
            meetingLink: 'https://secret.link/123',
            duration: 60,
            theme: 'Général',
            maxParticipants: 20,
          },
          date: new Date('2026-04-07T09:00:00Z'),
          registrationCount: 5,
          isRegistered: false,
          isCancelled: false,
        },
      ]);
      prismaMock.liveEvent.findMany.mockResolvedValue([]);

      const { GET } = await import('@/app/api/events/route');
      const res = await GET(createRequest('http://localhost:3000/api/events?month=2026-04'));
      const json = await res.json();

      expect(json.events[0]).not.toHaveProperty('meetingLink');
      expect(json.events[0].spotsLeft).toBe(15);
    });

    it('fonctionne sans paramètre month (défaut: mois courant)', async () => {
      prismaMock.liveEvent.findMany.mockResolvedValue([]);

      const { generateOccurrences } = await import('@/lib/calendar');
      (generateOccurrences as ReturnType<typeof vi.fn>).mockReturnValue([]);

      const { GET } = await import('@/app/api/events/route');
      const res = await GET(createRequest('http://localhost:3000/api/events'));

      expect(res.status).toBe(200);
      expect(prismaMock.liveEvent.findMany).toHaveBeenCalled();
    });
  });
});

describe('Public API /api/events/[id]', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(null);
  });

  const paramsPromise = Promise.resolve({ id: 'ev-1' });

  it('retourne 404 si événement introuvable', async () => {
    prismaMock.liveEvent.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/events/[id]/route');
    const res = await GET(
      createRequest('http://localhost:3000/api/events/ev-1'),
      { params: paramsPromise }
    );

    expect(res.status).toBe(404);
  });

  it('retourne l\'événement sans meetingLink si non inscrit', async () => {
    prismaMock.liveEvent.findUnique.mockResolvedValue({
      id: 'ev-1',
      title: 'Yoga Doux',
      slug: 'yoga-doux',
      description: 'Description longue',
      meetingLink: 'https://meet.example.com/secret',
      duration: 60,
      theme: 'Général',
      maxParticipants: 20,
      isPublished: true,
    });

    const { GET } = await import('@/app/api/events/[id]/route');
    const res = await GET(
      createRequest('http://localhost:3000/api/events/ev-1'),
      { params: paramsPromise }
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.title).toBe('Yoga Doux');
    expect(json.meetingLink).toBeNull();
    expect(json.isRegistered).toBe(false);
  });

  it('retourne le meetingLink si inscrit et dans les 30 min', async () => {
    setSession(mockSession);

    const eventDate = new Date(Date.now() + 10 * 60 * 1000); // dans 10 min
    prismaMock.liveEvent.findUnique.mockResolvedValue({
      id: 'ev-1',
      title: 'Yoga',
      slug: 'yoga',
      description: 'Desc',
      meetingLink: 'https://meet.example.com/yoga',
      duration: 60,
      theme: 'Général',
      maxParticipants: 20,
      isPublished: true,
    });
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: 'reg-1',
      userId: 'user-1',
      eventId: 'ev-1',
      occurrenceDate: eventDate,
      cancelledAt: null,
    });

    const { GET } = await import('@/app/api/events/[id]/route');
    const res = await GET(
      createRequest(`http://localhost:3000/api/events/ev-1?date=${eventDate.toISOString()}`),
      { params: paramsPromise }
    );
    const json = await res.json();

    expect(json.meetingLink).toBe('https://meet.example.com/yoga');
    expect(json.isRegistered).toBe(true);
  });

  it('ne retourne pas le meetingLink si inscrit mais trop tôt', async () => {
    setSession(mockSession);

    const eventDate = new Date(Date.now() + 2 * 60 * 60 * 1000); // dans 2h
    prismaMock.liveEvent.findUnique.mockResolvedValue({
      id: 'ev-1',
      title: 'Yoga',
      slug: 'yoga',
      description: 'Desc',
      meetingLink: 'https://meet.example.com/yoga',
      duration: 60,
      theme: 'Général',
      maxParticipants: 20,
      isPublished: true,
    });
    prismaMock.eventRegistration.findUnique.mockResolvedValue({
      id: 'reg-1',
      userId: 'user-1',
      eventId: 'ev-1',
      occurrenceDate: eventDate,
      cancelledAt: null,
    });

    const { GET } = await import('@/app/api/events/[id]/route');
    const res = await GET(
      createRequest(`http://localhost:3000/api/events/ev-1?date=${eventDate.toISOString()}`),
      { params: paramsPromise }
    );
    const json = await res.json();

    expect(json.meetingLink).toBeNull();
    expect(json.isRegistered).toBe(true);
  });
});

describe('Public API /api/events/[id]/register', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
  });

  const paramsPromise = Promise.resolve({ id: 'ev-1' });

  describe('POST (inscription)', () => {
    it('retourne 401 si non connecté', async () => {
      setSession(null);

      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate: '2026-04-07T09:00:00Z' }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(401);
    });

    it('retourne 400 sans date d\'occurrence', async () => {
      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({}),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(400);
    });

    it('retourne 400 pour un événement passé', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate: pastDate }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(400);
    });

    it('retourne 404 si événement non publié', async () => {
      prismaMock.liveEvent.findUnique.mockResolvedValue(null);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate: futureDate }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(404);
    });

    it('retourne 409 si déjà inscrit', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      prismaMock.liveEvent.findUnique.mockResolvedValue({
        id: 'ev-1',
        isPublished: true,
        recurrence: 'NONE',
        startTime: futureDate,
      });
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: 'reg-1',
        cancelledAt: null,
      });

      const { isValidOccurrence } = await import('@/lib/calendar');
      (isValidOccurrence as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate: futureDate.toISOString() }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(409);
    });

    it('retourne 409 si plus de places', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      prismaMock.liveEvent.findUnique.mockResolvedValue({
        id: 'ev-1',
        isPublished: true,
        maxParticipants: 2,
        recurrence: 'NONE',
        startTime: futureDate,
      });
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
      prismaMock.eventRegistration.count.mockResolvedValue(2); // full

      const { isValidOccurrence } = await import('@/lib/calendar');
      (isValidOccurrence as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate: futureDate.toISOString() }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(409);
    });

    it('crée une inscription avec succès', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      prismaMock.liveEvent.findUnique.mockResolvedValue({
        id: 'ev-1',
        isPublished: true,
        maxParticipants: 20,
        recurrence: 'NONE',
        startTime: futureDate,
      });
      prismaMock.eventRegistration.findUnique.mockResolvedValue(null);
      prismaMock.eventRegistration.count.mockResolvedValue(5);
      prismaMock.eventRegistration.create.mockResolvedValue({ id: 'reg-new' });

      const { isValidOccurrence } = await import('@/lib/calendar');
      (isValidOccurrence as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate: futureDate.toISOString() }),
        }),
        { params: paramsPromise }
      );
      const json = await res.json();

      expect(res.status).toBe(201);
      expect(json.success).toBe(true);
      expect(prismaMock.eventRegistration.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            eventId: 'ev-1',
          }),
        })
      );
    });

    it('réactive une inscription annulée', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      prismaMock.liveEvent.findUnique.mockResolvedValue({
        id: 'ev-1',
        isPublished: true,
        maxParticipants: 20,
        recurrence: 'NONE',
        startTime: futureDate,
      });
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: 'reg-old',
        cancelledAt: new Date(), // was cancelled
      });
      prismaMock.eventRegistration.count.mockResolvedValue(3);
      prismaMock.eventRegistration.update.mockResolvedValue({ id: 'reg-old', cancelledAt: null });

      const { isValidOccurrence } = await import('@/lib/calendar');
      (isValidOccurrence as ReturnType<typeof vi.fn>).mockReturnValue(true);

      const { POST } = await import('@/app/api/events/[id]/register/route');
      const res = await POST(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate: futureDate.toISOString() }),
        }),
        { params: paramsPromise }
      );

      expect(res.status).toBe(201);
      expect(prismaMock.eventRegistration.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'reg-old' },
          data: { cancelledAt: null },
        })
      );
    });
  });

  describe('DELETE (annulation)', () => {
    it('retourne 401 si non connecté', async () => {
      setSession(null);

      const { DELETE } = await import('@/app/api/events/[id]/register/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'DELETE',
          body: JSON.stringify({ occurrenceDate: '2026-04-07T09:00:00Z' }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(401);
    });

    it('retourne 400 si annulation trop tardive (< 1h)', async () => {
      const soonDate = new Date(Date.now() + 30 * 60 * 1000); // dans 30 min

      const { DELETE } = await import('@/app/api/events/[id]/register/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'DELETE',
          body: JSON.stringify({ occurrenceDate: soonDate.toISOString() }),
        }),
        { params: paramsPromise }
      );
      expect(res.status).toBe(400);
    });

    it('annule une inscription avec succès', async () => {
      const futureDate = new Date(Date.now() + 3 * 60 * 60 * 1000); // dans 3h
      prismaMock.eventRegistration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: 'user-1',
        eventId: 'ev-1',
        cancelledAt: null,
      });
      prismaMock.eventRegistration.update.mockResolvedValue({
        id: 'reg-1',
        cancelledAt: expect.any(Date),
      });

      const { DELETE } = await import('@/app/api/events/[id]/register/route');
      const res = await DELETE(
        createRequest('http://localhost:3000/api/events/ev-1/register', {
          method: 'DELETE',
          body: JSON.stringify({ occurrenceDate: futureDate.toISOString() }),
        }),
        { params: paramsPromise }
      );
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });
});

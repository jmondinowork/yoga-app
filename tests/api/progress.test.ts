import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock, resetPrismaMock } from '../mocks/prisma';
import { authMock, mockSession, setSession } from '../mocks/auth';
import { NextRequest } from 'next/server';

import '../mocks/prisma';
import '../mocks/auth';

// Mock access helper
vi.mock('@/lib/helpers/access', () => ({
  canAccessCourse: vi.fn().mockResolvedValue(true),
  canAccessFormation: vi.fn().mockResolvedValue(true),
}));

function createRequest(url: string, init?: RequestInit) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

describe('POST /api/progress', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
  });

  it('retourne 401 si non connecté', async () => {
    setSession(null);

    const { POST } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c-1', progress: 50 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si données manquantes', async () => {
    const { POST } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c-1' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('crée/met à jour la progression vidéo', async () => {
    const mockProgress = { id: 'vp-1', userId: 'user-1', courseId: 'c-1', progress: 50, completed: false };
    prismaMock.videoProgress.upsert.mockResolvedValue(mockProgress);

    const { POST } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c-1', progress: 50 }),
    });
    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.progress).toBe(50);
    expect(prismaMock.videoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_courseId: { userId: 'user-1', courseId: 'c-1' } },
      })
    );
  });

  it('clamp la progression entre 0 et 100', async () => {
    prismaMock.videoProgress.upsert.mockResolvedValue({ progress: 100, completed: true });

    const { POST } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c-1', progress: 150 }),
    });
    await POST(req);

    expect(prismaMock.videoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ progress: 100 }),
      })
    );
  });

  it('marque comme complété si progress >= 95', async () => {
    prismaMock.videoProgress.upsert.mockResolvedValue({ progress: 96, completed: true });

    const { POST } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress', {
      method: 'POST',
      body: JSON.stringify({ courseId: 'c-1', progress: 96 }),
    });
    await POST(req);

    expect(prismaMock.videoProgress.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ completed: true }),
        create: expect.objectContaining({ completed: true }),
      })
    );
  });
});

describe('GET /api/progress', () => {
  beforeEach(() => {
    resetPrismaMock();
    setSession(mockSession);
  });

  it('retourne 401 si non connecté', async () => {
    setSession(null);

    const { GET } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retourne la progression d\'un cours spécifique', async () => {
    const mockProgress = { progress: 75, completed: false };
    prismaMock.videoProgress.findUnique.mockResolvedValue(mockProgress);

    const { GET } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress?courseId=c-1');
    const res = await GET(req);
    const json = await res.json();

    expect(json.progress).toBe(75);
  });

  it('retourne { progress: 0, completed: false } si pas de progression', async () => {
    prismaMock.videoProgress.findUnique.mockResolvedValue(null);

    const { GET } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress?courseId=c-1');
    const res = await GET(req);
    const json = await res.json();

    expect(json.progress).toBe(0);
    expect(json.completed).toBe(false);
  });

  it('retourne toutes les progressions sans courseId', async () => {
    const mockAll = [
      { progress: 50, completed: false, course: { id: 'c-1', title: 'Yoga' } },
      { progress: 100, completed: true, course: { id: 'c-2', title: 'Power' } },
    ];
    prismaMock.videoProgress.findMany.mockResolvedValue(mockAll);

    const { GET } = await import('@/app/api/progress/route');
    const req = createRequest('http://localhost:3000/api/progress');
    const res = await GET(req);
    const json = await res.json();

    expect(json).toHaveLength(2);
  });
});
